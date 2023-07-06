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

# We can one-up that:
```rust

enum SyphonError {
    String(String),
    DbErr(DbErr),
}

impl From<DbError> for SyphonError { ... }
impl ResponseError for SyphonError { ... }

async fn test() -> Result<String, SyphonError> {
    let x = entities::users::Entity::find_by_id(0)
        .one(db())
        .await?;
        //    ^ Magic: Returns `Err(SyphonError::DbErr)` if `DbErr`
        //    Implements Response as InternalServerError

    Ok(String::new())
}
```

---

# All and One

- Get one or all results from a select query

```rust
pub async fn all<'a, C>(self, db: &C) -> Result<Vec<S::Item>, DbErr>;
pub async fn one<'a, C>(self, db: &C) -> Result<Option<E::Model>, DbErr>
where C: ConnectionTrait; // DatabaseConnection
```

---

# Example One

Get a user by zid:
```rust
let user: Option<entities::user::Model> = entities::users::Entity::find_by_id(0)
    .one(db)
    .await?; // Remove DbError with `?`
```
---

# All Example

```rust
// get all users from db
let users = entities::users::Entity::find()
    .select_only() // Only select the columns we need - Defualt gives u model

    // Followed by the columns we have
    .column(entities::users::Column::Zid)
    .column(entities::users::Column::FirstName)
    .column(entities::users::Column::LastName)
    .column(entities::users::Column::IsOrgAdmin)

    // Filter out org admins
    .filter(entities::users::Column::IsOrgAdmin.ne(true))
    .into_model::<UserReturnModel>()
    .all(db)
    .await?; // Remove DbError with `?`
```
---

# Models?

The following are autogenerated by SeaORM.
```rust
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub zid: i32,
    pub first_name: String,
    pub last_name: String,
    pub hashed_pw: String,
    pub is_org_admin: bool,
}
```

Also Generates
- `Entity` - `Column` - `ColumnIter` - `ActiveModel`

---
# Models? cont.

- Entity gives you access to methods on the table
- `Model` is just a struct of the data. Miminal Implementation. Represents actual data in the database
- `ActiveModel` represents some *potential* state change in the database. Is a mirror of `Model`
with everythign wrapped in `Set`, `UnSet`, or `Unchanged`
- To insert, create ActiveModel and call insert

---

# Active Model:
```rust
pub trait ActiveModelTrait: Clone + Debug {
    // An ActiveModel is mirrors a Model for an associated `Entity`   
    type Entity: EntityTrait;

// Show 16 methods
}
```

---

# Inserting with ActiveModel

With `insert`, we move away an `ActiveModel` (potential state change)
and get back a `Model` (actual state).

```rust
let course: Model = (entities::course_offerings::ActiveModel {
    course_offering_id: ActiveValue::NotSet, // Autoincrement column in DB
    course_code: ActiveValue::Set(body.course_code),
    title: ActiveValue::Set(body.title),
    tutor_invite_code: ActiveValue::Set(Some(gen_unique_inv_code().await)),
    start_date: ActiveValue::Set(body.start_date.unwrap_or_else(today)),
}).insert(db).await?
```

---
# Updating
```rust
let user: Model = ...;
users::ActiveModel {
    is_org_admin: ActiveValue::Set(true),
    ..user.into() // Similar to JS Spread
        //  ^ This is a `Into<ActiveModel>`
}
.update(db).await?;
```
Equivalent:
```rust
user::ActiveModel {
    is_org_admin: ActiveValue::Set(true),
    ..users::ActiveModel::from(user)
}.update(db).await?;
```

---
Also Equivalent:

```rust
let mut active_user = user::ActiveModel::from(user);
active_user.is_org_admin = ActiveValue::Set(true);
user::ActiveModel {
    is_org_admin: ActiveValue::Set(true),
    ..users::ActiveModel::from(user)
}.update(db).await?;
```

---
# Related Models
1. Find a model from the dat abase
2. Call the correct method (next slide) to get the related model

Example from Docs
```rust
// Find a cake model first
let cheese: Option<cake::Model> = Cake::find_by_id(1).one(db).await?;
let cheese: cake::Model = cheese.unwrap();

// Then, find all related fruits of this cake
let fruits: Vec<fruit::Model> = cheese.find_related(Fruit).all(db).await?;
```
Observe that `all` is still required to finish the call.

---
# The different relation queries

```rust
let user = User::find_by_id(1).one(db).await?;

let posts: Vec<Post> = user.find_related(Post).all(db).await?;
// One-to-One
let user_and_posts: Vec<(User, Post)> = User::find_also_related(Post).all(db).await?;
// One-to-One - Given the LHS - `find_with
let user_and_posts: Vec<(User, Post)> = user.find_with_related(Post).all(db).await?;

// one-to-man/many-to-many
let posts: Vec<junction::Model> = User::find().find_with_related().all(db).await?;
// ^ Junction table is smth we give
```

---
# Json
- After doing any of the above, we can *always* convert the model into
a `JsonValue`. This can be fine for testing but, loses type information

```rust
let admins = entities::users::Entity::find()
    .filter(entities::users::Column::IsOrgAdmin.eq(true))
    .order_by_asc(entities::users::Column::Zid)
    .into_json()
    .all(db)
    .await?;
```

---

# Doing a Join

```rust
fn join(mut self, join: JoinType, rel: RelationDef) -> Self {...}
```
- `JoinType` is an enum with `Left`, `Right`, `Inner`, `Outer`
- Simplify this with the `*_joins` like `inner_join`, `left_join` etc.
```rust
pub fn left_join<R>(self, _: R) -> Self
where
    R: EntityTrait,
    E: Related<R>
{ ... }
```

---
# Join w/ On the Fly Relation

```rust
entities::course_offerings::Entity::find()
    .inner_join(JoinType::InnerJoin, entities::queues::Relation::course_offering)
    .into_json()
    .all(db)
    .await?;
```

---

```rust
entities::course_offerings::Entity::find()
    .right_join(entities::users::Entity) // Directly get the table to join on
    .filter(entities::tutors::Column::Zid.eq(token.username))
    .into_json()
    .all(db)
    .await?;
```


---
# Custom Joins
- SeaOrm has generated all of the relations for us. As such, we *should*
be able to use the normal find relation methods to get the data we want.
- In the case that we need to do a custom join, we can use the `join` method
and define the relations on the fly. However, IMO, this is best avoid
and, the relation methods are probably the way to go.


---

# Filtering

```rust
entities::queues::Requests::find()
    .filter(
        Condition::all()
            .add(
                entities::queues::Requests::Column::CourseOfferingId
                    .eq(body.course_offering_id),
            )
            .add(
                entities::queues::Requests::Column::Status
                    .eq(RequestStatus::NotSeen),
            ),
    )
```
---

# Better Column Select

By default ALL columns are selcted. To select only the columns we need, we can
use:
```rust
use entities::user;

user::Entity::find_by_id(0)
    .select_only()
    .columns([user::Column::Zid, user::Column::FirstName])
    .into_json()
    .one(db)
    .await?;
```

---

# Column Select cont. Exlcuding Columns

```rust
use entities::user;
user::Entity::find()
    .select_only()
    .columns(user::Column::Iter.filter(|c| {
        match c {
            user::Column::HashedPw => false,
            _ => true,
        }
    }))
    .into_json()
    .one(db)
    .await?;
```

---

# After Select?

So we know how to write selection queries. However rust is strongly typed
and unless we are using `into_json`, we actually need to create a type
to represent the data we are selecting.


---
# Collect to Struct (IntoModel)

Create a custom struct and derive `FromQueryResult` on it.
```rust
#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct CourseOfferingReturnModel {
    pub course_offering_id: i32,
    pub course_code: String,
    pub title: String,
    pub start_date: Option<NaiveDate>,
    pub tutor_invite_code: Option<String>,
}
```

---
Then just call `into_model` on the query
```rust
let course_offering_result = entities::course_offerings::Entity::find()
    .select_only()
    .columns([
        entities::course_offerings::Column::CourseOfferingId,
        entities::course_offerings::Column::CourseCode,
        entities::course_offerings::Column::Title,
        entities::course_offerings::Column::StartDate,
        entities::course_offerings::Column::TutorInviteCode
    ])
    .into_model::<CourseOfferingReturnModel>()
    .all(db)
    .await?;
```

---
# Collect to Tuple
TODO

```rust
let result = entities::course_offering::Entity()
    .find()
    .select_only()
    .column(entities::course_offering::Column::CourseOfferingId)
```

