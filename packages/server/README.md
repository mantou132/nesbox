# Server

## development

```bash
cargo watch -x "run -p server"
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
