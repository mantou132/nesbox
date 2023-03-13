pub use bincode::{deserialize, serialize};
use qoi::*;

fn find_diff_index(old: &[u8], arr: &[u8], reverse: bool) -> i32 {
    let len = arr.len() as i32;
    let mut index = if reverse { len - 4 } else { 0 };

    if old.len() == arr.len() {
        loop {
            if index < 0 || index >= len {
                break;
            }
            let i = index as usize;
            if old[i] != arr[i] || old[i + 1] != arr[i + 1] || old[i + 2] != arr[i + 2] {
                break;
            }
            if reverse {
                index -= 4;
            } else {
                index += 4;
            }
        }
    }
    index
}

pub fn encode_qoi_frame(
    prev_frame: &[u8],
    current_frame: &[u8],
    width: u32,
    qoi_whole_frame: bool,
) -> Vec<u8> {
    let line_bytes: i32 = width as i32 * 4 as i32;

    let mut start = 0;
    let mut end = 0;

    if qoi_whole_frame {
        end = current_frame.len();
    } else if prev_frame.len() > 0 {
        let end_index = find_diff_index(prev_frame, current_frame, true);

        let end_line = end_index / line_bytes;

        if end_index >= 0 {
            let start_index = find_diff_index(prev_frame, current_frame, false);

            start = (start_index / line_bytes * line_bytes) as usize;
            end = ((end_line + 1) * line_bytes) as usize;
        }
    }

    if end - start == 0 {
        Vec::new()
    } else {
        let h = ((end - start) / line_bytes as usize) as u8;
        let mut qoi_buffer = encode_to_vec(&current_frame[start..end], width, h as u32).unwrap();
        // x
        qoi_buffer.push(0);
        // y
        qoi_buffer.push((start / line_bytes as usize) as u8);
        // w, RENDER_WIDTH > u8 max value
        qoi_buffer.push(0);
        // h
        qoi_buffer.push(h);
        qoi_buffer
    }
}

pub fn decode_qoi_frame(bytes: &[u8]) -> Vec<u8> {
    decode_to_vec(bytes).unwrap().1
}
