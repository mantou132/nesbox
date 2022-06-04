# Use this custom image
FROM ekidd/rust-musl-builder as rust-build

ADD --chown=rust:rust ./packages/server ./

RUN cargo build -p server --release

FROM alpine

COPY --from=rust-build \
    /home/rust/src/target/x86_64-unknown-linux-musl/release/server \
    /usr/local/bin/

EXPOSE 8080

ENTRYPOINT ./usr/local/bin/server