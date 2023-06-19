export function generateRandomFileName(extension: string) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 15; // 文件名的长度
  let randomFileName = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomFileName += characters[randomIndex];
  }

  return randomFileName + extension;
}

export function arrayBufferToJson(arrayBuffer: ArrayBuffer) {
  // 将ArrayBuffer转换为Uint8Array
  const uint8Array = new Uint8Array(arrayBuffer);

  // 将Uint8Array转换为字符串
  const jsonString = String.fromCharCode.apply(null, uint8Array as any);

  // 将字符串解析为JSON对象
  const jsonObject = JSON.parse(jsonString);

  return jsonObject;
}
