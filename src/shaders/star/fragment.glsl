uniform sampler2D uTexture;
uniform int uBlendMode;
uniform float uBlendIntensity;

varying vec2 vUv;
varying vec3 vColor;

// 噪声函数
float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// RGB转LAB
vec3 rgb2lab(vec3 rgb) {
    vec3 xyz = vec3(
        rgb.r * 0.4124 + rgb.g * 0.3576 + rgb.b * 0.1805,
        rgb.r * 0.2126 + rgb.g * 0.7152 + rgb.b * 0.0722,
        rgb.r * 0.0193 + rgb.g * 0.1192 + rgb.b * 0.9505
    );
    
    xyz = xyz / vec3(0.95047, 1.0, 1.08883);
    
    vec3 f = step(vec3(0.008856), xyz) * pow(xyz, vec3(1.0/3.0)) + 
             step(xyz, vec3(0.008856)) * (xyz * 7.787 + vec3(16.0/116.0));
    
    return vec3(
        (116.0 * f.y) - 16.0,
        500.0 * (f.x - f.y),
        200.0 * (f.y - f.z)
    );
}

// LAB转RGB
vec3 lab2rgb(vec3 lab) {
    float fy = (lab.x + 16.0) / 116.0;
    float fx = lab.y / 500.0 + fy;
    float fz = fy - lab.z / 200.0;
    
    vec3 xyz = vec3(
        pow(fx, 3.0) > 0.008856 ? pow(fx, 3.0) : (fx - 16.0/116.0) / 7.787,
        pow(fy, 3.0) > 0.008856 ? pow(fy, 3.0) : (fy - 16.0/116.0) / 7.787,
        pow(fz, 3.0) > 0.008856 ? pow(fz, 3.0) : (fz - 16.0/116.0) / 7.787
    );
    
    xyz = xyz * vec3(0.95047, 1.0, 1.08883);
    
    return vec3(
        xyz.x * 3.2406 + xyz.y * -1.5372 + xyz.z * -0.4986,
        xyz.x * -0.9689 + xyz.y * 1.8758 + xyz.z * 0.0415,
        xyz.x * 0.0557 + xyz.y * -0.2040 + xyz.z * 1.0570
    );
}

// 基于噪声的混合
vec3 noiseBlend(vec3 color1, vec3 color2, float factor) {
    float noiseValue = noise(gl_PointCoord * 10.0);
    float adjustedFactor = smoothstep(0.0, 1.0, factor + noiseValue * 0.3);
    return mix(color1, color2, adjustedFactor);
}

// 感知色彩空间混合
vec3 perceptualBlend(vec3 color1, vec3 color2, float factor) {
    vec3 lab1 = rgb2lab(color1);
    vec3 lab2 = rgb2lab(color2);
    vec3 labMix = mix(lab1, lab2, factor);
    return lab2rgb(labMix);
}

// 多层混合
vec3 multiLayerBlend(vec3 baseColor, vec3 layer1, vec3 layer2, float factor) {
    // 第一层：屏幕混合
    vec3 screen = 1.0 - (1.0 - baseColor) * (1.0 - layer1);
    
    // 第二层：叠加混合
    vec3 overlay = mix(
        baseColor * layer2 * 2.0,
        1.0 - 2.0 * (1.0 - baseColor) * (1.0 - layer2),
        step(0.5, baseColor)
    );
    
    return mix(screen, overlay, factor);
}

// 光谱混合
vec3 spectralBlend(vec3 color1, vec3 color2, float factor) {
    vec3 spectrum1 = pow(color1, vec3(2.2));
    vec3 spectrum2 = pow(color2, vec3(2.2));
    
    vec3 spectralMix = spectrum1 + spectrum2 * factor;
    spectralMix = clamp(spectralMix, 0.0, 1.0);
    
    return pow(spectralMix, vec3(1.0/2.2));
}

// 主混合函数
vec3 advancedBlend(vec3 color1, vec3 color2, float factor, int mode) {
    if (mode == 0) {
        // 线性混合
        return mix(color1, color2, factor);
    } else if (mode == 1) {
        // 噪声混合
        return noiseBlend(color1, color2, factor);
    } else if (mode == 2) {
        // 感知混合
        return perceptualBlend(color1, color2, factor);
    } else if (mode == 3) {
        // 多层混合
        return multiLayerBlend(color1, color2, vec3(0.5, 0.8, 1.0), factor);
    } else if (mode == 4) {
        // 动态混合（基于时间）
        float timeOffset = sin(gl_PointCoord.x * 10.0) * 0.5 + 0.5;
        float adjustedFactor = factor + timeOffset * 0.2;
        adjustedFactor = clamp(adjustedFactor, 0.0, 1.0);
        return mix(color1, color2, smoothstep(0.0, 1.0, adjustedFactor));
    } else if (mode == 5) {
        // 光谱混合
        return spectralBlend(color1, color2, factor);
    }
    
    return mix(color1, color2, factor);
}

void main() {
    // 从纹理获取透明度
    float textureAlpha = texture(uTexture, gl_PointCoord).r;

    // Diffuse point
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    // strength = pow(strength, 4.0);

    // 使用高级混合算法
    vec3 baseColor = vec3(0.0);
    vec3 finalColor = advancedBlend(baseColor, vColor, strength * uBlendIntensity, uBlendMode);

    // Final color
    gl_FragColor = vec4(finalColor, textureAlpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}