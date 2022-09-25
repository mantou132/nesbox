table! {
    comments (user_id, game_id) {
        user_id -> Int4,
        game_id -> Int4,
        body -> Text,
        like -> Bool,
        deleted_at -> Nullable<Timestamp>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

table! {
    favorites (user_id, game_id) {
        user_id -> Int4,
        game_id -> Int4,
        created_at -> Timestamp,
    }
}

table! {
    friends (user_id, target_id) {
        user_id -> Int4,
        target_id -> Int4,
        created_at -> Timestamp,
        status -> Varchar,
        last_read_at -> Timestamp,
    }
}

table! {
    games (id) {
        id -> Int4,
        name -> Varchar,
        description -> Text,
        preview -> Varchar,
        deleted_at -> Nullable<Timestamp>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        rom -> Varchar,
        screenshots -> Nullable<Text>,
        platform -> Nullable<Varchar>,
        series -> Nullable<Varchar>,
        kind -> Nullable<Varchar>,
        max_player -> Nullable<Int4>,
    }
}

table! {
    invites (id) {
        id -> Int4,
        room_id -> Int4,
        target_id -> Int4,
        user_id -> Int4,
        created_at -> Timestamp,
        deleted_at -> Nullable<Timestamp>,
        updated_at -> Timestamp,
    }
}

table! {
    messages (id) {
        id -> Int4,
        body -> Text,
        target_id -> Int4,
        user_id -> Int4,
        deleted_at -> Nullable<Timestamp>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

table! {
    playing (user_id, room_id) {
        user_id -> Int4,
        room_id -> Int4,
        created_at -> Timestamp,
    }
}

table! {
    records (user_id, game_id) {
        user_id -> Int4,
        game_id -> Int4,
        last_play_start_at -> Timestamp,
        last_play_end_at -> Nullable<Timestamp>,
        play_total -> Int8,
    }
}

table! {
    rooms (id) {
        id -> Int4,
        game_id -> Int4,
        private -> Bool,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        deleted_at -> Nullable<Timestamp>,
        host -> Int4,
        screenshot -> Nullable<Text>,
    }
}

table! {
    users (id) {
        id -> Int4,
        username -> Varchar,
        password -> Varchar,
        nickname -> Varchar,
        settings -> Nullable<Json>,
        deleted_at -> Nullable<Timestamp>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

joinable!(comments -> games (game_id));
joinable!(comments -> users (user_id));
joinable!(favorites -> games (game_id));
joinable!(favorites -> users (user_id));
joinable!(invites -> rooms (room_id));
joinable!(playing -> rooms (room_id));
joinable!(playing -> users (user_id));
joinable!(records -> games (game_id));
joinable!(records -> users (user_id));
joinable!(rooms -> games (game_id));
joinable!(rooms -> users (host));

allow_tables_to_appear_in_same_query!(
    comments, favorites, friends, games, invites, messages, playing, records, rooms, users,
);
