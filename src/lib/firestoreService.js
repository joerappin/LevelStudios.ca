import {
  collection, doc, getDocs, setDoc,
  updateDoc, deleteDoc, query, where,
} from 'firebase/firestore'
import { db } from './firebase'

// Collections mirroring the folder structure: customers / workers / admin
function collectionFor(type) {
  if (type === 'client')   return 'customers'
  if (type === 'admin')    return 'admin'
  return 'workers'
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function fsCreateAccount(account) {
  const col = collectionFor(account.type)
  await setDoc(doc(db, col, account.id), account)
  return account
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function fsGetAllAccounts() {
  const [cusSnap, wrkSnap, admSnap] = await Promise.all([
    getDocs(collection(db, 'customers')),
    getDocs(collection(db, 'workers')),
    getDocs(collection(db, 'admin')),
  ])
  return [
    ...cusSnap.docs.map(d => d.data()),
    ...wrkSnap.docs.map(d => d.data()),
    ...admSnap.docs.map(d => d.data()),
  ]
}

export async function fsGetAccountByEmail(email) {
  for (const col of ['customers', 'workers', 'admin']) {
    const q = query(collection(db, col), where('email', '==', email))
    const snap = await getDocs(q)
    if (!snap.empty) return snap.docs[0].data()
  }
  return null
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function fsUpdateAccount(id, type, data) {
  const col = collectionFor(type)
  await updateDoc(doc(db, col, id), data)
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function fsDeleteAccount(id, type) {
  const col = collectionFor(type)
  await deleteDoc(doc(db, col, id))
}
