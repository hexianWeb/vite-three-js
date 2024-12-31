varying vec2 vUv;
varying vec3 vPosition;
varying vec4 vPos;
varying vec3 vNormal;

uniform float time;
uniform float fresnelOpacity;
uniform float scanlineSize;
uniform float fresnelAmount;
uniform float signalSpeed;
uniform float hologramBrightness;
uniform float hologramOpacity;
uniform bool blinkFresnelOnly;
uniform bool enableBlinking;
uniform vec3 hologramColor;

float flicker(float amt,float time){return clamp(fract(cos(time)*43758.5453123),amt,1.);}
float random(in float a,in float b){return fract((cos(dot(vec2(a,b),vec2(12.9898,78.233)))*43758.5453));}

void main(){
    vec2 vCoords=vPos.xy;
    vCoords/=vPos.w;
    vCoords=vCoords*.5+.5;
    vec2 myUV=fract(vCoords);

    // Defines hologram main color
    vec4 hologramColor=vec4(hologramColor,mix(hologramBrightness,vUv.y,.5));

    // Add scanlines
    float scanlines=10.;
    scanlines+=20.*sin(time*signalSpeed*10.25-myUV.x*60.*scanlineSize);
    scanlines*=smoothstep(1.3*cos(time*signalSpeed+myUV.x*scanlineSize),.78,.9);
    scanlines*=max(.25,sin(time*signalSpeed)*1.);

    // Scanlines offsets
    float r=random(vUv.x,vUv.y);
    float g=random(vUv.y*20.2,vUv.y*.2);
    float b=random(vUv.y*.9,vUv.y*.2);

    // Scanline composition
    hologramColor+=vec4(r*scanlines,b*scanlines,r,1.)/120.;
    vec4 scanlineMix=mix(vec4(0.),hologramColor,hologramColor.a);

    // Calculates fresnel
    vec3 viewDirectionW=normalize(cameraPosition-vPosition);
    float fresnelEffect=dot(viewDirectionW,vNormal)*(1.6-fresnelOpacity/2.);
    fresnelEffect=clamp(fresnelAmount-fresnelEffect,0.,fresnelOpacity);

    // Blinkin effect
    //Suggested by Octano - https://x.com/OtanoDesign?s=20
    float blinkValue=enableBlinking?.6-signalSpeed:1.;
    float blink=flicker(blinkValue,time*signalSpeed*.02);

    // Final shader composition
    vec3 finalColor;

    if(blinkFresnelOnly){
        finalColor=scanlineMix.rgb+fresnelEffect*blink;
    }else{
        finalColor=scanlineMix.rgb*blink+fresnelEffect;
    }

    gl_FragColor=vec4(scanlineMix.rgb,hologramOpacity);

}