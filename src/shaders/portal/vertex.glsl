varying vec2 vUv;

void main() {
    // 传递 UV 坐标到片元着色器
    vUv = uv;
    
    // 计算顶点位置
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    
    gl_Position = projectedPosition;
} 