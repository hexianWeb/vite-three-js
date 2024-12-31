
        #define STANDARD
varying vec3 vViewPosition;
        #ifdef USE_TRANSMISSION
varying vec3 vWorldPosition;
        #endif

varying vec2 vUv;
varying vec4 vPos;
varying vec3 vNormalW;
varying vec3 vPositionW;

        #include <common>
        #include <uv_pars_vertex>
        #include <envmap_pars_vertex>
        #include <color_pars_vertex>
        #include <fog_pars_vertex>
        #include <morphtarget_pars_vertex>
        #include <skinning_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        #include <clipping_planes_pars_vertex>

void main() {

          #include <uv_vertex>
          #include <color_vertex>
          #include <morphcolor_vertex>

          #if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )

            #include <beginnormal_vertex>
            #include <morphnormal_vertex>
            #include <skinbase_vertex>
            #include <skinnormal_vertex>
            #include <defaultnormal_vertex>

          #endif

          #include <begin_vertex>
          #include <morphtarget_vertex>
          #include <skinning_vertex>
          #include <project_vertex>
          #include <logdepthbuf_vertex>
          #include <clipping_planes_vertex>

          #include <worldpos_vertex>
          #include <envmap_vertex>
          #include <fog_vertex>

    mat4 modelViewProjectionMatrix = projectionMatrix * modelViewMatrix;

    vUv = uv;
    vPos = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
    vPositionW = vec3(vec4(transformed, 1.0) * modelMatrix);
    vNormalW = normalize(vec3(vec4(normal, 0.0) * modelMatrix));

    gl_Position = modelViewProjectionMatrix * vec4(transformed, 1.0);

}