use actix_web::{dev::ServiceRequest, Error};

use actix_web_httpauth::extractors::bearer::{BearerAuth, Config};
use actix_web_httpauth::extractors::AuthenticationError;

// https://docs.rs/actix-web-httpauth/0.6.0/actix_web_httpauth/middleware/struct.HttpAuthentication.html#method.bearer
pub async fn validator(
    req: ServiceRequest,
    credentials: BearerAuth,
) -> Result<ServiceRequest, Error> {
    println!("token: {}", credentials.token());
    Ok(req)
}
