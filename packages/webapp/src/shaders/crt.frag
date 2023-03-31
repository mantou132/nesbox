#version 300 es

// https://www.shadertoy.com/view/XtlSD7

precision mediump float;

in vec2 v_texcoord;
out vec4 frag_color;

uniform sampler2D u_sampler;
uniform float u_time;

vec2 crt_curve_uv(vec2 uv) {
  uv = uv * 2.0 - 1.0;
  vec2 offset = abs(uv.yx) / vec2(6.0, 8.0);
  uv = uv + uv * offset * offset;
  uv = uv * 0.5 + 0.5;
  return uv;
}

void draw_vignette(inout vec3 color, vec2 uv) {
  float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
  vignette = clamp(pow(16.0 * vignette, 0.1), 0.0, 1.0);
  color *= vignette;
}

void draw_scanline(inout vec3 color, vec2 uv) {
  float scanline = clamp(0.95 + 0.05 * cos(3.14 * (uv.y + 0.008 * u_time) * 240.0 * 1.0), 0.0, 1.0);
  float grille = 0.86 + 0.14 * clamp(0.14 * cos(3.14 * uv.x * 640.0 * 1.0), 0.0, 1.0);
  color *= scanline * grille * 1.2;
}

void main() {
  vec3 color = texture(u_sampler, vec2(v_texcoord.s, v_texcoord.t)).rgb;

  vec2 crt_uv = crt_curve_uv(v_texcoord);
  if (crt_uv.x < 0.0 || crt_uv.x > 1.0 || crt_uv.y < 0.0 || crt_uv.y > 1.0) {
    color = vec3(0.0, 0.0, 0.0);
  }
  draw_vignette(color, crt_uv);

  draw_scanline(color, v_texcoord);

  frag_color = vec4(color, 1.0);
}
