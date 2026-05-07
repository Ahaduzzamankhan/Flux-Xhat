import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { fetchChats, createChat, searchUsers } from '../api/chat';
import { Chat, UserProfile } from '../types/index';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import Avatar from '../components/Avatar';
import ScreenHeader from '../components/ScreenHeader';
import { colors, radius, shadow } from '../config/theme';

type ListItem = Chat | UserProfile;

const ChatListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const setChats = useStore((state) => state.setChats);
  const chats = useStore((state) => state.chats);
  const online = useStore((state) => state.online);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (token) loadChats();
  }, [token]);

  const loadChats = async () => {
    setError(null);
    try {
      const data = await fetchChats(token!);
      setChats(data);
    } catch {
      setError('Unable to load chats. Check your connection.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!query.trim()) { setSearchResults([]); return; }
    setError(null);
    try {
      const results = await searchUsers(token!, query.trim());
      setSearchResults(results.filter((r) => r.uid !== user?.uid));
    } catch {
      setError('Search failed. Use username or email to find a user.');
    }
  };

  const handleStartChat = async (recipient: UserProfile) => {
    if (!token) return;
    try {
      const chat = await createChat(token, recipient.uid);
      setChats([chat, ...chats.filter((c) => c.chat_id !== chat.chat_id)]);
      navigation.navigate('Chat', {
        chatId: chat.chat_id,
        recipientId: recipient.uid,
        recipientName: recipient.username,
      });
    } catch {
      setError('Unable to open chat. Try again.');
    }
  };

  const renderChat = ({ item }: { item: Chat }) => {
    const participantId = item.participants.find((id) => id !== user?.uid) || item.participants[0];
    const isOnline = online[participantId] ?? false;
    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => navigation.navigate('Chat', {
          chatId: item.chat_id,
          recipientId: participantId,
          recipientName: participantId,
        })}
      >
        <Avatar name={participantId} online={isOnline} />
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle} numberOfLines={1}>{participantId}</Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {item.last_message ? 'Encrypted message received' : 'Start the conversation'}
          </Text>
        </View>
        <View style={styles.chevron}>
          <Text style={styles.chevronText}>{'>'}</Text>
        </View>
      </Pressable>
    );
  };

  const renderUser = ({ item }: { item: UserProfile }) => (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => handleStartChat(item)}
    >
      <Avatar name={item.username} uri={item.avatar} online={false} />
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{item.username}</Text>
        <Text style={styles.rowSubtitle}>{item.email}</Text>
      </View>
      <AppButton title="Open" variant="secondary" onPress={() => handleStartChat(item)} style={styles.smallButton} />
    </Pressable>
  );

  const showingSearch = searchResults.length > 0;
  const listData: ListItem[] = showingSearch ? searchResults : chats;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Chats"
        subtitle={user ? `Signed in as ${user.username}` : undefined}
        actionLabel="Profile"
        onAction={() => navigation.navigate('Profile')}
      />

      <View style={styles.searchPanel}>
        <AppTextInput
          placeholder="Search email or username"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <AppButton title="Search" onPress={handleSearch} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={listData}
        keyExtractor={(item) => ('chat_id' in item ? item.chat_id : item.uid)}
        renderItem={({ item }) => ('chat_id' in item ? renderChat({ item }) : renderUser({ item }))}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{showingSearch ? 'No matches' : 'No chats yet'}</Text>
            <Text style={styles.emptyText}>Search for a person to begin a private chat.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchPanel: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  error: { color: colors.danger, textAlign: 'center', marginBottom: 8, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  row: {
    minHeight: 76,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowPressed: { opacity: 0.78 },
  rowCopy: { flex: 1, marginLeft: 12 },
  rowTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  rowSubtitle: { color: colors.inkMuted, fontSize: 13, marginTop: 5 },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: { color: colors.inkMuted, fontSize: 18, fontWeight: '700' },
  smallButton: { minHeight: 38, paddingHorizontal: 12 },
  empty: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 30 },
  emptyTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  emptyText: { color: colors.inkMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default ChatListScreen;
