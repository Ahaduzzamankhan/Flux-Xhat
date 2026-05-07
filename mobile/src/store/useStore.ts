import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Chat, MessageMetadata, UserProfile } from '../types';

const AUTH_TOKEN_KEY = 'PRIVATE_CHAT_AUTH_TOKEN';
const USER_PROFILE_KEY = 'PRIVATE_CHAT_USER_PROFILE';
const SERVER_URL_KEY = 'PRIVATE_CHAT_SERVER_URL';

type AppState = {
  token: string | null;
  user: UserProfile | null;
  serverUrl: string | null;
  chats: Chat[];
  messages: Record<string, MessageMetadata[]>;
  typing: Record<string, boolean>;
  online: Record<string, boolean>;
  setSession: (token: string, user: UserProfile) => Promise<void>;
  clearSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setServerUrl: (url: string) => Promise<void>;
  clearServerUrl: () => Promise<void>;
  setChats: (chats: Chat[]) => void;
  setMessages: (chatId: string, messages: MessageMetadata[]) => void;
  appendMessage: (chatId: string, message: MessageMetadata) => void;
  setTyping: (chatId: string, typing: boolean) => void;
  setOnline: (userId: string, online: boolean) => void;
};

export const useStore = create<AppState>((set) => ({
  token: null,
  user: null,
  serverUrl: null,
  chats: [],
  messages: {},
  typing: {},
  online: {},

  setSession: async (token, user) => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
    set({ token, user });
  },

  clearSession: async () => {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
    set({ token: null, user: null, chats: [], messages: {}, typing: {}, online: {} });
  },

  restoreSession: async () => {
    const [token, userJson, serverUrl] = await Promise.all([
      AsyncStorage.getItem(AUTH_TOKEN_KEY),
      AsyncStorage.getItem(USER_PROFILE_KEY),
      AsyncStorage.getItem(SERVER_URL_KEY),
    ]);
    if (serverUrl) set({ serverUrl });
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as UserProfile;
        set({ token, user });
      } catch {
        await AsyncStorage.removeItem(USER_PROFILE_KEY);
      }
    }
  },

  setServerUrl: async (url) => {
    await AsyncStorage.setItem(SERVER_URL_KEY, url);
    set({ serverUrl: url });
  },

  clearServerUrl: async () => {
    await AsyncStorage.removeItem(SERVER_URL_KEY);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
    set({ serverUrl: null, token: null, user: null, chats: [], messages: {}, typing: {}, online: {} });
  },

  setChats: (chats) => set({ chats }),

  setMessages: (chatId, messages) =>
    set((state) => ({ messages: { ...state.messages, [chatId]: messages } })),

  appendMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    })),

  setTyping: (chatId, typing) =>
    set((state) => ({ typing: { ...state.typing, [chatId]: typing } })),

  setOnline: (userId, online) =>
    set((state) => ({ online: { ...state.online, [userId]: online } })),
}));
