# NESBox API

## development

install postgresql, diesel_cli@2.x, create database, create `.env` file:

```bash
# install diesel_cli with postgres support
cargo install diesel_cli --no-default-features --features postgres
```

```
DATABASE_URL=postgres://username:password@localhost/database_name
```

```bash
# init database
diesel migration run
# modify table
diesel migration generate add_age_to_users
```

start:

```bash
cargo watch -x run
```

## manage games

### use github issue

exposes local port to a remote server, can use [bore](https://github.com/ekzhang/bore):

```bash
bore local 8080 --to bore.pub
```

add webhook to your own github repo, eg: `http://bore.pub:<port_number>/webhook`

set a secret and add this secret to the `.env` file:

```bash
SECRET=your_secret
```

restart local server. now, if you create an issue, will notify your local server. if issue meets the game to the conditions, it will be updated to the database when the issue is closed. conditions:

- operator is repo owner
- one or more picture
- a `.zip` file

reference: https://github.com/mantou132/nesbox/issues/1

### use sql

download [sql file](https://github.com/mantou132/nesbox/releases/download/0.0.1/games.sql)

```bash
psql database_name -U username < games.sql
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
