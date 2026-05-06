import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ServerSetupScreen from '../screens/ServerSetupScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  ServerSetup: undefined;
  Login: undefined;
  Register: undefined;
  Chats: undefined;
  Chat: { chatId: string; recipientId: string; recipientName: string };
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = {
  authenticated: boolean;
  hasServer: boolean;
};

export const AppNavigator = ({ authenticated, hasServer }: Props) => {
  const getInitial = () => {
    if (!hasServer) return 'ServerSetup';
    if (!authenticated) return 'Login';
    return 'Chats';
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitial()}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="ServerSetup" component={ServerSetupScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Chats" component={ChatListScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};
