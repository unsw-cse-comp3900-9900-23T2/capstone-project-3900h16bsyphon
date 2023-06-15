# TODO: make a prod version
FROM rust:buster


# Set current working directory inside container to /app
WORKDIR /app

# Copy entire demo into the container
COPY . .

RUN cargo build
RUN cargo install cargo-watch
# Expose port 8000 to the outside world
EXPOSE 8000
# TODO: dump rust tooling in prod version
# Run the dev server
ENTRYPOINT cargo watch -x run
