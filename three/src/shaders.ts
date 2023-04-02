export const vertexShader = `
varying vec2 vUv;
void main() {
vUv = uv;
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fragmentShader = `
uniform sampler2D density;
uniform sampler2D velocity;
uniform float opacity;
uniform float MIN_SPEED;
uniform float MAX_SPEED;
varying vec2 vUv;


vec3 getColor(float value) {
    vec3 color;
    if (value < 0.5) {
        color = mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 1.0), value * 2.0);
    } else {
        color = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 1.0, 0.0), (value - 0.5) * 2.0);
    }
    return color;
}
float remap(float value, float in_min, float in_max, float out_min, float out_max) {
    return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
void main() {
    float densityValue = texture2D(density, vUv).r;
    vec2 velocityValue = texture2D(velocity, vUv).rg;
    float speed = length(velocityValue);

    // Remap speed to a range suitable for visualization
    float normalizedSpeed = remap(speed, MIN_SPEED, MAX_SPEED, 0.0, 1.0);
    normalizedSpeed = clamp(normalizedSpeed, 0.0, 1.0);

    vec3 color = mix(getColor(densityValue), vec3(1.0, 0.0, 0.0), normalizedSpeed);
    gl_FragColor = vec4(color, opacity);
}
`;