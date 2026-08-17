// ==========================================
// HQC CLASS - FIREBASE CONFIGURATION & SDK
// ==========================================

// Import the functions you need from the SDKs you need using the official CDN (Firebase v11 / v12 compatible)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCiWfRWFR2rDtCP_x8VdU40q2rkAJO4cWQ",
  authDomain: "classhqc.firebaseapp.com",
  projectId: "classhqc",
  storageBucket: "classhqc.firebasestorage.app",
  messagingSenderId: "682597020610",
  appId: "1:682597020610:web:96f56cab32e8eaae999c5b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth instance
const auth = getAuth(app);

// Initialize Firestore database instance
const db = getFirestore(app);

/**
 * Helper function to retrieve a single document from Firestore.
 * @param {string} colName - The collection name.
 * @param {string} docId - The document ID.
 * @returns {Promise<Object|null>} - Returns the document data with ID, or null if not found.
 */
async function dbGetDoc(colName, docId) {
  try {
    const docRef = doc(db, colName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.warn(`No such document in collection "${colName}" with ID "${docId}"!`);
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
}

/**
 * Helper function to set or overwrite a document in Firestore.
 * @param {string} colName - The collection name.
 * @param {string} docId - The document ID.
 * @param {Object} data - The data object to save.
 * @param {boolean} merge - Whether to merge with existing data (default: true).
 */
async function dbSetDoc(colName, docId, data, merge = true) {
  try {
    const docRef = doc(db, colName, docId);
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge });
    return true;
  } catch (error) {
    console.error("Error setting document:", error);
    throw error;
  }
}

/**
 * Helper function to format a JavaScript Date object or Firestore timestamp into a readable Date string.
 * @param {Date|Object|number} timestamp - The date input.
 * @returns {string} - Formatted date string (e.g., "Aug 8, 2026").
 */
function formatDate(timestamp) {
  if (!timestamp) return "";
  let dateObj;
  
  if (typeof timestamp.toDate === "function") {
    dateObj = timestamp.toDate();
  } else if (timestamp.seconds) {
    dateObj = new Date(timestamp.seconds * 1000);
  } else {
    dateObj = new Date(timestamp);
  }

  if (isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/**
 * Helper function to format a JavaScript Date object or Firestore timestamp into a readable Time string.
 * @param {Date|Object|number} timestamp - The date input.
 * @returns {string} - Formatted time string (e.g., "07:37 AM").
 */
function formatTime(timestamp) {
  if (!timestamp) return "";
  let dateObj;
  
  if (typeof timestamp.toDate === "function") {
    dateObj = timestamp.toDate();
  } else if (timestamp.seconds) {
    dateObj = new Date(timestamp.seconds * 1000);
  } else {
    dateObj = new Date(timestamp);
  }

  if (isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

/**
 * Helper function to format into both Date and Time.
 * @param {Date|Object|number} timestamp - The date input.
 * @returns {string} - Formatted full date and time string.
 */
function formatDateTime(timestamp) {
  const d = formatDate(timestamp);
  const t = formatTime(timestamp);
  if (!d || !t) return d || t || "";
  return `${d}, ${t}`;
}

// Export everything comprehensively to prevent any future missing export errors across modules
export { 
  app, 
  auth, 
  signOut, 
  onAuthStateChanged, 
  db, 
  dbGetDoc, 
  dbSetDoc, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  formatDate, 
  formatTime, 
  formatDateTime 
};

