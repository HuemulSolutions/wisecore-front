/**
 * Descarga el cuerpo de una respuesta como archivo en el navegador.
 *
 * Extrae el nombre del archivo del header `content-disposition` cuando está
 * presente y, en su defecto, usa `fallbackFilename`. Pensado para endpoints
 * de export que responden con un blob descargable.
 */
export async function downloadBlobResponse(
  response: Response,
  fallbackFilename: string,
): Promise<void> {
  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition');

  let filename = fallbackFilename;
  if (contentDisposition) {
    const match =
      contentDisposition.match(/filename="([^"]+)"/) ||
      contentDisposition.match(/filename=([^;]+)/);
    if (match?.[1]) filename = match[1].trim();
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
