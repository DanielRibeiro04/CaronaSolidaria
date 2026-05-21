import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBET1NefQcjmU-a2YS1vhfdmUgTtallQzY',
  authDomain: 'caronasolidaria-b828d.firebaseapp.com',
  projectId: 'caronasolidaria-b828d',
  storageBucket: 'caronasolidaria-b828d.firebasestorage.app',
  messagingSenderId: '111086835268',
  appId: '1:111086835268:web:91c3ec73cecb38b3f78e11',
  measurementId: 'G-RKVMZHEQQB'
};

const app = initializeApp(firebaseConfig);
export const firebaseDb = getFirestore(app);
