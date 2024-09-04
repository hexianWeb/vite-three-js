mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat4(oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 0.0, oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, 0.0, oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c, 0.0, 0.0, 0.0, 0.0, 1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
    mat4 m = rotationMatrix(axis, angle);
    return (m * vec4(v, 1.0)).xyz;
}
vec3 rotateAroundPoint(vec3 v, vec3 axis, float angle, vec3 pivot) {
    // 1. 将点平移到使 pivot 成为原点
    vec3 translatedV = v - pivot;
    
    // 2. 进行旋转
    vec3 rotatedV = rotate(translatedV, axis, angle);
    
    // 3. 再将点平移回原来的位置
    return rotatedV + pivot;
}
