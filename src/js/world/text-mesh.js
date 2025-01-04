import CANNON from 'cannon';
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

import Float from '../components/float.js';
import Experience from '../experience.js';

export default class TextMesh {
  constructor(
    texts = ['three.js', 'is the best', 'library for webgl'],
    font = 'fontSource2'
  ) {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.world = this.experience.physics.world;

    this.texts = texts;
    this.textGroups = [];
    this.offset = this.texts.length * 6 * 0.5; // Margin of 6

    this.float = new Float({ speed: 1.5, floatIntensity: 2 });

    this.resources.on('ready', () => {
      const fontSource = this.resources.items[font];
      if (fontSource) {
        this.setupTextMeshes(fontSource);
      } else {
        console.error('Font source not loaded');
      }
    });
  }

  setupTextMeshes(fontSource) {
    const fontOptions = {
      font: fontSource,
      size: 3,
      height: 0.4,
      curveSegments: 24,
      bevelEnabled: true,
      bevelThickness: 0.9,
      bevelSize: 0.3,
      bevelOffset: 0,
      bevelSegments: 10
    };

    const spaceOffset = 2;

    for (const [index, text] of this.texts.entries()) {
      const words = new THREE.Group();
      words.letterOff = 0;

      // Create a ground body for each line of text
      words.ground = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(50, 0.1, 50)),
        position: new CANNON.Vec3(0, this.getOffsetY(index), 0)
      });
      this.world.addBody(words.ground);

      for (const [index_, letter] of [...text].entries()) {
        if (letter === ' ') {
          // 如果是空格，只增加偏移量
          words.letterOff += spaceOffset;
        } else {
          const material = new THREE.MeshPhongMaterial({ color: 0x97_df_5e });
          const geometry = new TextGeometry(letter, fontOptions);

          geometry.computeBoundingBox();
          geometry.computeBoundingSphere();

          const mesh = new THREE.Mesh(geometry, material);
          mesh.size = mesh.geometry.boundingBox.getSize(new THREE.Vector3());

          words.letterOff += mesh.size.x;

          const box = new CANNON.Box(
            new CANNON.Vec3().copy(mesh.size).scale(0.5)
          );

          mesh.body = new CANNON.Body({
            mass: this.totalMass / text.length,
            position: new CANNON.Vec3(
              words.letterOff,
              this.getOffsetY(index),
              0
            )
          });

          const { center } = mesh.geometry.boundingSphere;
          mesh.body.addShape(
            box,
            new CANNON.Vec3(center.x, center.y, center.z)
          );

          this.world.addBody(mesh.body);
          words.add(mesh);
        }
      }

      // Recenter each body based on the whole string
      for (const letter of words.children) {
        letter.body.position.x -= letter.size.x + words.letterOff * 0.5;
      }

      this.textGroups.push(words);
      this.scene.add(words);
    }

    // Center the entire text block
    this.centerTextBlock();
  }

  centerTextBlock() {
    const boundingBox = new THREE.Box3();

    for (const words of this.textGroups) {
      boundingBox.expandByObject(words);
    }

    const center = boundingBox.getCenter(new THREE.Vector3());

    for (const words of this.textGroups) {
      words.position.sub(center);
    }
  }

  update() {
    // Add any update logic here if needed
    if (this.float) {
      this.float.update();
    }
    if (this.textGroups) {
      for (const group of this.textGroups) {
        for (const letter of group.children) {
          letter.position.copy(letter.body.position);
          letter.quaternion.copy(letter.body.quaternion);
        }
      }
    }
  }

  getOffsetY(index) {
    return (this.texts.length - index - 1) * 6 - this.offset;
  }
}
