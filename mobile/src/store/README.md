# Store Module

Zustand state management for global app state.

## Files

- **useStore.ts** — Central Zustand store

## State

```typescript
type AppState = {
  // Auth state
  token: string | null;
  user: UserProfile | null;
  serverUrl: string | null;

  // Chat data
  chats: Chat[];
  messages: Record<string, MessageMetadata[]>;

  // Real-time state
  typing: Record<string, boolean>;
  online: Record<string, boolean>;

  // Actions
  setSession(token, user);
  clearSession();
  restoreSession();
  setServerUrl(url);
  clearServerUrl();
  setChats(chats);
  setMessages(chatId, messages);
  appendMessage(chatId, message);
  setTyping(chatId, typing);
  setOnline(userId, online);
};
```

## Key Actions

- **setSession()** — Save JWT and user profile to AsyncStorage and state
- **restoreSession()** — On app startup, load stored auth from device
- **clearSession()** — Logout: remove token, user, and message history
- **setServerUrl()** — Store backend URL for multi-server support
- **clearServerUrl()** — Clear server and force re-login

## Persistence

- Auth token and user profile saved to `@react-native-async-storage/async-storage`
- Server URL stored persistently to allow app closure and reconnection
- Message history kept in-memory (not persisted; loaded fresh on each chat open)
- Encryption keys derived from user ID (never stored)

## DevTools

For debugging:
```tsx
const state = useStore.getState();
console.log(state);

// Subscribe to changes
const unsubscribe = useStore.subscribe(console.log);
```
