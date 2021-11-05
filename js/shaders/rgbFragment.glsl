uniform sampler2D uTexture;
uniform float uAlpha;
uniform vec2 uOffset;
varying vec2 vUv;

vec3 rgbShift(sampler2D textureImage, vec2 uv, vec2 offset) {
float r = texture2D(textureImage,uv + offset/4.).r;
float g = texture2D(textureImage,uv + offset/6.).g;
float b = texture2D(textureImage,uv + offset/8.).b;
return vec3(r,g,b);
}

void main() {
vec3 color = rgbShift(uTexture,vUv,uOffset);
gl_FragColor = vec4(color,uAlpha);
}