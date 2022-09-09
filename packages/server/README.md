# NESBox API

## development

install postgresql, diesel, create database, create `.env` file:

```
DATABASE_URL=postgres://username:password@localhost/database_name
```

init database:

```base
diesel migration run
```

start:

```bash
cargo watch -x run
```

## webhook test

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
