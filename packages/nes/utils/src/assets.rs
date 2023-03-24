use bevy::{prelude::*, utils::HashMap};

pub type Font = (f32, HashMap<char, (u32, Vec<u8>)>);

#[derive(Debug, Resource)]
pub struct AssetsResource {
    audios: HashMap<String, Vec<f32>>,
    sprites: HashMap<String, (u32, Vec<u8>)>,
    fonts: HashMap<String, Font>,
}

impl Default for AssetsResource {
    fn default() -> Self {
        let mut hash = HashMap::new();
        let chars = HashMap::new();
        hash.insert(String::default(), (10., chars));
        Self {
            audios: HashMap::new(),
            sprites: HashMap::new(),
            fonts: hash,
        }
    }
}

impl AssetsResource {
    pub fn load_audio(&mut self, name: &str, bytes: Vec<u8>) {
        let v = std::mem::ManuallyDrop::new(bytes);
        let ptr = v.as_ptr();
        unsafe {
            self.audios.insert(
                name.into(),
                Vec::from_raw_parts(ptr as *mut f32, v.len() / 4, v.capacity() / 4),
            );
        }
    }

    pub fn load_audio_from(&mut self, name: &str, from: &str, range: (f32, f32)) {
        let v = self.get_audio(from).unwrap();
        let total_len = v.len() as f32;
        let ptr = v.as_ptr();
        let start = (range.0 * total_len) as usize;
        let end = (range.1 * total_len) as usize;
        let len = end - start;
        unsafe {
            self.audios.insert(
                name.into(),
                Vec::from_raw_parts(ptr.add(start) as *mut f32, len, len),
            );
        }
    }

    pub fn get_audio(&self, name: &str) -> Option<&Vec<f32>> {
        self.audios.get(name)
    }

    pub fn load_sprite(&mut self, name: &str, sprite: (u32, Vec<u8>)) {
        self.sprites.insert(name.into(), sprite);
    }

    pub fn get_sprite(&self, name: &str) -> Option<&(u32, Vec<u8>)> {
        self.sprites.get(name)
    }

    pub fn load_font(&mut self, name: &str, font_buf: Vec<u8>) {
        let buf = std::mem::ManuallyDrop::new(font_buf);
        let ptr = buf.as_ptr();
        let mut hash = HashMap::new();
        // | fontSize | char = 4 bytes| width | data | ...
        let font_size = buf[0] as f32;
        let mut offset = 1;
        loop {
            if buf.len() - offset < 4 {
                break;
            }
            let bytes = buf[offset..(offset + 4)].try_into().unwrap();
            let code_point = u32::from_le_bytes(bytes);
            let c = char::from_u32(code_point).unwrap_or_default();
            offset += 4;
            let width = buf[offset];
            offset += 1;
            let len = font_size as usize * width as usize * 4;
            unsafe {
                hash.insert(
                    c,
                    (
                        width as u32,
                        Vec::from_raw_parts(ptr.add(offset) as *mut u8, len, len),
                    ),
                );
            }
            offset += len;
        }
        self.fonts.insert(name.into(), (font_size, hash));
    }

    pub fn get_font(&self, name: &str) -> &Font {
        self.fonts.get(name).unwrap_or(self.fonts.get("").unwrap())
    }
}

#[derive(Debug, Default)]
pub struct AssetsPlugin;

impl Plugin for AssetsPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(AssetsResource::default());
    }
}
