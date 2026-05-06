import axios from 'axios';
import { useStore } from '../store/useStore';

const DEFAULT_URL = 'http://10.0.2.2:8080';

export function getApiHost(): string {
  return useStore.getState().serverUrl ?? DEFAULT_URL;
}

export function getWsUrl(): string {
  const host = getApiHost().replace(/^http/, 'ws');
  return `${host}/ws`;
}

// Axios instance with dynamic baseURL resolver
export const api = axios.create({ timeout: 15000 });

api.interceptors.request.use((config) => {
  config.baseURL = getApiHost();
  return config;
});

export const authHeaders = (token?: string | null) => {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};
