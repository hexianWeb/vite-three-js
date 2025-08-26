// 星球顶点着色器
uniform sampler2D uDisplacementMap;
uniform float uDisplacementScale;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // 传递 UV 坐标
  vUv = uv;
  
  // 获取置换值
  float displacement = texture2D(uDisplacementMap, uv).r;
  
  // 计算置换后的位置
  vec3 displacedPosition = position + normal * displacement * uDisplacementScale;
  
  // 传递法线向量（世界空间）
  // vNormal = normalize(normalMatrix * normal);
  
    // Model normal
  vec4 modelNormal = modelMatrix * vec4(normal, 0.0);
  vNormal = modelNormal.xyz;
  // 传递顶点位置（世界空间）
  vPosition = (modelMatrix * vec4(displacedPosition, 1.0)).xyz;
  
  // 计算最终顶点位置
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
