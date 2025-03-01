import imageCompression from "browser-image-compression"

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }

  try {
    return await imageCompression(file, options)
  } catch (error) {
    console.warn("Image compression failed:", error)
    return file
  }
}

export async function processFile(file: File): Promise<{ data: string; type: string }> {
  // If it's an image, compress it first
  const processedFile = file.type.startsWith("image/") ? await compressImage(file) : file

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve({
        data: reader.result as string,
        type: file.type,
      })
    }
    reader.onerror = reject
    reader.readAsDataURL(processedFile)
  })
}

export function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) => array.slice(i * size, i * size + size))
}

