uniform float time;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec4 vPos;

    #include <common>
    #include <uv_pars_vertex>
    #include <envmap_pars_vertex>
    #include <color_pars_vertex>
    #include <fog_pars_vertex>
    #include <morphtarget_pars_vertex>
    #include <skinning_pars_vertex>
    #include <logdepthbuf_pars_vertex>
    #include <clipping_planes_pars_vertex>

float random2D(vec2 value)
{
    return fract(sin(dot(value.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main()
{
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

    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Glitch
    float glitchTime = time - modelPosition.y;
    float glitchStrength = sin(glitchTime) + sin(glitchTime * 3.45) +  sin(glitchTime * 8.76);
    glitchStrength = smoothstep(0.3, 1.0, glitchStrength);
    glitchStrength *= 0.15;

    // modelPosition.x += (random2D(modelPosition.xz + time) - 0.5)*glitchStrength;
    // modelPosition.z += (random2D(modelPosition.zx + time) - 0.5)*glitchStrength;
    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    // Varyings
    vPos = gl_Position;
    vPosition = modelPosition.xyz;
    vNormal = normal;
    vUv = uv;
}