import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import { fetchChatMessages, fetchUser } from '../api/chat';
import { uploadToCloudinary, buildCloudinaryMediaMetadata } from '../api/cloudinary';
import {
  connectWebSocket,
  disconnectWebSocket,
  joinChat,
  sendMessageEvent,
  sendTypingEvent,
} from '../api/websocket';
import { decryptMessage, encryptMessage, getPrivateKey } from '../crypto/e2ee';
import { MessageMetadata, UserProfile } from '../types';
import { RootStackParamList } from '../navigation';
import MessageBubble from '../components/MessageBubble';
import Avatar from '../components/Avatar';
import ScreenHeader from '../components/ScreenHeader';
import { colors, radius } from '../theme';

type UiMessage = MessageMetadata & {
  own: boolean;
  decryptedText: string;
};

const ChatScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Chat'>>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const messages = useStore((state) => state.messages[route.params.chatId] || []);
  const appendMessage = useStore((state) => state.appendMessage);
  const setTyping = useStore((state) => state.setTyping);
  const setOnline = useStore((state) => state.setOnline);
  const typingState = useStore((state) => state.typing[route.params.chatId] ?? false);

  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState<UiMessage[]>([]);

  const chatId = route.params.chatId;
  const recipientId = route.params.recipientId;
  const recipientName = recipient?.username || route.params.recipientName;

  useEffect(() => {
    if (!token) {
      return;
    }

    const initialize = async () => {
      setLoading(true);
      try {
        const [recipientProfile, chatMessages] = await Promise.all([
          fetchUser(token, recipientId),
          fetchChatMessages(token, chatId),
        ]);
        setRecipient(recipientProfile);
        chatMessages.forEach((message) => appendMessage(chatId, message));
      } catch (err) {
        setError('Unable to load chat.');
      } finally {
        setLoading(false);
      }
    };

    initialize();
    connectWebSocket(token, handleSocketEvent, () => joinChat(chatId));

    return () => {
      disconnectWebSocket();
    };
  }, [token, chatId, recipientId]);

  useEffect(() => {
    const decryptAll = async () => {
      if (!recipient || !user) {
        return;
      }

      const privateKey = await getPrivateKey();
      if (!privateKey) {
        setDecryptedMessages(
          messages.map((message) => ({
            ...message,
            own: message.sender_id === user.uid,
            decryptedText: '[unable to decrypt]',
          })),
        );
        return;
      }

      const list = await Promise.all(
        messages.map(async (message) => {
          let decryptedText = '[encrypted]';
          try {
            decryptedText = await decryptMessage(
              message.encrypted_content,
              message.nonce,
              privateKey,
              recipient.public_key,
            );
          } catch {
            decryptedText = '[unable to decrypt]';
          }
          return {
            ...message,
            own: message.sender_id === user.uid,
            decryptedText,
          };
        }),
      );

      setDecryptedMessages(list);
    };

    decryptAll();
  }, [messages, recipient, user]);

  const handleSocketEvent = async (event: any) => {
    if (event.type === 'message' && event.message?.chat_id === chatId) {
      appendMessage(chatId, event.message);
    }
    if (event.type === 'typing' && event.chat_id === chatId) {
      setTyping(chatId, event.is_typing);
    }
    if (event.type === 'presence') {
      setOnline(event.user_id, event.online);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || !token || !user || !recipient) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      const privateKey = await getPrivateKey();
      if (!privateKey) {
        throw new Error('Encryption key unavailable on this device.');
      }
      const { encrypted, nonce } = await encryptMessage(text.trim(), privateKey, recipient.public_key);
      sendMessageEvent(chatId, recipient.uid, encrypted, nonce, []);
      setText('');
    } catch (err) {
      setError('Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setText(value);
    sendTypingEvent(chatId, recipientId, Boolean(value.trim()));
  };

  const handleAttachFile = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });

    if (result.didCancel) return;
    if (result.errorCode) {
      setError(result.errorMessage || 'Image picker failed');
      return;
    }

    if (result.assets && result.assets.length > 0) {
      if (!token || !user || !recipient) return;

      setSending(true);
      setError(null);
      try {
        const asset = result.assets[0];
        if (!asset.uri || !asset.fileName || !asset.type) {
          throw new Error('Invalid asset selected.');
        }

        const privateKey = await getPrivateKey();
        if (!privateKey) {
          throw new Error('Encryption key unavailable.');
        }

        const cloudinaryResult = await uploadToCloudinary(asset.uri, asset.fileName, asset.type);
        const media = [buildCloudinaryMediaMetadata(cloudinaryResult, chatId, user.uid)];

        const { encrypted, nonce } = await encryptMessage(
          text.trim() || '[Image Attachment]',
          privateKey,
          recipient.public_key,
        );
        sendMessageEvent(chatId, recipient.uid, encrypted, nonce, media);
        setText('');
      } catch (err) {
        setError('Unable to send attachment.');
      } finally {
        setSending(false);
      }
    }
  };

  const renderMessage = ({ item }: { item: UiMessage }) => (
    <MessageBubble message={item} isOwn={item.own} decryptedText={item.decryptedText} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title={recipientName}
          subtitle={typingState ? 'typing...' : 'end-to-end encrypted'}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.identityStrip}>
          <Avatar name={recipientName} uri={recipient?.avatar} online={false} size={38} />
          <Text style={styles.identityText} numberOfLines={1}>
            Messages are encrypted before they leave your phone.
          </Text>
        </View>

        <FlatList
          data={decryptedMessages}
          keyExtractor={(item) => item.message_id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>Send the first encrypted message.</Text>
            </View>
          }
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.inputRow}>
          <Pressable accessibilityRole="button" style={styles.attachButton} onPress={handleAttachFile}>
            <Text style={styles.attachText}>+</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={colors.inkSoft}
            value={text}
            onChangeText={handleTyping}
            multiline
          />
          <Pressable
            accessibilityRole="button"
            disabled={sending || !text.trim()}
            style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
          >
            <Text style={styles.sendText}>{'>'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  identityStrip: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
  },
  identityText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 10,
  },
  messageList: {
    paddingVertical: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.inkMuted,
    marginTop: 8,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 116,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginHorizontal: 8,
    color: colors.ink,
    fontSize: 16,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachText: {
    fontSize: 25,
    color: colors.primary,
    fontWeight: '600',
    marginTop: -2,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: -2,
  },
});

export default ChatScreen;
