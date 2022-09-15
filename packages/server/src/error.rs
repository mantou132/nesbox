use juniper::{graphql_value, Value};

pub struct Error;

impl Error {
    pub fn register_username_exist() -> Value {
        graphql_value!({"code": 404001})
    }
    pub fn username_or_password_error() -> Value {
        graphql_value!({"code": 404002})
    }
    pub fn username_not_playing() -> Value {
        graphql_value!({"code": 404101})
    }
}
