FROM rust:1.70.0-alpine as chef

# muslc is required in order to build the rust image.
RUN apk add openssl-dev musl-dev
RUN rustup target add x86_64-unknown-linux-musl

RUN cargo install cargo-chef

WORKDIR /app
FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json
RUN cd migration && cargo chef prepare --recipe-path recipe.json && cd ..

FROM chef AS builder

WORKDIR /app
COPY --from=planner /app/recipe.json recipe.json
COPY --from=planner /app/migration/recipe.json migration/recipe.json

RUN cargo chef cook --release --recipe-path recipe.json
RUN cd migration && cargo chef cook --release --recipe-path recipe.json && cd ..

COPY . .
RUN cd migration && cargo build --release && cd ..
RUN cargo build --release

FROM alpine:3.18

# certs required
RUN apk add pkgconfig openssl-dev
RUN apk --no-cache add ca-certificates 
WORKDIR /app

# copy useful binaries
COPY --from=builder /app/target/release/actix-demo .
COPY --from=builder /app/migration/target/release/migration .
COPY --from=builder /app/run_prod.sh .
COPY --from=builder /app/.env .

ENTRYPOINT /app/run_prod.sh
