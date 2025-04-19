uniform vec3 uOutlineColor;    // 轮廓颜色
uniform float uTime;           // 时间，用于呼吸效果
uniform float uOpacity;        // 基础不透明度
uniform float uBreathingSpeed; // 呼吸速度
uniform float uBreathingMin;   // 最小亮度
uniform float uBreathingRange; // 亮度变化范围
varying float vTimeOffset;     // 从顶点着色器接收的时间偏移值

void main() {
    // 呼吸效果：使用 sin 函数随时间调整透明度
    // 使用可配置的参数控制呼吸效果
    float breathing = uBreathingMin + uBreathingRange * sin((uTime + vTimeOffset) * uBreathingSpeed);
    
    // 设置最终颜色和透明度
    gl_FragColor = vec4(uOutlineColor, uOpacity * breathing);
} 