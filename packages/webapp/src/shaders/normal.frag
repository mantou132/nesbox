#version 300 es

precision mediump float;

in vec2 v_texcoord;
out vec4 frag_color;

uniform sampler2D u_sampler;

void main() {
  frag_color = vec4(texture(u_sampler, vec2(v_texcoord.s, v_texcoord.t)).rgb, 1.0);
}
