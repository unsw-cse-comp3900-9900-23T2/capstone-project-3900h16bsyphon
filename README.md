# capstone-project-3900h16bsyphon

## how to run
### Docker
you have the option of using docker to run the project. This is recommended. 
run `docker compose up` for a dev environment,
or `docker compose -f docker-compose-prod.yaml up` for a prod environment

Caveats:

Make sure the ports of 8000, 5432, and 3000 are currently unused on your computer. These are exposed to allow
for the project to be exposed. If they are in use, one of a few things are going to happen:
8000 is used:
backend will say something like
```
ADDR already in use
```
then crash.

3000 is used:
frontend will say something that is **not**
```
running on localhost:3000
```
this will likely lead to cors errors.

5432 is used:
the database you connect to will NOT have syphon data in it, and instead be the one connected on that port. 
it may say something like "cannot find database 'syphon'" or "user 'syphon' does not exist"
Requests to the database will not cause logging to your docker container.

## local
first, ensure that systemfd and cargo-watch are installed:
```
cargo install systemfd
cargo install cargo-watch
```
in one terminal, run "cd backend; bash run_backend.sh"
in another, run "cd frontend; npm install; npm run dev"
