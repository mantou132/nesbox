# Gomoku

## Development

```bash
cargo watch -s "wasm-pack build --target web --out-name=index"
```

## Serve

```bash
npx esbuild pkg/index_bg.wasm --outdir=dist --watch --serve --loader:.wasm=file --asset-names=[name]
```

## Build

```bash
wasm-pack build --target web --out-name=index
```