---
marp: true
theme: uncover
_class: invert
paginate: true
---

# Backend Lets GOOOO

---

# Routes?

- Functions must be `async`
- The `actix` framework will handle the async for us

```rust
async fn hello_world() -> HttpResponse {
    HttpResponse::Ok().body("Hello world!")
}
```

---
# WTF Async?

- Syntax sugar for returning a `impl Future`
```rust
pub trait Future {
    type Output;

    // Required method
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```
- Futures are `inert`. Will only make progress when polled

---
## Polling
- Calling `.poll` will return a `Poll` enum
```rust
pub enum Poll<T> {
    Ready(T),
    Pending,
}
```
- A single poll will let the future do *some* work and return back a state.
They can keep getting polled until they are `Ready`

- This is `non-blocking` and allows us to do other work on the same thread while
waiting for the future to be ready.

---
### I Don't want to POLL??

- You can use the `await` keyword to wait for a future to be ready
- Let's see this in action

---
```rust
// `foo()` returns a type that implements `Future<Output = u8>`.
// `foo().await` will result in a value of type `u8`.
async fn foo() -> u8 { 5 }

fn bar() -> impl Future<Output = u8> {
    // This `async` block results in a type that implements
    // `Future<Output = u8>`.
    async {
        let x: u8 = foo().await;
        x + 5
    }
}
```
https://rust-lang.github.io/async-book/03_async_await/01_chapter.html

---
# Wtf Await????
- Very similar to `await` in javascript
- Suspends the current function until the future is ready
- Allows us to write async code in a synchronous style
- The main way that we will be writing async code
- If you do not await or poll, an object will be created but, nothing will
execute

---
# Writing Routes: Validation
- We've written middleware to handle validation
```rust
let amw = HttpAuthentication::bearer(validator);
```
- Needs to be `wrap`ped around the route
- **Guarantees**:
    - The user is authenticated
    - The user exists in the database

---

# Establishing a route

```rust
.route(
    "/course/create_offering",
    web::post()
        .to(server::course::create_offering)
        .wrap(amw.clone())
```

---

# Nesting
```rust
.service(
    scope("/user")
        .wrap(amw.clone())
        .route("list", web::get().to(server::user::get_users))
        .route("profile", web::get().to(server::user::get_user)
))
```
- No need to wrap `amw` on everything. Is inherited by the scope

---

# Writing the function

```rust
// In file `server/course.rs`
pub async fn create_offering(
// ^ Must be public + async so that it can be exported
    token: ReqData<TokenClaims>,
    // ^ Ensures that the user is authenticated
    body: web::Json<CreateOfferingBody>,
    // Middleware will also ensure that the body is valid
    // Better than using `serde` and dealing with
    // deserialise yourself
    // Will automatically `400` response if invalid
) -> HttpResponse {
```

---
```rust
struct FooBody {
    bar: String,
    baz: u32,
}

async fn foo(body: web::Json<FooBody>) -> HttpResponse {
    let body = body.into_inner();
    // ^? type of body is `FooBody`
    // web::Json::<T>::into_inner(self) -> T
}
```

---
# Writing/Calling Validators

```rust
pub async fn validate_admin(
    token: &ReqData<TokenClaims>,
    db: &DatabaseConnection,
) -> Result<(), HttpResponse>;
```

```rust
if let Err(err) = validate_admin(&token, db).await {
    return err;
}
```

---
# Connecting to DB

```rust
use crate::utils::db::db;

...

let db = db();
```

---
```rust
let db_course = entities::course_offerings::Entity::find_by_id(body.course_id)
    .one(db)
    .await // Gives `Result<Option<T>, DbErr>`
    .expect("db broke");
```
- expect on DbError
- Behaviour on the Option... depends
    - Validated Token users *will* exist. So, we can `expect` them.
    - If not, check for `None` and return the appropriate error

---

# All and One