# @mantou/nes

## pull deps

```bash
git submodule update
```

## compile to wasm

[install](https://rustwasm.github.io/wasm-pack/installer/) wesm-pack.

```bash
wasm-pack build --out-dir ../nes-pkg --target web --scope mantou
```

## publish to npm

```bash
npm publish --access=public
```
