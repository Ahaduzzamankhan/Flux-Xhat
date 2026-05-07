import { api, authHeaders } from './api';
import { MediaMetadata } from '../types/index';

export type SignedUpload = {
  upload_url: string;
  file_url: string;
  object_key: string;
  expires_in_seconds: number;
};

export async function requestSignedUpload(
  token: string,
  chatId: string,
  filename: string,
  contentType: string,
): Promise<SignedUpload> {
  const response = await api.post<SignedUpload>(
    '/uploads/signed-url',
    { chat_id: chatId, filename, content_type: contentType },
    { headers: authHeaders(token) },
  );
  return response.data;
}

export async function uploadFileToSignedUrl(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const { Buffer } = await import('buffer');
  const RNFS = await import('react-native-fs');
  const base64Data = await RNFS.default.readFile(fileUri, 'base64');
  const body = Buffer.from(base64Data, 'base64');
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body,
  });
}

export function buildFileMetadata(
  fileUrl: string,
  fileType: string,
  fileSize: number,
  chatId: string,
  uploaderId: string,
): MediaMetadata {
  return { file_url: fileUrl, file_type: fileType, file_size: fileSize, chat_id: chatId, uploader_id: uploaderId };
}
