import axios from 'axios';

// Android emulator uses 10.0.2.2 to reach host machine localhost.
// For physical device/production, set REACT_APP_API_HOST in your env or
// update this to your deployed backend URL.
export const API_HOST =
  process.env.REACT_APP_API_HOST ?? 'http://10.0.2.2:8080';

export const WS_HOST = API_HOST.replace(/^http/, 'ws');
export const WS_URL = `${WS_HOST}/ws`;

export const api = axios.create({
  baseURL: API_HOST,
  timeout: 15000,
});

// Attach token to all requests that need it
export const authHeaders = (token?: string | null) => {
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};
