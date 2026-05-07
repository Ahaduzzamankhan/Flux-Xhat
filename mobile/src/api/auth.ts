import { api, authHeaders } from './api';
import { UserProfile } from '../types/index';

export type AuthResponse = {
  token: string;
  user: UserProfile;
};

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
}

export async function register(
  email: string,
  password: string,
  username: string,
  publicKey: string,
  avatar?: string,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', {
    email,
    password,
    username,
    public_key: publicKey,
    avatar,
  });
  return response.data;
}

export async function fetchMe(token: string): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/auth/me', {
    headers: authHeaders(token),
  });
  return response.data;
}
