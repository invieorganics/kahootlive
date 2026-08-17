
// KAHOOTLIVE - APP CORE (Single Source of Truth)
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
    collectionGroup // <--- Added import here
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getDatabase, ref, get, set, update, onValue, serverTimestamp as rtdbServerTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

import { createHeader } from "./header.js";
import { createFooter } from "./footer.js";


// ==========================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ==========================================

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

// Initialize persistence globally
setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Auth persistence setup error:", err);
});


// ==========================================
// AUTHENTICATION & ROLE UTILITIES (Page-Aware Isolation)
// ==========================================

function getCurrentUser() {
    const pathname = window.location.pathname.toLowerCase();
    
    try {
        if (pathname.includes("/admin/")) {
            const admin = JSON.parse(localStorage.getItem("kahootlive_admin") || "null");
            if (admin) return { ...admin, role: "admin" };
        }
        if (pathname.includes("/teacher/")) {
            const teacher = JSON.parse(localStorage.getItem("kahootlive_teacher") || "null");
            if (teacher) return { ...teacher, role: "teacher" };
        }
        if (pathname.includes("/student/")) {
            const student = JSON.parse(localStorage.getItem("kahootlive_student") || "null");
            if (student) return { ...student, role: "student" };
        }

        // Fallback for root pages
        const student = JSON.parse(localStorage.getItem("kahootlive_student") || "null");
        if (student) return { ...student, role: "student" };
        
        const teacher = JSON.parse(localStorage.getItem("kahootlive_teacher") || "null");
        if (teacher) return { ...teacher, role: "teacher" };

        const admin = JSON.parse(localStorage.getItem("kahootlive_admin") || "null");
        if (admin) return { ...admin, role: "admin" };

    } catch (e) {
        console.error("Error reading user from localStorage", e);
    }
    return null;
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function isStudent() {
    return getCurrentUser()?.role === "student";
}

function isTeacher() {
    return getCurrentUser()?.role === "teacher";
}

function isAdmin() {
    return getCurrentUser()?.role === "admin";
}

function logoutUser() {
    const pathname = window.location.pathname.toLowerCase();
    
    if (pathname.includes("/admin/")) {
        localStorage.removeItem("kahootlive_admin");
        signOut(auth).catch(() => {});
        window.location.href = "../admin-login.html";
    } else if (pathname.includes("/teacher/")) {
        localStorage.removeItem("kahootlive_teacher");
        signOut(auth).catch(() => {});
        window.location.href = "../teacher-login.html";
    } else if (pathname.includes("/student/")) {
        localStorage.removeItem("kahootlive_student");
        window.location.href = "../student-login.html";
    } else {
        localStorage.removeItem("kahootlive_student");
        localStorage.removeItem("kahootlive_admin");
        localStorage.removeItem("kahootlive_teacher");
        signOut(auth).catch(() => {});
        window.location.href = "index.html";
    }
}

async function waitForAuthReady() {
    return new Promise((resolve) => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            resolve(currentUser.role);
            return;
        }
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (user) {
                try {
                    // Check Admin
                    const adminSnap = await getDoc(doc(db, "admins", user.uid));
                    if (adminSnap.exists() && adminSnap.data().role === "admin") {
                        const admin = { id: user.uid, email: user.email, ...adminSnap.data(), role: "admin" };
                        localStorage.setItem("kahootlive_admin", JSON.stringify(admin));
                        resolve("admin");
                        return;
                    }

                    // Check Teacher
                    const teacherSnap = await getDoc(doc(db, "teachers", user.uid));
                    if (teacherSnap.exists() && teacherSnap.data().role === "teacher") {
                        const teacher = { id: user.uid, email: user.email, ...teacherSnap.data(), role: "teacher" };
                        localStorage.setItem("kahootlive_teacher", JSON.stringify(teacher));
                        resolve("teacher");
                        return;
                    }
                } catch (e) {
                    console.error("AppCore verification check failed:", e);
                }
            }
            resolve(null);
        });
    });
}

async function requireStudent(redirectUrl = "student-login.html") {
    if (!isStudent()) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

async function requireTeacher(redirectUrl = "teacher-login.html") {
    const role = await waitForAuthReady();
    if (role !== "teacher") {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

async function requireAdmin(redirectUrl = "admin-login.html") {
    const role = await waitForAuthReady();
    if (role !== "admin") {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

function loginStudent(studentData) {
    localStorage.setItem("kahootlive_student", JSON.stringify(studentData));
}

function loginTeacher(teacherData) {
    localStorage.setItem("kahootlive_teacher", JSON.stringify(teacherData));
}

function loginAdmin(adminData) {
    localStorage.setItem("kahootlive_admin", JSON.stringify(adminData));
}


// ==========================================
// CENTRAL APPLICATION STATE
// ==========================================

const AppState = {
    user: null,
    currentRoomId: null,
    roomData: null,
    activeListeners: {},
    isHost: false
};


// ==========================================
// INITIALIZE APP CORE (Auto Layout Injection)
// ==========================================

async function initAppCore() {
    AppState.user = getCurrentUser();
    console.log("KahootLive AppCore initialized. User:", AppState.user?.username || AppState.user?.email || "Guest");

    if (typeof createHeader === "function" && !document.querySelector("header")) {
        try {
            let headerElement = createHeader();
            if (headerElement instanceof Promise) {
                headerElement = await headerElement;
            }
            if (headerElement instanceof Node) {
                document.body.prepend(headerElement);
            } else if (typeof headerElement === "string") {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = headerElement;
                if (tempDiv.firstElementChild) {
                    document.body.prepend(tempDiv.firstElementChild);
                }
            }
        } catch (err) {
            console.error("Error auto-injecting header:", err);
        }
    }

    if (typeof createFooter === "function" && !document.querySelector("footer")) {
        try {
            let footerElement = createFooter();
            if (footerElement instanceof Promise) {
                footerElement = await footerElement;
            }
            if (footerElement instanceof Node) {
                document.body.appendChild(footerElement);
            } else if (typeof footerElement === "string") {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = footerElement;
                if (tempDiv.firstElementChild) {
                    document.body.appendChild(tempDiv.firstElementChild);
                }
            }
        } catch (err) {
            console.error("Error auto-injecting footer:", err);
        }
    }

    return AppState;
}

function getAppState() {
    return AppState;
}

function setRoomState(roomId, data) {
    AppState.currentRoomId = roomId;
    AppState.roomData = data;
}


// ==========================================
// REALTIME DATABASE ROOM ENGINE (100+ Players)
// ==========================================

async function createGameRoom(quizId, roomCode) {
    const teacher = getCurrentUser();
    if (!teacher || teacher.role !== "teacher") {
        throw new Error("Only authenticated teachers can create game rooms.");
    }

    const roomId = `room_${roomCode}_${Date.now()}`;
    const roomRef = ref(rtdb, `rooms/${roomId}`);

    const initialRoomState = {
        quizId: quizId,
        hostId: teacher.id,
        hostName: teacher.username || teacher.name,
        roomCode: roomCode,
        status: "waiting",
        currentQuestionIndex: 0,
        questionStartTime: null,
        createdAt: rtdbServerTimestamp ? rtdbServerTimestamp() : Date.now()
    };

    await set(roomRef, initialRoomState);
    AppState.currentRoomId = roomId;
    AppState.isHost = true;

    console.log(`Game room created successfully: ${roomId}`);
    return roomId;
}

async function joinGameRoom(roomCode, studentInfo) {
    const roomsRef = ref(rtdb, "rooms");
    const snapshot = await get(roomsRef);

    if (!snapshot.exists()) {
        throw new Error("No active game rooms found.");
    }

    let targetRoomId = null;
    snapshot.forEach((childSnap) => {
        const roomVal = childSnap.val();
        if (roomVal.roomCode === roomCode && roomVal.status === "waiting") {
            targetRoomId = childSnap.key;
        }
    });

    if (!targetRoomId) {
        throw new Error("Invalid room code or game has already started.");
    }

    const participantRef = ref(rtdb, `rooms/${targetRoomId}/participants/${studentInfo.id}`);
    await set(participantRef, {
        id: studentInfo.id,
        username: studentInfo.username,
        score: 0,
        joinedAt: rtdbServerTimestamp ? rtdbServerTimestamp() : Date.now()
    });

    AppState.currentRoomId = targetRoomId;
    AppState.isHost = false;

    return targetRoomId;
}

function subscribeToRoom(roomId, callback) {
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        AppState.roomData = data;
        if (callback && typeof callback === "function") {
            callback(data);
        }
    });

    AppState.activeListeners[roomId] = unsubscribe;
    return unsubscribe;
}


// ==========================================
// UNIFIED EXPORTS (Source of Truth)
// ==========================================

export {
    // Firebase Core Instances
    app,
    auth,
    db,
    rtdb,
    
    // Database References & Methods
    ref,
    get,
    set,
    update,
    onValue,
    serverTimestamp,
    rtdbServerTimestamp,
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
    collectionGroup, // <--- Added export here

    // Firebase Auth Methods
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,

    // App Core & State Management
    AppState,
    initAppCore,
    getAppState,
    setRoomState,
    createHeader,
    createFooter,
    createGameRoom,
    joinGameRoom,
    subscribeToRoom,

    // Authentication & Role Guards
    getCurrentUser,
    loginAdmin,
    loginTeacher,
    loginStudent,
    logoutUser,
    isAdmin,
    isTeacher,
    isStudent,
    isLoggedIn,
    requireAdmin,
    requireTeacher,
    requireStudent
};
