/**
 * 定义项目所需的静态资源列表。
 * Resources 类会根据 'type' 属性自动选择合适的加载器。
 *
 * 支持的资源类型 (type) 及其对应的加载器/方式:
 * - gltfModel:   GLTFLoader (支持 Draco 和 KTX2 压缩)
 * - texture:     TextureLoader (普通图像纹理, 如 jpg, png)
 * - cubeTexture: CubeTextureLoader (立方体贴图, 用于环境映射等)
 * - font:        FontLoader (加载字体文件, 通常是 json 格式)
 * - fbxModel:    FBXLoader (加载 FBX 模型)
 * - audio:       AudioLoader (加载音频文件)
 * - objModel:    OBJLoader (加载 OBJ 模型)
 * - hdrTexture:  RGBELoader (加载 HDR 环境贴图)
 * - svg:         SVGLoader (加载 SVG 文件作为纹理或数据)
 * - exrTexture:  EXRLoader (加载 EXR 高动态范围图像)
 * - video:       自定义加载逻辑，创建 VideoTexture (加载视频作为纹理)
 * - ktx2Texture: KTX2Loader (加载 KTX2 压缩纹理)
 */
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
      'textures/environmentMap/nz.jpg',
    ],
  },
  {
    name: 'dayTexture',
    type: 'texture',
    path: 'textures/environmentMap/day.webp',
  },
  {
    name: 'nightTexture',
    type: 'texture',
    path: 'textures/environmentMap/night.webp',
  },
  {
    name: 'sceneModel',
    type: 'gltfModel',
    path: 'models/scene.glb',
  },
  {
    name: 'heroModel',
    type: 'gltfModel',
    path: 'models/character-soldier.glb',
  },
  {
    name: 'colliderModel',
    type: 'gltfModel',
    path: 'models/collision-world.glb',
  },
  {
    name: 'chickenModel',
    type: 'gltfModel',
    path: 'models/chicken.glb',
  },
  {
    name: 'perlinNoiseTexture',
    type: 'texture',
    path: 'textures/noise/perlin.png',
  },
  {
    name: 'flowMapTexture',
    type: 'texture',
    path: 'textures/noise/cables (8).png',
  },
  {
    name: 'waterMaskTexture',
    type: 'texture',
    path: 'textures/noise/waterMask.png',
  },
]
