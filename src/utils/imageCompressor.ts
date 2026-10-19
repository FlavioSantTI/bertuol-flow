/**
 * Utilitário de compressão de imagem no client-side usando HTML5 Canvas.
 * Reduz imagens de alta resolução (ex: fotos de 12MB da câmera) para ~200KB-400KB
 * mantendo excelente nitidez para visualização clínica e diagnósticos rápidos.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0
  format?: 'image/webp' | 'image/jpeg';
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<{ compressedFile: File; previewUrl: string }> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    format = 'image/webp',
  } = options;

  // Se o arquivo não for imagem, retorna o arquivo original sem alteração
  if (!file.type.startsWith('image/')) {
    return {
      compressedFile: file,
      previewUrl: URL.createObjectURL(file),
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let { width, height } = img;

        // Calcular escala proporcional se exceder os limites
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            compressedFile: file,
            previewUrl: URL.createObjectURL(file),
          });
        }

        // Desenhar com interpolação de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({
                compressedFile: file,
                previewUrl: URL.createObjectURL(file),
              });
            }

            const ext = format === 'image/webp' ? '.webp' : '.jpg';
            const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const newFileName = `${fileName}_compressed${ext}`;

            const compressedFile = new File([blob], newFileName, {
              type: format,
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(blob);
            resolve({ compressedFile, previewUrl });
          },
          format,
          quality
        );
      };

      img.onerror = () => {
        resolve({
          compressedFile: file,
          previewUrl: URL.createObjectURL(file),
        });
      };
    };

    reader.onerror = () => {
      resolve({
        compressedFile: file,
        previewUrl: URL.createObjectURL(file),
      });
    };
  });
}
