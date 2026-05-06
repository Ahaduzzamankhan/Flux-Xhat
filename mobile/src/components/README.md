# Components Module

Reusable UI components used across screens.

## Components

- **AppButton.tsx** — Primary action button with loading state and variants (primary, secondary, danger)
- **AppTextInput.tsx** — Text input field with label, error state, and accessibility support
- **Avatar.tsx** — User avatar circle with online status indicator
- **MessageBubble.tsx** — Message display with timestamp, reactions, and media support
- **ScreenHeader.tsx** — Top header bar with back button and title

## Usage Pattern

```tsx
<AppButton
  title="Send"
  onPress={handleSend}
  loading={isLoading}
  disabled={messageText.trim() === ""}
/>

<AppTextInput
  label="Username"
  value={username}
  onChangeText={setUsername}
  placeholder="Enter your username"
/>

<Avatar
  name={user.username}
  uri={user.avatar}
  size={64}
  online={isOnline}
/>
```

## Styling

All components use the design system from `theme.ts`:
- Colors: primary, secondary, danger, background, surface
- Radius: xs, sm, md, lg
- Shadow effects for iOS/Android consistency

## Accessibility

- Labels for input fields
- Color contrast meets WCAG standards
- Touch targets ≥ 48pt
- Keyboard navigation support
