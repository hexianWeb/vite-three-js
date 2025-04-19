uniform float uOutlineThickness; // 轮廓厚度
uniform float uTimeOffset;    // 每个物体独特的时间偏移值
varying float vTimeOffset;    // 传递给片元着色器的偏移值

void main() {
    // 将顶点位置沿着法线方向外扩 uOutlineThickness 个单位
    vec3 boostedPosition = position + normal * uOutlineThickness;
    
    // 传递时间偏移值给片元着色器
    vTimeOffset = uTimeOffset;
    
    // 正常的模型视图投影变换
    gl_Position = projectionMatrix * modelViewMatrix * vec4(boostedPosition, 1.0);
} 