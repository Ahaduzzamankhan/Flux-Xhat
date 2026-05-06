import { MediaMetadata } from '../types';

const CLOUD_NAME = 'dhsvtbdgi';
const UPLOAD_PRESET = 'Fluxenite'; // unsigned preset
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
};

/**
 * Upload a file directly from the device to Cloudinary using the unsigned preset.
 * No backend round-trip needed — Cloudinary accepts unsigned uploads from mobile.
 */
export async function uploadToCloudinary(
  fileUri: string,
  fileName: string,
  fileType: string,
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: fileType,
  } as any);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'chat_attachments');

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  return response.json() as Promise<CloudinaryUploadResult>;
}

export function buildCloudinaryMediaMetadata(
  result: CloudinaryUploadResult,
  chatId: string,
  uploaderId: string,
): MediaMetadata {
  return {
    file_url: result.secure_url,
    file_type: `${result.resource_type}/${result.format}`,
    file_size: result.bytes,
    chat_id: chatId,
    uploader_id: uploaderId,
  };
}
