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
    name: 'starTexture',
    type: 'texture',
    path: 'textures/galaxy/1.png',
  },

  {
    name: 'starTexture2',
    type: 'texture',
    path: 'textures/galaxy/4.png',
  },
  {
    name: 'spaceTexture',
    type: 'texture',
    path: 'textures/galaxy/2k_stars_milky_way.jpg',
  },
  {
    name: 'planetTexture',
    type: 'texture',
    path: 'textures/galaxy/2k_ceres_fictional.jpg',
  },
  {
    name: 'planetTexture2',
    type: 'texture',
    path: 'textures/galaxy/2k_eris_fictional.jpg',
  },
  {
    name: 'planetTexture3',
    type: 'texture',
    path: 'textures/galaxy/2k_venus_surface.jpg',
  },
  {
    name: 'planetNormal',
    type: 'texture',
    path: 'textures/galaxy/red_sand_nor_gl_1k.jpg',
  },
  {
    name: 'planetDisplacement',
    type: 'texture',
    path: 'textures/galaxy/red_sand_disp_1k.png',
  },
  {
    name: 'lensDirtTexture',
    type: 'texture',
    path: 'textures/lensflare/lensDirtTexture.jpg',
  },
]
