# Navigation Module

React Navigation configuration for screen routing and transitions.

## Files

- **index.tsx** — Navigation stack and route configuration

## Route Structure

```typescript
type RootStackParamList = {
  ServerSetup: undefined;
  Login: undefined;
  Register: undefined;
  Chats: undefined;
  Chat: { chatId: string; recipientId: string; recipientName: string };
  Profile: undefined;
};
```

## Navigation Flow

1. **ServerSetup** — User selects backend server (shown once unless server URL cleared)
2. **Login/Register** — Authentication stack (shown if no valid JWT)
3. **Chats** — Home screen after login
4. **Chat** — Message view (push from ChatList)
5. **Profile** — User settings (accessible from any authenticated screen)

## Conditional Rendering

```tsx
export const AppNavigator = ({ authenticated, hasServer }) => {
  const getInitial = () => {
    if (!hasServer) return 'ServerSetup';
    if (!authenticated) return 'Login';
    return 'Chats';
  };

  return (
    <Stack.Navigator initialRouteName={getInitial()}>
      {/* Routes */}
    </Stack.Navigator>
  );
};
```

## Navigation Props

Access navigation in any screen:

```tsx
const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

// Navigate
navigation.navigate('Chat', { chatId, recipientId, recipientName });

// Go back
navigation.goBack();

// Reset stack
navigation.reset({ index: 0, routes: [{ name: 'Chats' }] });
```

## Route Params

Pass data between screens:

```tsx
// From ChatListScreen
onChatPress={(chat) => {
  navigation.navigate('Chat', {
    chatId: chat.chat_id,
    recipientId: chat.recipient_id,
    recipientName: chat.recipient_name
  });
}};

// In ChatScreen
const route = useRoute<RouteProp<RootStackParamList, 'Chat'>>();
const { chatId, recipientId } = route.params;
```
