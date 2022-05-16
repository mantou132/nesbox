use actix_web::HttpRequest;
use chrono::Utc;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, Validation};
use jsonwebtoken::{EncodingKey, Header};

use crate::schemas::user::ScUser;

#[derive(Serialize, Deserialize)]
pub struct UserToken {
    // issued at
    pub iat: i64,
    // expiration
    pub exp: i64,
    // data
    pub user_id: i32,
    pub preferred_username: String,
    pub nickname: String,
}

impl UserToken {
    pub fn generate_token(secret: &str, user: &ScUser) -> String {
        let now = Utc::now().timestamp();
        let payload = UserToken {
            iat: now,
            exp: now + 60 * 60 * 24 * 7,
            user_id: user.id,
            preferred_username: user.username.to_owned(),
            nickname: user.nickname.to_owned(),
        };

        encode(
            &Header::default(),
            &payload,
            &EncodingKey::from_secret(secret.as_bytes()),
        )
        .unwrap()
    }
    pub fn parse(secret: &str, token: &str) -> Option<i32> {
        match decode::<UserToken>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::new(Algorithm::HS256),
        ) {
            Ok(token_data) => Some(token_data.claims.user_id),
            _ => None,
        }
    }
}

pub fn extract_token_from_str(authen_str: &str) -> &str {
    if authen_str.to_lowercase().starts_with("bearer") {
        let token = authen_str[6..authen_str.len()].trim();
        return token;
    }
    ""
}

pub fn extract_token_from_req(req: &HttpRequest) -> &str {
    if let Some(authn_header) = req.headers().get("authorization") {
        if let Ok(authen_str) = authn_header.to_str() {
            return extract_token_from_str(authen_str);
        }
    }
    ""
}
