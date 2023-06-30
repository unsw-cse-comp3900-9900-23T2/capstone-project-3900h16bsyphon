FROM rust:alpine as builder

# muslc is required in order to build the rust image.
RUN apk add openssl-dev musl-dev
RUN rustup target add x86_64-unknown-linux-musl

WORKDIR /app

# install deps for migration
RUN mkdir migration
COPY ./migration/Cargo.toml ./migration
RUN mkdir migration/src
RUN echo "// dummy file" > migration/src/lib.rs
RUN cargo build --target x86_64-unknown-linux-musl --release --manifest-path ./migration/Cargo.toml

# install deps for backend
COPY ./Cargo.toml ./
RUN mkdir src
RUN echo "// dummy file" > src/lib.rs
RUN cargo build --target x86_64-unknown-linux-musl --release

# copy migration src and build it
COPY ./Cargo.lock ./
COPY ./migration/Cargo.lock ./migration
COPY ./migration/src ./migration/src
RUN cargo build --manifest-path ./migration/Cargo.toml --target x86_64-unknown-linux-musl --release

# copy backend src and build it
COPY ./src ./src
COPY ./.env ./.env
RUN cargo build --target x86_64-unknown-linux-musl --release


FROM alpine:3.8

# certs required
RUN apk add pkgconfig openssl-dev
RUN apk --no-cache add ca-certificates 

# copy useful binaries
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/actix-demo .
COPY --from=builder /app/migration/target/x86_64-unknown-linux-musl/release/migration .

CMD ./migration up && ./actix-demo
