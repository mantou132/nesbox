use actix_web::HttpRequest;
use data_encoding::HEXLOWER;
use pulldown_cmark::{Event, Options, Parser, Tag};
use regex::Regex;

use crate::schemas::game::{convert_lang_to_enum, ScNewGame};
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

#[derive(Serialize, Deserialize, Debug)]
pub struct GithubIssue {
    pub title: String,
    pub body: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GithubRepo {
    pub owner: GithubUser,
}

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

pub fn get_title_lang(title: &str) -> (&str, &str) {
    let title_reg = Regex::new(r"^(?P<name>.+?)(\[(?P<lang>\w{2})\])?$").unwrap();
    let match_result = title_reg.captures(title).unwrap();
    (
        match_result.name("name").unwrap().as_str(),
        match_result.name("lang").map_or_else(|| "", |m| m.as_str()),
    )
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
    let (name, lang) = get_title_lang(&payload.issue.title);
    ScNewGame {
        name: name.into(),
        lang: convert_lang_to_enum(lang),
        description: payload.issue.body.clone(),
        preview,
        rom,
        screenshots,
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        github::{
            get_sc_new_game, get_title_lang, GithubIssue, GithubPayload, GithubRepo, GithubUser,
        },
        schemas::game::{ScGameLang, ScNewGame},
    };

    #[test]
    fn issue_title_reg() {
        let (name, lang) = get_title_lang("english[en]");
        assert_eq!(name, "english");
        assert_eq!(lang, "en");
        let (name, lang) = get_title_lang("english title[en]");
        assert_eq!(name, "english title");
        assert_eq!(lang, "en");
        let (name, lang) = get_title_lang("中文[zh]");
        assert_eq!(name, "中文");
        assert_eq!(lang, "zh");
        let (name, lang) = get_title_lang("中 文[zh]");
        assert_eq!(name, "中 文");
        assert_eq!(lang, "zh");
        let (name, lang) = get_title_lang("中 文");
        assert_eq!(name, "中 文");
        assert_eq!(lang, "");
    }

    #[test]
    fn parse_github_payload() {
        let payload = GithubPayload {
            action: "".into(),
            issue: GithubIssue {
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
                lang: ScGameLang::Zh,
                name: "name".into(),
                description: "![NekketsuKakutouDensetsu_frontcover](https://user-images.githubusercontent.com/3841872/168952574-26de855e-b7cd-43fe-ab94-093a2903832d.png)\r\n\r\nゲームモードは、ストーリーにそって闘いを進めていく「ストーリーモード」と最高4人でどたばたと闘い合う「バトルモード」の2種類のモードがあるぞ！\r\n![ABUIABACGAAg9eiD9gUo_I7-uQYwmgM4mgM](https://user-images.githubusercontent.com/3841872/168967700-44131eb9-6e33-48d0-9f3d-e71e9fcdb51b.jpg)\r\n[legend.nes.zip](https://github.com/mantou132/nesbox/files/8713065/legend.nes.zip)\r\n".into(),
                preview: "https://user-images.githubusercontent.com/3841872/168952574-26de855e-b7cd-43fe-ab94-093a2903832d.png".into(),
                rom: "https://github.com/mantou132/nesbox/files/8713065/legend.nes.zip".into(),
                screenshots: vec!["https://user-images.githubusercontent.com/3841872/168967700-44131eb9-6e33-48d0-9f3d-e71e9fcdb51b.jpg".into()]
            }
        );
    }
}
