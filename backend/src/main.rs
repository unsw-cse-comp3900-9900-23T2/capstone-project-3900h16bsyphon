use actix::Actor;
use actix_cors::Cors;
use actix_web::{
    http, middleware,
    web::{self, scope, Data},
    App, HttpServer,
};
use actix_web_httpauth::middleware::HttpAuthentication;

pub mod entities;
pub mod models;
pub mod prelude;
pub mod server;
pub mod sockets;
pub mod utils;

use crate::{prelude::*, sockets::lobby::Lobby};

use utils::auth::validator;
#[macro_use]
extern crate lazy_static;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    startup_logger();
    initialise_db();
    std::env::var("SECRET").expect("SECRET must be set");

    register_org_admins().await;
    let lobby = Data::new(Lobby::default().start());

    // Auth middleware
    let amw = HttpAuthentication::bearer(validator);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_origin("http://frontend:3000")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT])
            .allowed_header(http::header::CONTENT_TYPE)
            .expose_headers(&[actix_web::http::header::CONTENT_DISPOSITION])
            .supports_credentials()
            .max_age(3600);
        App::new()
            .wrap(middleware::Logger::default())
            .wrap(cors)
            .app_data(lobby.clone())
            .service(server::echo)
            .route("/", web::get().to(server::hello))
            .service(
                scope("/ws")
                    .route("/dumb", web::get().to(server::sockets::start_socket_conn))
                    .route(
                        "/announcements",
                        web::get().to(server::sockets::conn_announcements),
                    )
                    .route("/request", web::get().to(server::sockets::conn_request))
                    .route("/queue", web::get().to(server::sockets::conn_queue))
                    .route("/chat", web::get().to(server::sockets::conn_chat)),
            )
            .service(
                scope("/auth")
                    .route("/signup", web::post().to(server::auth::create_user))
                    .route("/login", web::post().to(server::auth::auth))
                    .route("/hello", web::get().to(server::hello).wrap(amw.clone())),
            )
            .service(
                scope("/user")
                    .wrap(amw.clone())
                    .route("list", web::get().to(server::user::get_users))
                    .route("profile", web::get().to(server::user::get_user)),
            )
            .service(
                scope("/course")
                    .wrap(amw.clone())
                    .route(
                        "/create_offering",
                        web::post().to(server::course::create_offering),
                    )
                    .route(
                        "/get_tutored",
                        web::get().to(server::course::get_courses_tutored),
                    )
                    .route("/get", web::get().to(server::course::get_offering_by_id))
                    .route("/list", web::get().to(server::course::get_offerings))
                    .route("/tags", web::get().to(server::course::fetch_course_tags))
                    .route(
                        "/join_with_tutor_link",
                        web::put().to(server::course::join_with_tutor_link),
                    )
                    .route(
                        "/get_courses_admined",
                        web::get().to(server::course::get_courses_admined),
                    )
                    .route(
                        "/add_tutor_to_courses",
                        web::put().to(server::course::add_tutor_to_courses),
                    ),
            )
            .service(
                scope("/request")
                    .wrap(amw.clone())
                    .route("/create", web::post().to(server::request::create_request))
                    .route("/edit", web::put().to(server::request::edit_request))
                    .route("/summary", web::get().to(server::request::request_summary))
                    .route(
                        "/get_info",
                        web::get().to(server::request::request_info_wrapper),
                    )
                    .route(
                        "/all_requests_for_queue",
                        web::get().to(server::request::all_requests_for_queue),
                    )
                    .route(
                        "/disable_cluster",
                        web::put().to(server::request::disable_cluster),
                    )
                    .route(
                        "/set_status",
                        web::put().to(server::request::set_request_status),
                    )
                    .route(
                        "/move_up",
                        web::post().to(server::request::move_request_ordering_up),
                    )
                    .route(
                        "/move_down",
                        web::post().to(server::request::move_request_ordering_down),
                    ),
            )
            .service(
                scope("/queue")
                    .wrap(amw.clone())
                    .route(
                        "/set_is_sorted_by_previous_request_count",
                        web::put().to(server::queue::set_is_sorted_by_previous_request_count),
                    )
                    .route("/create", web::post().to(server::queue::create_queue))
                    .route("/get", web::get().to(server::queue::get_queue_by_id))
                    .route("/summary", web::get().to(server::queue::get_queue_summary))
                    .route(
                        "/get_by_course",
                        web::get().to(server::queue::get_queues_by_course),
                    )
                    .route("/is_open", web::get().to(server::queue::get_is_open))
                    .route("/tags", web::get().to(server::queue::fetch_queue_tags))
                    .route(
                        "/tags/set_priority",
                        web::put().to(server::queue::update_tag_priority),
                    )
                    .route("/update", web::put().to(server::queue::update_queue))
                    .route(
                        "/get_student_count",
                        web::get().to(server::queue::get_student_count),
                    )
                    .route(
                        "/get_num_requests_until_close",
                        web::get().to(server::queue::num_requests_until_close),
                    )
                    .route("/close", web::put().to(server::queue::close_queue)),
            )
            .service(scope("/logs").wrap(amw.clone()).route(
                "/get_start_time",
                web::get().to(server::logs::get_start_time),
            ))
            .service(scope("/history").wrap(amw.clone()).route(
                "/previous_tags",
                web::get().to(server::history::get_previous_tag_details),
            ))
            .service(
                scope("/faqs")
                    .wrap(amw.clone())
                    .route("/create", web::post().to(server::faqs::create_faqs))
                    .route("/list", web::get().to(server::faqs::list_faqs))
                    .route("/delete", web::delete().to(server::faqs::delete_faqs))
                    .route("/update", web::put().to(server::faqs::update_faqs)),
            )
            .route("/{tail:.*}", web::get().to(server::res404))
            .route("/{tail:.*}", web::post().to(server::res404))
            .route("/{tail:.*}", web::put().to(server::res404))
    })
    .bind({
        let host = host_port_from_env();
        log::info!("Starting server at (Host, Port): {:?}", host);
        host
    })?
    .run()
    .await?;

    log::info!("Server ended. Exiting Now");

    Ok(())
}
