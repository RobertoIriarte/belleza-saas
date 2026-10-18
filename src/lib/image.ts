/**
 * Reduce una imagen en el navegador y la convierte a JPEG.
 * Evita subir fotos de 10 MB desde el celular y mantiene el sitio rápido.
 * Sólo se puede usar en componentes de cliente (usa canvas).
 */
export async function shrinkImage(file: File, maxSide: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no pudo procesar la imagen');
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen'))),
      'image/jpeg',
      0.85,
    ),
  );
}
