use actix_web::HttpRequest;
use data_encoding::HEXLOWER;
use pulldown_cmark::{Event, Options, Parser, Tag};
use std::str::FromStr;

use crate::schemas::game::*;
use ring::hmac::{verify, Key, HMAC_SHA256};

pub fn validate(req: &HttpRequest, secret: &str, data: &[u8]) -> bool {
    let signature = req
        .headers()
        .get("X-Hub-Signature-256")
        .map(|signature| signature.to_str().unwrap_or_default())
        .unwrap_or_default();
    let tag = &signature[7..signature.len()];

    let is_ok = verify(
        &Key::new(HMAC_SHA256, secret.as_bytes()),
        data,
        &HEXLOWER.decode(tag.as_bytes()).unwrap_or_default(),
    )
    .is_ok();

    log::debug!("Github sha256 validate: {}", is_ok);
    is_ok
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct GithubUser {
    login: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct GithubLabel {
    name: String,
}

// https://docs.github.com/en/rest/issues/issues#get-an-issue
#[derive(Serialize, Deserialize, Debug)]
pub struct GithubIssue {
    pub title: String,
    pub body: String,
    pub state: String,
    pub labels: Vec<GithubLabel>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GithubRepo {
    pub owner: GithubUser,
}

// https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issues
#[derive(Serialize, Deserialize, Debug)]
pub struct GithubPayload {
    pub action: String,
    pub issue: GithubIssue,
    pub repository: GithubRepo,
    pub sender: GithubUser,
}

impl GithubPayload {
    pub fn is_owner(self: &Self) -> bool {
        self.sender.login == self.repository.owner.login
    }
}

pub fn get_sc_new_game(payload: &GithubPayload) -> ScNewGame {
    let parser = Parser::new_ext(&payload.issue.body, Options::all());

    let mut preview = String::new();
    let mut screenshots = Vec::new();
    let mut rom = String::new();
    for event in parser {
        match event {
            Event::Start(Tag::Image(_, url, _)) => {
                if preview.is_empty() {
                    preview.push_str(&url);
                } else {
                    screenshots.push(url.into_string());
                }
            }
            Event::Start(Tag::Link(_, link, _)) => {
                if rom.is_empty() && link.ends_with(".zip") {
                    rom.push_str(&link);
                }
            }
            _ => (),
        }
    }
    ScNewGame {
        name: payload.issue.title.clone(),
        description: payload.issue.body.clone(),
        preview,
        rom,
        screenshots,
        kind: payload
            .issue
            .labels
            .iter()
            .find(|label| label.name.starts_with("game.kind."))
            .and_then(|label| label.name.split_terminator(".").last())
            .and_then(|s| ScGameKind::from_str(s).ok()),
        max_player: payload
            .issue
            .labels
            .iter()
            .find(|label| label.name.starts_with("game.max_player."))
            .and_then(|label| label.name.split_terminator(".").last())
            .and_then(|s| s.parse::<i32>().ok()),
        platform: payload
            .issue
            .labels
            .iter()
            .find(|label| label.name.starts_with("game.platform."))
            .and_then(|label| label.name.split_terminator(".").last())
            .and_then(|s| ScGamePlatform::from_str(s).ok()),
        series: payload
            .issue
            .labels
            .iter()
            .find(|label| label.name.starts_with("game.series."))
            .and_then(|label| label.name.split_terminator(".").last())
            .and_then(|s| ScGameSeries::from_str(s).ok()),
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        github::{
            get_sc_new_game, GithubIssue, GithubLabel, GithubPayload, GithubRepo, GithubUser,
        },
        schemas::game::*,
    };

    #[test]
    fn parse_github_payload() {
        let payload = GithubPayload {
            action: "closed".into(),
            issue: GithubIssue {
                labels: vec![
                    GithubLabel {name: "game.kind.act".into()}, 
                    GithubLabel {name: "game.max_player.1".into()}, 
                    GithubLabel {name: "game.platform.nes".into()},
                    GithubLabel {name: "game.series.tmnt".into()},
                ],
                state: "open".into(),
                title: "name".into(),
                body: "![NekketsuKakutouDensetsu_frontcover](https://user-images.githubusercontent.com/3841872/168952574-26de855e-b7cd-43fe-ab94-093a2903832d.png)\r\n\r\nゲームモードは、ストーリーにそって闘いを進めていく「ストーリーモード」と最高4人でどたばたと闘い合う「バトルモード」の2種類のモードがあるぞ！\r\n![ABUIABACGAAg9eiD9gUo_I7-uQYwmgM4mgM](https://user-images.githubusercontent.com/3841872/168967700-44131eb9-6e33-48d0-9f3d-e71e9fcdb51b.jpg)\r\n[legend.nes.zip](https://github.com/mantou132/nesbox/files/8713065/legend.nes.zip)\r\n".into(),
            },
            repository: GithubRepo {
                owner: GithubUser { login: "".into() },
            },
            sender: GithubUser { login: "".into() },
        };
        assert_eq!(
            get_sc_new_game(&payload),
            ScNewGame {
                name: "name".into(),
                description: "![NekketsuKakutouDensetsu_frontcover](https://user-images.githubusercontent.com/3841872/168952574-26de855e-b7cd-43fe-ab94-093a2903832d.png)\r\n\r\nゲームモードは、ストーリーにそって闘いを進めていく「ストーリーモード」と最高4人でどたばたと闘い合う「バトルモード」の2種類のモードがあるぞ！\r\n![ABUIABACGAAg9eiD9gUo_I7-uQYwmgM4mgM](https://user-images.githubusercontent.com/3841872/168967700-44131eb9-6e33-48d0-9f3d-e71e9fcdb51b.jpg)\r\n[legend.nes.zip](https://github.com/mantou132/nesbox/files/8713065/legend.nes.zip)\r\n".into(),
                preview: "https://user-images.githubusercontent.com/3841872/168952574-26de855e-b7cd-43fe-ab94-093a2903832d.png".into(),
                rom: "https://github.com/mantou132/nesbox/files/8713065/legend.nes.zip".into(),
                screenshots: vec!["https://user-images.githubusercontent.com/3841872/168967700-44131eb9-6e33-48d0-9f3d-e71e9fcdb51b.jpg".into()],
                kind: Some(ScGameKind::Act),
                max_player: Some(1),
                platform: Some(ScGamePlatform::Nes),
                series: Some(ScGameSeries::Tmnt),
            }
        );
    }
}
