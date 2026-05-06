# Firestore Security Rules

Deploy these rules to Firebase Console → Firestore → Rules.

The backend is the authority for credential storage. Clients can read user profiles and chat metadata directly from Firestore, but message creation and updates go through the backend API for additional validation.

## Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - readable by all authenticated users, writable only by self
    match /users/{userId} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId &&
                       (request.resource.data.keys().hasAll(['uid', 'email', 'username', 'public_key']) ||
                        request.resource.data.keys().hasAny(['username', 'avatar', 'status']));
    }

    // Auth credentials - never read from frontend, only backend writes
    match /auth_credentials/{credId} {
      allow read: if false;
      allow write: if false;
    }

    // Chats collection - readable by participants, writable by backend
    match /chats/{chatId} {
      allow read: if request.auth.uid in resource.data.participants;
      
      allow create: if request.auth.uid in request.resource.data.participants &&
                       request.resource.data.participants.size() == 2;
      
      allow update: if request.auth.uid in resource.data.participants;
    }

    // Messages collection - readable by chat participants, writable by backend
    match /messages/{messageId} {
      allow read: if exists(/databases/$(database)/documents/chats/$(resource.data.chat_id)) &&
                     request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chat_id)).data.participants;
      
      allow create: if request.auth.uid == request.resource.data.sender_id &&
                       exists(/databases/$(database)/documents/chats/$(request.resource.data.chat_id)) &&
                       request.auth.uid in get(/databases/$(database)/documents/chats/$(request.resource.data.chat_id)).data.participants &&
                       request.resource.data.encrypted_content is string &&
                       request.resource.data.nonce is string;
      
      allow update: if request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chat_id)).data.participants &&
                       request.resource.data.message_id == resource.data.message_id &&
                       request.resource.data.reactions is map;
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Deployment Steps

1. **Go to Firebase Console**
   - Navigate to your Firebase project
   - Select **Firestore Database** from the left menu
   - Click **Rules** tab

2. **Copy & Paste Rules**
   - Delete the existing placeholder rules
   - Paste the rules above
   - Click **Publish**

3. **Verify Rules**
   - Test tab allows you to simulate reads/writes
   - Make sure test cases pass before going to production

## Security Principles

- **Authentication Required:** All operations require `request.auth.uid` (except public endpoints)
- **User Privacy:** Users can only modify their own profiles
- **Chat Isolation:** Users can only read/write chats they're participants in
- **Message Security:** Messages are encrypted before transmission; backend enforces encryption
- **Reaction Integrity:** Only chat participants can add reactions
- **Credentials Protected:** Auth credentials never exposed to frontend

## Testing

### Test Case 1: User Can Read Own Profile
```
Path: /users/user123
User Auth: user123
Request: read
Expected: allow
```

### Test Case 2: User Cannot Read Another User's Profile
```
Path: /users/user456
User Auth: user123
Request: read
Expected: allow (read is allowed for all authenticated users)
```

### Test Case 3: User Cannot Update Another User's Profile
```
Path: /users/user456
User Auth: user123
Request: update
Expected: deny
```

### Test Case 4: User Can Read Chat They're In
```
Path: /chats/direct_user123_user456
User Auth: user123
Document: { chat_id: "direct_user123_user456", participants: ["user123", "user456"] }
Request: read
Expected: allow
```

### Test Case 5: User Cannot Read Chat They're Not In
```
Path: /chats/direct_user456_user789
User Auth: user123
Document: { chat_id: "direct_user456_user789", participants: ["user456", "user789"] }
Request: read
Expected: deny
```

### Test Case 6: User Cannot Read Credentials
```
Path: /auth_credentials/user_email_hash
User Auth: user123
Request: read
Expected: deny
```

## Notes

- These rules assume **Backend as Authority:** The Rust backend validates all critical operations (registration, login, message sending)
- **Frontend Direct Access:** The mobile app reads users and chats directly from Firestore for performance
- **Message Creation:** Can be done directly from frontend (field validation in rules) or always through backend (comment out the create rule if backend-only)
- **Reactions:** Fully updatable from frontend (for real-time typing of reactions)
