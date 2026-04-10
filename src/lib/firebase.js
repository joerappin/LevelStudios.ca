import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyA9Bb-6HTt3CHBPZt_92HKR43GDY76Eew8",
  authDomain: "level-cb6c8.firebaseapp.com",
  projectId: "level-cb6c8",
  storageBucket: "level-cb6c8.firebasestorage.app",
  messagingSenderId: "698057112386",
  appId: "1:698057112386:web:f3088b230cd93cbc0fa6db",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
