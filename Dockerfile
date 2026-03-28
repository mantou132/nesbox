# Use this custom image
FROM rust as builder

# cache layer
COPY ./packages/server/Cargo.toml .
COPY ./Cargo.lock .
RUN mkdir ./src && echo 'fn main() { println!("Dummy!"); }' > ./src/main.rs
RUN cargo build -p server --release
RUN rm -rf ./src

COPY ./packages/server/src ./src
# The last modified attribute of main.rs needs to be updated manually,
# otherwise cargo won't rebuild it.
RUN touch -a -m ./src/main.rs
RUN cargo build -p server --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    libpq5 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /target/release/server /usr/local/bin/

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/server"]
