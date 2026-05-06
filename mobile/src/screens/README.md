# Screens Module

Full-screen view controllers for the app's main user flows.

## Screens

- **ServerSetupScreen.tsx** — Initial setup wizard for backend URL configuration
  - Quick presets (Self-Hosted, Railway, Local Dev)
  - URL validation via `GET /health`
  - Saves server URL to Zustand store

- **LoginScreen.tsx** — Email/password authentication
  - Email validation
  - JWT token storage
  - Redirect to ChatListScreen on success

- **RegisterScreen.tsx** — New user account creation
  - Email uniqueness check
  - Password strength validation
  - Auto-login after registration

- **ChatListScreen.tsx** — Home screen showing all chats
  - Lists 1-on-1 conversations
  - Shows last message preview
  - Create new chat button
  - Pull-to-refresh to reload chats

- **ChatScreen.tsx** — Message view for active chat
  - Message history (scrollable)
  - Real-time message delivery
  - Typing indicators
  - Send message form with emoji reactions
  - Media attachment support

- **ProfileScreen.tsx** — User profile management
  - Edit username, avatar, status
  - View public encryption key
  - Change server connection
  - Logout button

## Navigation Flow

```
ServerSetup (if no server URL)
    ↓
Login/Register (if no token)
    ↓
ChatList (main)
    ├→ Chat
    └→ Profile
```

## State Management

Each screen uses Zustand hooks to access and mutate global state:

```tsx
const { chats, setChats } = useStore(state => ({
  chats: state.chats,
  setChats: state.setChats
}));
```

## Performance Optimization

- `useFocusEffect()` for screen-specific setup/cleanup
- Memoized event handlers to prevent re-renders
- Lazy load message history (load earlier messages on scroll)
