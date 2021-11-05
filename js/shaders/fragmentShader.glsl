uniform sampler2D uTexture;
uniform float uAlpha;
uniform vec2 uOffset;
varying vec2 vUv;

vec4 rgbShift(sampler2D textureImage, vec2 uv, vec2 offset) {
float r = texture2D(textureImage,uv + offset/4.).x;
float g = texture2D(textureImage,uv).y;
float b = texture2D(textureImage,uv).z;

//vec2 gb = texture2D(textureImage,uv).gb;
float a = texture2D(textureImage,uv).a + texture2D(textureImage,uv + offset).a  ;
return vec4(r,g,b, a);
}

void main() {
vec4 color = rgbShift(uTexture,vUv,uOffset);
gl_FragColor = vec4(color);
}