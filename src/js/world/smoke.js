import * as THREE from 'three'
import Experience from '../experience.js'

export default class Smoke {
  constructor() {
    // Get experience instance
    this.experience = new Experience()

    // Get required instances
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug
    this.time = this.experience.time
    this.camera = this.experience.camera.instance

    // Setup
    this.setGeometry()
    this.setMaterial()
    this.setMesh()

    // Debug
    if (this.debug.active) {
      this.debugInit()
    }
  }

  setGeometry() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 16, 64)
    this.geometry.translate(0, 0.5, 0)
    this.geometry.scale(3, 8, 3) // Made it bigger as requested
  }

  setMaterial() {
    // Get perlin texture
    const perlinTexture = this.resources.items.perlinNoiseTexture
    perlinTexture.wrapS = THREE.RepeatWrapping
    perlinTexture.wrapT = THREE.RepeatWrapping

    this.material = new THREE.ShaderMaterial({
      vertexShader: /* glsl */`
        uniform float uTime;
        uniform sampler2D uPerlinTexture;
        
        varying vec2 vUv;
        
        mat2 rotate2D(float angle) {
          float s = sin(angle);
          float c = cos(angle);
          return mat2(c, -s, s, c);
        }
        
        void main() {
          vec3 newPosition = position;
        
          // Twist
          float twistPerlin = texture(
            uPerlinTexture,
            vec2(0.5, uv.y * 0.2 - uTime * 0.005)
          ).r;
          float angle = twistPerlin * 10.0;
          newPosition.xz = rotate2D(angle) * newPosition.xz;
        
          // Wind
          vec2 windOffset = vec2(
            texture(uPerlinTexture, vec2(0.25, uTime * 0.01)).r - 0.5,
            texture(uPerlinTexture, vec2(0.75, uTime * 0.01)).r - 0.5
          );
          windOffset *= pow(uv.y, 2.0) * 10.0;
          newPosition.xz += windOffset;
        
          // Final position
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        
          // Varyings
          vUv = uv;
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        uniform sampler2D uPerlinTexture;
        uniform vec3 uColor;
        
        varying vec2 vUv;
        
        void main() {
          // Scale and animate
          vec2 smokeUv = vUv;
          smokeUv.x *= 0.5;
          smokeUv.y *= 0.3;
          smokeUv.y -= uTime * 0.03;
        
          // Smoke
          float smoke = texture(uPerlinTexture, smokeUv).r;
        
          // Remap
          smoke = smoothstep(0.4, 1.0, smoke);
        
          // Edges
          smoke *= smoothstep(0.0, 0.1, vUv.x);
          smoke *= smoothstep(1.0, 0.9, vUv.x);
          smoke *= smoothstep(0.0, 0.1, vUv.y);
          smoke *= smoothstep(1.0, 0.4, vUv.y);
        
          // Final color
          gl_FragColor = vec4(uColor, smoke);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uPerlinTexture: { value: perlinTexture },
        uColor: { value: new THREE.Color(0.6, 0.3, 0.2) },
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    })
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.position.y = 2 // Positioned a bit higher
    this.mesh.lookAt(this.camera.position)
    this.scene.add(this.mesh)
  }

  debugInit() {
    // Create debug folder
    this.debugFolder = this.debug.ui.addFolder({
      title: 'Smoke',
      expanded: true,
    })

    // Add color control
    this.debugFolder.addBinding(
      this.material.uniforms.uColor.value,
      'r',
      { min: 0, max: 1, step: 0.01, label: 'Red' },
    )
    this.debugFolder.addBinding(
      this.material.uniforms.uColor.value,
      'g',
      { min: 0, max: 1, step: 0.01, label: 'Green' },
    )
    this.debugFolder.addBinding(
      this.material.uniforms.uColor.value,
      'b',
      { min: 0, max: 1, step: 0.01, label: 'Blue' },
    )

    // Add position controls
    this.debugFolder.addBinding(
      this.mesh.position,
      'y',
      { min: 0, max: 10, step: 0.1, label: 'Height' },
    )
  }

  update() {
    this.material.uniforms.uTime.value = this.time.elapsed * 0.001
  }
}
