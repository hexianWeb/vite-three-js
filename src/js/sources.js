export default [
  {
    name: 'environmentMapTexture',
    type: 'cubeTexture',
    path: [
      'textures/environmentMap/px.jpg',
      'textures/environmentMap/nx.jpg',
      'textures/environmentMap/py.jpg',
      'textures/environmentMap/ny.jpg',
      'textures/environmentMap/pz.jpg',
      'textures/environmentMap/nz.jpg'
    ]
  },
  {
    name: 'stage',
    type: 'gltfModel',
    path: 'glass-wall.glb'
  },
  {
    name: 'emoji',
    type: 'gltfModel',
    path: 'emoji.glb'
  },
  {
    name: 'fontSource',
    type: 'font',
    path: '/fonts/helvetiker_bold.typeface.json'
  }
];
