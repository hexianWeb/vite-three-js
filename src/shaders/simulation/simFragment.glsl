uniform float time;
uniform sampler2D uPosition;

varying vec2 vUv;
void main() {
    vec3 pos = texture2D(uPosition, vUv).xyz;

    float raduis = length(pos);
    float angle = atan(pos.y, pos.x);

    angle += 0.01;

    vec3 transfromedPos = vec3(cos(angle) * raduis, sin(angle) * raduis, 0.0);

    gl_FragColor = vec4(transfromedPos, 1.0);
}