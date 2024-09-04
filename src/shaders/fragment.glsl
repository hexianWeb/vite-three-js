varying float vLocalProgress; // Receive localProgress from vertex shader
varying vec3 vNormal;
varying vec3 vCameraPosition; // Pass the camera position to fragment shader
varying vec3 vViewDir;

void main() {
  // If localProgress is less than 0.1, discard the fragment
  // if (vLocalProgress > 0.99999991) {
  //   discard;
  // }
  // 如果当前顶点的法线和视线方向的夹角小于30度，则不绘制该片元
  bool discardFlag = dot(vViewDir, vNormal) < -0.9;
  if ( discardFlag ) {
    discard;
  }

  // csm_DiffuseColor = vec4(0.0,0.0, 0.0, 1.0);
}