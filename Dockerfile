# Use this custom image
FROM ekidd/rust-musl-builder as rust-build

# cache layer
COPY ./packages/server/Cargo.toml .
RUN mkdir ./src && echo 'fn main() { println!("Dummy!"); }' > ./src/main.rs
RUN cargo build -p server --release
RUN rm -rf ./src

COPY --chown=rust:rust ./packages/server/src ./src
# The last modified attribute of main.rs needs to be updated manually,
# otherwise cargo won't rebuild it.
RUN touch -a -m ./src/main.rs
RUN cargo build -p server --release

FROM alpine

COPY --from=rust-build \
    /home/rust/src/target/x86_64-unknown-linux-musl/release/server \
    /usr/local/bin/

EXPOSE 8080

ENTRYPOINT ./usr/local/bin/server