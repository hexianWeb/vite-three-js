// 获取设备类型
export const detectDeviceType = () => {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    navigator.userAgent
  )
    ? 'Mobile'
    : 'Desktop';
};
