uniform float uSize;
uniform float uProgress;
uniform vec2 uResolution;

attribute vec3 aColor;
attribute float size;
attribute float timeMultipliers;

varying vec3 vColor;

#include "../utils/remap.glsl"

void main() {
  vec3 newPosition = position;

  // Time multipliers
  float progress = uProgress * timeMultipliers;
  // Exploding
  float explodingProgress = remap(progress, 0., .1, 0., 1.);
  explodingProgress = clamp(explodingProgress, 0., 1.);
  explodingProgress = 1. - pow(1. - explodingProgress, 3.);
  newPosition *= explodingProgress;

  // Falling
  float fallingProgress = remap(progress, .1, 1., 0., 1.);
  fallingProgress = clamp(fallingProgress, 0., 1.);
  fallingProgress = 1. - pow(1. - fallingProgress, 3.);
  newPosition.y -= fallingProgress * 10.2;

  // Scaling
  float sizeOpeningProgress = remap(progress, 0., .125, 0., 1.);
  float sizeClosingProgress = remap(progress, .125, 1., 1., 0.);
  float sizeProgress = min(sizeOpeningProgress, sizeClosingProgress);
  sizeProgress = clamp(sizeProgress, 0.0, 1.0);

  // Twinkling
  float twinklingProgress = remap(progress, .2, 0.8, 0., 1.);
  twinklingProgress = clamp(twinklingProgress, 0.0, 1.0);
  float sizeTwinkling = sin(progress * 30.) * 0.5 + 0.5;
  sizeTwinkling = 1.0 - sizeTwinkling * twinklingProgress;

  // Final position
  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.);
  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;

  gl_PointSize = uSize * uResolution.y * size * sizeProgress * sizeTwinkling;
  gl_PointSize *= 1. / -viewPosition.z;

  if (gl_PointSize < 1.0)
    gl_Position = vec4(9999.9);

  // Pass color to fragment shader
  vColor = aColor;
}
