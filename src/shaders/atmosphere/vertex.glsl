// 大气层顶点着色器
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // 传递 UV 坐标
  vUv = uv;
  
  // 传递法线向量（世界空间）
//   vNormal = normalize(normalMatrix * normal);
  vec4 modelNormal = modelMatrix * vec4(normal, 0.0);
  vNormal = modelNormal.xyz;
  
  // 传递顶点位置（世界空间）
  vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  
  // 计算最终顶点位置
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
