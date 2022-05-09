use actix_web::HttpRequest;
use chrono::Utc;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, Validation};
use jsonwebtoken::{EncodingKey, Header};

#[derive(Serialize, Deserialize)]
pub struct UserToken {
    // issued at
    pub iat: i64,
    // expiration
    pub exp: i64,
    // data
    pub username: String,
}

impl UserToken {
    pub fn generate_token(secret: &[u8], username: &str) -> String {
        let now = Utc::now().timestamp();
        let payload = UserToken {
            iat: now,
            exp: now + 60 * 60 * 24 * 7,
            username: username.to_owned(),
        };

        encode(
            &Header::default(),
            &payload,
            &EncodingKey::from_secret(secret),
        )
        .unwrap()
    }
    pub fn parse(secret: &[u8], token: &str) -> Option<String> {
        match decode::<UserToken>(
            token,
            &DecodingKey::from_secret(secret),
            &Validation::new(Algorithm::HS256),
        ) {
            Ok(token_data) => Some(token_data.claims.username),
            _ => None,
        }
    }
}

pub fn extract_token(req: &HttpRequest) -> &str {
    "return"
}
