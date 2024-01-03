FROM rust:latest

RUN cargo install cargo-watch

# Set current working directory inside container to /app
WORKDIR /app
COPY . .
RUN cargo build

RUN cargo build --manifest-path ./migration/Cargo.toml

RUN rm .env
RUN mv .env.dev .env

# Expose port 8000 to the outside world
EXPOSE 8000

# Run the dev server
ENTRYPOINT src/entrypoint.sh
