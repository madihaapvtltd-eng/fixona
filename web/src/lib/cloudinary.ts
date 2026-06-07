// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  cloudName: (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || 'dxcj44eln',
  uploadPreset: (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'work_orders',
};

// Upload image to Cloudinary
export async function uploadImageToCloudinary(
  file: File,
  folder: string = 'work_orders'
): Promise<string | null> {
  try {
    if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
      throw new Error('Cloudinary is not configured (missing cloud name or upload preset)');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', folder);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Upload failed' } }));
      if (errorData.error?.message?.includes('Upload preset')) {
        throw new Error(
          `Cloudinary Upload Preset not found!\n\n` +
          `Please create an unsigned upload preset named "${CLOUDINARY_CONFIG.uploadPreset}" in your Cloudinary dashboard:\n` +
          `1. Go to https://console.cloudinary.com/console\n` +
          `2. Navigate to Settings > Upload\n` +
          `3. Create Upload Preset: "${CLOUDINARY_CONFIG.uploadPreset}"\n` +
          `4. Set Signing Mode to: UNSIGNED\n` +
          `5. Save and try again`
        );
      }
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
}

// Upload multiple images
export async function uploadMultipleImages(
  files: File[],
  folder: string = 'work_orders'
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadImageToCloudinary(file, folder));
  const results = await Promise.all(uploadPromises);
  return results.filter((url): url is string => url !== null);
}

// Get optimized image URL
export function getOptimizedImageUrl(
  url: string,
  width: number = 800,
  height?: number
): string {
  if (!url.includes('cloudinary.com')) return url;
  
  const transformations = `w_${width}${height ? `,h_${height},c_fit` : ''},q_auto,f_auto`;
  return url.replace('/upload/', `/upload/${transformations}/`);
}

// Get thumbnail URL
export function getThumbnailUrl(url: string): string {
  return getOptimizedImageUrl(url, 200, 200);
}
