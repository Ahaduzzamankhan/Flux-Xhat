import { api, authHeaders } from './api';
import { Chat, MessageMetadata, UserProfile } from '../types/index';

export async function fetchChats(token: string): Promise<Chat[]> {
  const response = await api.get<Chat[]>('/chats', { headers: authHeaders(token) });
  return response.data;
}

export async function fetchChatMessages(token: string, chatId: string): Promise<MessageMetadata[]> {
  const response = await api.get<MessageMetadata[]>(`/chats/${chatId}/messages`, {
    headers: authHeaders(token),
  });
  return response.data;
}

export async function createChat(token: string, recipientId: string): Promise<Chat> {
  const response = await api.post<Chat>(
    '/chats',
    { recipient_id: recipientId },
    { headers: authHeaders(token) },
  );
  return response.data;
}

export async function fetchUser(token: string, uid: string): Promise<UserProfile> {
  const response = await api.get<UserProfile>(`/users/${uid}`, { headers: authHeaders(token) });
  return response.data;
}

export async function searchUsers(token: string, query: string): Promise<UserProfile[]> {
  const response = await api.get<UserProfile[]>('/users/search', {
    headers: authHeaders(token),
    params: { query },
  });
  return response.data;
}

export async function updateProfile(
  token: string,
  payload: Partial<Pick<UserProfile, 'username' | 'avatar' | 'status' | 'public_key'>>,
): Promise<UserProfile> {
  const response = await api.patch<UserProfile>('/users/me', payload, {
    headers: authHeaders(token),
  });
  return response.data;
}
