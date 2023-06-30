DATABASE_HOST='database'
# overwrite the DATABASE_URL
DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DATABASE_HOST}/${POSTGRES_DB}
cargo run --manifest-path ./migration/Cargo.toml -- up 

cargo watch -x run
