# Server

## development

```bash
cargo watch -x "run -p server"
```

## Webhook test

```
bore local 8080 --to bore.pub -p 34033
```

## docker

```bash
docker build -t 594mantou/nesbox .
docker push 594mantou/nesbox
```

## deploy prepare

```bash
git pull
diesel migration run
```
