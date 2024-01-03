set -a # automatically export all variables
DATABASE_HOST=localhost
source .env.dev
set +a # stop exporting variables

docker compose up -d database

# run pending migrations
cargo run --manifest-path ./migration/Cargo.toml -- up

systemfd --no-pid -s http::5000 -- cargo watch -x run
