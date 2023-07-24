# capstone-project-3900h16bsyphon

## how to run
### Docker
you have the option of using docker to run the project. This is recommended. Follow these instructions: https://docs.docker.com/desktop/ to install docker if you don't have it already.
Then:

run `docker compose up` for a dev environment,


or `docker compose -f docker-compose-prod.yaml up` for a prod environment.

Developers, please use `docker compose up`.

Dear marker, please use `docker compose -f docker-compose-prod.yaml up`. This command should take about 20-30 minutes to complete depending on your internet connection and what images you may already have cached.

Caveats:

Make sure the ports **8000, 15432, and 3000** are currently unused on your computer. These are exposed to allow
for the project to be exposed. If they are in use, one of a few things are going to happen:


1. 8000 is used:

backend will say something like
```
ADDR already in use
```
then crash.

2. 3000 is used:

frontend will say something that is **not**
```
running on localhost:3000
```
this will likely lead to cors errors.

3. 15432 is used:


This often occurs if you installed postgres before and forgot to delete it after you stopped using it. 
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
