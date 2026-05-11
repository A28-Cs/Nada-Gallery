const CLOUDINARY_CLOUD_NAME = 'dedr1pf0c';
const CLOUDINARY_UPLOAD_PRESET = 'Nada Gallery';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId?: string;
  width?: number;
  height?: number;
  originalFilename?: string;
}

interface CloudinaryResponse {
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
  original_filename?: string;
  error?: {
    message?: string;
  };
}

export function uploadImageToCloudinary(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Only image files can be uploaded.'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const request = new XMLHttpRequest();
    request.open('POST', CLOUDINARY_UPLOAD_URL);
    request.responseType = 'json';

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () => {
      const response = request.response as CloudinaryResponse | null;

      if (request.status >= 200 && request.status < 300 && response?.secure_url) {
        onProgress?.(100);
        resolve({
          secureUrl: response.secure_url,
          publicId: response.public_id,
          width: response.width,
          height: response.height,
          originalFilename: response.original_filename,
        });
        return;
      }

      reject(new Error(response?.error?.message || 'Cloudinary upload failed.'));
    };

    request.onerror = () => {
      reject(new Error('Cloudinary upload failed. Please check your connection.'));
    };

    request.send(formData);
  });
}
