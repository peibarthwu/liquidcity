
uniform sampler2D uTexture;
uniform vec2 uOffset;
varying vec2 vUv;

#define M_PI 3.1415926535897932384626433832795


vec3 deformationCurve(vec3 position, vec2 uv, vec2 offset) {
   position.x = position.x + (sin(uv.y * M_PI) * offset.x); 
   position.y = position.y + (sin(uv.x * 10.) * offset.y);

   return position;
}

void main() {
   vUv = uv;

   gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}