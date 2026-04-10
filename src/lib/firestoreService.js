import {
  collection, doc, getDoc, getDocs, addDoc, setDoc,
  updateDoc, deleteDoc, query, where,
} from 'firebase/firestore'
import { db } from './firebase'

const ACCOUNTS = 'accounts'

// ─── Create ───────────────────────────────────────────────────────────────────

export async function fsCreateAccount(account) {
  await setDoc(doc(db, ACCOUNTS, account.id), account)
  return account
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function fsGetAccounts() {
  const snap = await getDocs(collection(db, ACCOUNTS))
  return snap.docs.map(d => d.data())
}

export async function fsGetAccountByEmail(email) {
  const q = query(collection(db, ACCOUNTS), where('email', '==', email))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].data()
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function fsUpdateAccount(id, data) {
  await updateDoc(doc(db, ACCOUNTS, id), data)
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function fsDeleteAccount(id) {
  await deleteDoc(doc(db, ACCOUNTS, id))
}
