FROM rust:alpine as builder

# muslc is required in order to build the rust image.
RUN apk add openssl-dev musl-dev
RUN rustup target add x86_64-unknown-linux-musl

WORKDIR /app

RUN mkdir migration
COPY ./migration/Cargo.toml ./migration/Cargo.toml
COPY ./migration/Cargo.lock ./migration/Cargo.lock
COPY ./migration/src ./migration/src
RUN cargo build --manifest-path ./migration/Cargo.toml --target x86_64-unknown-linux-musl --release


COPY ./Cargo.toml ./Cargo.toml
COPY ./Cargo.lock ./Cargo.lock
COPY ./.env ./.env
COPY ./run_prod.sh ./run_prod.sh
COPY ./src ./src
RUN cargo build --target x86_64-unknown-linux-musl --release

FROM alpine:latest

# certs required
RUN apk add pkgconfig openssl-dev
RUN apk --no-cache add ca-certificates 

# copy useful binaries
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/actix-demo .
COPY --from=builder /app/migration/target/x86_64-unknown-linux-musl/release/migration .
COPY --from=builder /app/run_prod.sh .

ENTRYPOINT src/run_prod.sh
