import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageMetadata } from '../types/index';
import { colors, radius } from '../config/theme';

type Props = {
  message: MessageMetadata;
  isOwn: boolean;
  decryptedText: string;
};

const MessageBubble = ({ message, isOwn, decryptedText }: Props) => {
  const reactions = Object.entries(message.reactions || {});

  return (
    <View style={[styles.container, isOwn ? styles.right : styles.left]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleGuest]}>
        <Text style={[styles.messageText, isOwn ? styles.messageOwn : styles.messageGuest]}>
          {decryptedText}
        </Text>
        {message.media.length > 0 ? (
          <View style={[styles.mediaPill, isOwn ? styles.mediaOwn : styles.mediaGuest]}>
            <Text style={[styles.mediaLabel, isOwn ? styles.mediaLabelOwn : styles.mediaLabelGuest]}>
              {message.media.length} attachment{message.media.length === 1 ? '' : 's'}
            </Text>
          </View>
        ) : null}
        {reactions.length > 0 ? (
          <View style={styles.reactions}>
            {reactions.map(([emoji, users]) => (
              <Text key={emoji} style={styles.reaction}>{emoji} {users.length}</Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 4, marginHorizontal: 16, flexDirection: 'row' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.md },
  bubbleOwn: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleGuest: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: { fontSize: 15, lineHeight: 21 },
  messageOwn: { color: '#000000' },
  messageGuest: { color: colors.ink },
  mediaPill: {
    marginTop: 8,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  mediaOwn: { backgroundColor: 'rgba(255,255,255,0.18)' },
  mediaGuest: { backgroundColor: colors.surfaceMuted },
  mediaLabel: { fontSize: 12, fontWeight: '700' },
  mediaLabelOwn: { color: '#FFFFFF' },
  mediaLabelGuest: { color: colors.inkMuted },
  reactions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  reaction: {
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    color: colors.inkMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 5,
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default MessageBubble;
