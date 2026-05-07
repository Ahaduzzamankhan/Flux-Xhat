import { initializeApp, getApps } from '@react-native-firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyBAg8WrMYHQAIaau6fKMbVd-vcN-6Tqjfk',
  authDomain: 'abfluxenite.firebaseapp.com',
  projectId: 'abfluxenite',
  storageBucket: 'abfluxenite.firebasestorage.app',
  messagingSenderId: '288632176888',
  appId: '1:288632176888:web:a97ef193a371a0667dbb0d',
  measurementId: 'G-3TFERWY122',
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}
