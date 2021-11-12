uniform sampler2D uTexture;
uniform vec2 uOffset;
uniform float uAngle;

varying vec2 vUv;

mat4 rotationMatrix(float angle)
{
    float s = sin(angle);
    float c = cos(angle);
    
    return mat4(c,              0.0,     s,  0.0,
                0.0,  (1.0 - c) + c,   0.0,  0.0,
               -1 * s,        1.0-c,     c,  0.0,
                0.0,            0.0,   0.0,  1.0);
}

void main() {
   vUv = uv;
    mat4 rotationMatrix = rotationMatrix(uAngle);
   gl_Position = projectionMatrix * modelViewMatrix * rotationMatrix * vec4( position, 1.0 );
}