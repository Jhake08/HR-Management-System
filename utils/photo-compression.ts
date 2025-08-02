/**
 * Advanced photo compression utilities for HR system
 * Optimized for Google Sheets storage and mobile performance
 */

export interface CompressionOptions {
  quality: number // 0.1 to 1.0
  maxWidth: number
  maxHeight: number
  format: "jpeg" | "webp"
  enableProgressive?: boolean
}

export interface CompressionResult {
  dataUrl: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  dimensions: { width: number; height: number }
}

/**
 * Compress image with advanced options
 */
export async function compressImage(
  imageSource: HTMLVideoElement | HTMLImageElement | File,
  options: CompressionOptions,
): Promise<CompressionResult> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Canvas context not available")
  }

  let sourceWidth: number
  let sourceHeight: number
  let originalSize: number

  // Handle different input types
  if (imageSource instanceof HTMLVideoElement) {
    sourceWidth = imageSource.videoWidth
    sourceHeight = imageSource.videoHeight
    originalSize = sourceWidth * sourceHeight * 4 // RGBA bytes
  } else if (imageSource instanceof HTMLImageElement) {
    sourceWidth = imageSource.naturalWidth
    sourceHeight = imageSource.naturalHeight
    originalSize = sourceWidth * sourceHeight * 4
  } else {
    // File input
    const img = await loadImageFromFile(imageSource)
    sourceWidth = img.width
    sourceHeight = img.height
    originalSize = imageSource.size
    imageSource = img
  }

  // Calculate optimal dimensions
  const { width, height } = calculateOptimalDimensions(sourceWidth, sourceHeight, options.maxWidth, options.maxHeight)

  // Set canvas dimensions
  canvas.width = width
  canvas.height = height

  // Apply image smoothing for better quality
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  // Draw image
  ctx.drawImage(imageSource as CanvasImageSource, 0, 0, width, height)

  // Apply additional optimizations for HR photos
  if (options.format === "jpeg") {
    // Enhance contrast slightly for better face recognition
    enhanceForFaceRecognition(ctx, width, height)
  }

  // Generate compressed image
  const mimeType = options.format === "webp" ? "image/webp" : "image/jpeg"
  const dataUrl = canvas.toDataURL(mimeType, options.quality)

  // Calculate compression metrics
  const compressedSize = (dataUrl.length * 0.75) / 1024 // Base64 to KB
  const compressionRatio = ((originalSize / 1024 - compressedSize) / (originalSize / 1024)) * 100

  return {
    dataUrl,
    originalSize: originalSize / 1024, // KB
    compressedSize,
    compressionRatio,
    dimensions: { width, height },
  }
}

/**
 * Calculate optimal dimensions maintaining aspect ratio
 */
function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  let width = originalWidth
  let height = originalHeight

  // Scale down if larger than max dimensions
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  }
}

/**
 * Enhance image for better face recognition in HR context
 */
function enhanceForFaceRecognition(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Slight contrast enhancement for better facial features
  const contrast = 1.1
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128)) // Red
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)) // Green
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)) // Blue
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * Load image from file
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Preset compression configurations for different use cases
 */
export const COMPRESSION_PRESETS = {
  // For attendance selfies - balance between quality and size
  attendance: {
    quality: 0.7,
    maxWidth: 800,
    maxHeight: 600,
    format: "jpeg" as const,
  },

  // For profile photos - higher quality
  profile: {
    quality: 0.85,
    maxWidth: 1024,
    maxHeight: 768,
    format: "jpeg" as const,
  },

  // For document photos - optimized for text readability
  document: {
    quality: 0.9,
    maxWidth: 1200,
    maxHeight: 900,
    format: "jpeg" as const,
  },

  // For mobile/low bandwidth - maximum compression
  mobile: {
    quality: 0.5,
    maxWidth: 640,
    maxHeight: 480,
    format: "jpeg" as const,
  },
} as const

/**
 * Estimate storage impact for Google Sheets
 */
export function estimateStorageImpact(
  photosPerDay: number,
  employees: number,
  compressionRatio: number,
): {
  dailyStorage: number
  monthlyStorage: number
  yearlyStorage: number
  cellsUsed: number
} {
  const avgPhotoSize = 50 // KB after compression
  const dailyStorage = photosPerDay * employees * avgPhotoSize
  const monthlyStorage = dailyStorage * 22 // Working days
  const yearlyStorage = monthlyStorage * 12

  // Google Sheets cell calculation (each photo URL ~100 characters)
  const cellsUsed = photosPerDay * employees * 365

  return {
    dailyStorage,
    monthlyStorage,
    yearlyStorage,
    cellsUsed,
  }
}

/**
 * Validate image before compression
 */
export function validateImageForHR(file: File): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check file type
  if (!file.type.startsWith("image/")) {
    errors.push("File must be an image")
  }

  // Check file size (max 10MB before compression)
  if (file.size > 10 * 1024 * 1024) {
    errors.push("Image too large (max 10MB)")
  }

  // Check minimum dimensions (for face recognition)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      if (img.width < 200 || img.height < 200) {
        errors.push("Image too small (minimum 200x200px)")
      }
      resolve({ isValid: errors.length === 0, errors })
    }
    img.src = URL.createObjectURL(file)
  }) as any
}
