// ==========================================
// KAHOOTFIREBASE CONFIGURATION & EXPORTS
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc,         
    deleteDoc,      
    updateDoc, 
    collection, 
    getDocs, 
    addDoc,         
    query, 
    where, 
    serverTimestamp, 
    arrayUnion,
    orderBy,
    onSnapshot,
    collectionGroup 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getDatabase, ref, get, set, update, onValue, serverTimestamp as rtdbServerTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCoppTcVimCqHBG7H7HKXXf2e0YDCpj4S4",
  authDomain: "kahootlive-84b8f.firebaseapp.com",
  projectId: "kahootlive-84b8f",
  storageBucket: "kahootlive-84b8f.firebasestorage.app",
  messagingSenderId: "681220113849",
  appId: "1:681220113849:web:be4e35892bbb910131a268",
  databaseURL: "https://kahootlive-84b8f-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

export {
    app,
    auth,
    db,
    rtdb,
    ref,
    get,
    set,
    update,
    onValue,
    serverTimestamp,
    rtdbServerTimestamp,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    doc,
    getDoc,
    setDoc,       
    deleteDoc,    
    updateDoc,
    collection,
    getDocs,
    addDoc,       
    query,
    where,
    arrayUnion,
    orderBy,
    onSnapshot,
    collectionGroup
};

