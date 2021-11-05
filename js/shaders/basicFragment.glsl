uniform sampler2D uTexture;
uniform float uAlpha;
varying vec2 vUv;

void main() {
gl_FragColor = vec4(texture2D(uTexture,vUv).rgb,texture2D(uTexture,vUv).w);
}