# TODO: make a prod version
FROM rust:buster

RUN cargo install cargo-watch

# Set current working directory inside container to /app
WORKDIR /app
COPY . .
RUN cargo build

RUN cargo build --manifest-path ./migration/Cargo.toml
# Expose port 8000 to the outside world
EXPOSE 8000
# TODO: dump rust tooling in prod version
# Run the dev server
ENTRYPOINT src/entrypoint.sh
