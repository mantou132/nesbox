use bevy::{prelude::*, utils::HashSet};

use crate::assets::AssetsResource;

#[derive(Debug, Clone, Eq, PartialEq, Hash)]
pub struct Audio {
    pub name: String,
    pub offset: usize,
    pub cycle: bool,
    pub volume: u32,
}

impl Default for Audio {
    fn default() -> Self {
        Self {
            name: String::new(),
            offset: 0,
            cycle: false,
            volume: 100,
        }
    }
}

#[derive(Resource, Default, Clone)]
pub struct AudioResource {
    out_buf: Vec<f32>,
    current_audios: HashSet<Audio>,
}

impl AudioResource {
    pub fn frame(&self) -> &[f32] {
        &self.out_buf
    }

    pub fn clear(&mut self) {
        self.current_audios.clear();
    }

    pub fn remove(&mut self, audio: &Audio) {
        self.current_audios.remove(audio);
    }

    pub fn play(&mut self, name: &str) -> &Audio {
        self.current_audios.get_or_insert(Audio {
            name: name.into(),
            ..default()
        })
    }

    pub fn play_audio(&mut self, audio: Audio) -> &Audio {
        self.current_audios.get_or_insert(audio)
    }
}

#[derive(Debug)]
pub struct AudioPlugin {
    sample_rate: usize,
    fps: usize,
}

impl Default for AudioPlugin {
    fn default() -> Self {
        Self {
            sample_rate: 44100,
            fps: 60,
        }
    }
}

impl AudioPlugin {
    fn out(mut audio_resource: ResMut<AudioResource>, assets_resource: Res<AssetsResource>) {
        let len = audio_resource.out_buf.len();
        let mut out_buf = vec![0.; len];
        let mut new_set = HashSet::new();

        let mut append = |b: &[f32], volume: u32| {
            let v = (volume.min(100) as f32) / 100.;
            for (i, b_val) in b.iter().enumerate() {
                out_buf[i] += b_val * v;
            }
        };

        for mut audio in audio_resource.current_audios.drain() {
            if let Some(buf) = assets_resource.get_audio(&audio.name) {
                if audio.offset + len < buf.len() {
                    append(&buf[audio.offset..audio.offset + len], audio.volume);
                    audio.offset += len;
                    new_set.insert_unique_unchecked(audio);
                } else if audio.cycle {
                    append(&buf[0..len], audio.volume);
                    audio.offset = len;
                    new_set.insert_unique_unchecked(audio);
                }
            }
        }
        audio_resource.current_audios = new_set;
        audio_resource.out_buf = out_buf;
    }
}

impl Plugin for AudioPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(AudioResource {
            out_buf: vec![0.; self.sample_rate / self.fps],
            ..default()
        })
        .add_system(Self::out.in_base_set(CoreSet::Last));
    }
}
