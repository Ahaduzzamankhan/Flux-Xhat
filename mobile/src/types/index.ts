export type UserProfile = {
  uid: string;
  email: string;
  username: string;
  avatar?: string | null;
  status?: string | null;
  last_seen: string;
  public_key: string;
};

export type Chat = {
  chat_id: string;
  participants: string[];
  last_message?: string | null;
  updated_at: string;
};

export type MediaMetadata = {
  file_url: string;
  file_type: string;
  file_size: number;
  chat_id: string;
  uploader_id: string;
};

export type MessageMetadata = {
  message_id: string;
  chat_id: string;
  sender_id: string;
  recipient_id: string;
  encrypted_content: string;
  nonce: string;
  media: MediaMetadata[];
  timestamp: string;
  reactions: Record<string, string[]>;
};

export type ServerWsEvent =
  | {
      type: 'presence';
      user_id: string;
      online: boolean;
      last_seen: string;
    }
  | {
      type: 'message';
      message: MessageMetadata;
    }
  | {
      type: 'typing';
      chat_id: string;
      user_id: string;
      is_typing: boolean;
    }
  | {
      type: 'reaction';
      chat_id: string;
      message_id: string;
      user_id: string;
      emoji: string;
    }
  | {
      type: 'error';
      message: string;
    };
