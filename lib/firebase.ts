import { initializeApp } from "firebase/app"
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
//add your firebase sdk config here
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const storage = getStorage(app)

export type RetentionPeriod = "1hour" | "2hours" | "8hours" | "24hours" | "48hours" | "4days" | "1week"

export const RETENTION_PERIODS: { [K in RetentionPeriod]: number } = {
  "1hour": 60 * 60 * 1000,
  "2hours": 2 * 60 * 60 * 1000,
  "8hours": 8 * 60 * 60 * 1000,
  "24hours": 24 * 60 * 60 * 1000,
  "48hours": 48 * 60 * 60 * 1000,
  "4days": 4 * 24 * 60 * 60 * 1000,
  "1week": 7 * 24 * 60 * 60 * 1000,
}

export interface StoredFile {
  url: string
  path: string
  type: string
  name: string
}

export interface StoredData {
  text: string
  editKey: string
  accessKey: string
  createdAt: number
  retentionPeriod: RetentionPeriod
  expiresAt: number
}

interface UploadProgress {
  total: number
  current: number
  urls: StoredFile[]
}

// Helper function to validate file before upload
function validateFile(file: string): boolean {
  // Check if it's a data URL
  if (!file.startsWith("data:")) {
    return false
  }

  // Check file size (max 50MB)
  const approximateSize = (file.length * 3) / 4 // Base64 to bytes approximation
  const MAX_SIZE = 50 * 1024 * 1024 // 50MB in bytes

  return approximateSize <= MAX_SIZE
}

export async function saveData(data: StoredData): Promise<void> {
  const docRef = doc(db, "tempData", data.accessKey)

  try {
    const now = Date.now()
    const expiresAt = now + RETENTION_PERIODS[data.retentionPeriod]

    await setDoc(docRef, {
      text: data.text,
      editKey: data.editKey,
      accessKey: data.accessKey,
      createdAt: Timestamp.fromMillis(now),
      retentionPeriod: data.retentionPeriod,
      expiresAt: Timestamp.fromMillis(expiresAt),
    })
  } catch (error) {
    console.error("Error saving data:", error)
    throw error
  }
}

export async function getData(accessKey: string): Promise<StoredData | null> {
  const docRef = doc(db, "tempData", accessKey)

  try {
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    const now = Date.now()

    // Check if data has expired
    if (now >= data.expiresAt.toMillis()) {
      await deleteData(accessKey)
      return null
    }

    return {
      text: data.text,
      editKey: data.editKey,
      accessKey: data.accessKey,
      createdAt: data.createdAt.toMillis(),
      retentionPeriod: data.retentionPeriod as RetentionPeriod,
      expiresAt: data.expiresAt.toMillis(),
    }
  } catch (error) {
    console.error("Error getting data:", error)
    return null
  }
}

export async function deleteData(accessKey: string): Promise<void> {
  try {
    const docRef = doc(db, "tempData", accessKey)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting data:", error)
    throw error
  }
}

// Add a cleanup function for expired data
export async function cleanupExpiredData(): Promise<void> {
  const now = Timestamp.now()

  try {
    const q = query(collection(db, "tempData"), where("expiresAt", "<=", now))

    const querySnapshot = await getDocs(q)

    await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        await deleteData(doc.id)
      }),
    )
  } catch (error) {
    console.error("Error cleaning up expired data:", error)
    throw error
  }
}

