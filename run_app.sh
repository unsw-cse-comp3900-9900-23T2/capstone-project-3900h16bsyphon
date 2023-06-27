#!/bin/sh

exit_script() {
    # kill everything on 8000 and 3000
    lsof -i tcp:8000 -Fp | sed 's/^p//' | xargs -r kill
    lsof -i tcp:3000 -Fp | sed 's/^p//' | xargs -r kill
    trap - SIGINT SIGTERM # clear the trap
}

trap exit_script SIGINT SIGTERM

# a way to run the app using docker only for the database
# run only DB in docker
set -a # automatically export all variables
DATABASE_HOST=localhost
BACKEND_HOST=localhost
source backend/.env
set +a # stop exporting variables

docker compose up -d database

cd backend

# run pending migrations
cargo run --manifest-path ./migration/Cargo.toml -- up

# must have cargo, and cargo-watch
cargo run &

cd ../frontend
set -a # automatically export all variables
source .env
set +a # stop exporting variables
# must have run npm install
npm run dev
