#version 300 es

precision mediump float;

in vec2 v_texcoord;
out vec4 frag_color;

uniform sampler2D u_sampler;

// https://www.shadertoy.com/view/lsfGD2

float sat(float t) {
  return clamp(t, 0.0, 1.0);
}

vec3 spectrum_offset(float t) {
  float t0 = 3.0 * t - 1.5;
  return clamp(vec3(-t0, 1.0 - abs(t0), t0), 0.0, 1.0);
}

float rand(vec2 n) {
  return fract(sin(dot(n.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  const float GLITCH = 0.1;
  const int NUM_SAMPLES = 3;
  const float RCP_NUM_SAMPLES_F = 1.0 / float(NUM_SAMPLES);

  vec2 uv = v_texcoord;

  float rnd0 = rand(vec2(1.0));
  float r0 = sat((1.0 - GLITCH) * 0.7 + rnd0);

  float pxrnd = rand(uv);

  float ofs = 0.05 * r0 * GLITCH * (rnd0 > 0.5 ? 1.0 : -1.0);
  ofs += 0.5 * pxrnd * ofs;

  vec4 sum = vec4(0.0);
  vec3 wsum = vec3(0.0);
  for (int i = 0; i < NUM_SAMPLES; ++i) {
    float t = float(i) * RCP_NUM_SAMPLES_F;
    uv.x = sat(uv.x + ofs * t);
    vec4 samplecol = texture(u_sampler, uv, -10.0);
    vec3 s = spectrum_offset(t);
    samplecol.rgb = samplecol.rgb * s;
    sum += samplecol;
    wsum += s;
  }
  sum.rgb /= wsum;
  sum.a *= RCP_NUM_SAMPLES_F;

  frag_color.a = sum.a;
  frag_color.rgb = sum.rgb;
}
