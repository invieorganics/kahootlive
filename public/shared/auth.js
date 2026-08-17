// ==========================================
// KAHOOTLIVE - AUTH MODULE (PERSISTENT)
// ==========================================

import {
    auth,
    db as kahootDb,

    // Firebase Auth
    signInWithEmailAndPassword,
    signOut,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged,

    // Firestore
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc
} from "./kahoot-firebase-config.js";


// ==========================================
// STORAGE KEYS
// ==========================================

const STORAGE_KEYS = {
    ADMIN: "kahootlive_admin",
    TEACHER: "kahootlive_teacher",
    STUDENT: "kahootlive_student"
};


// Initialize Firebase Auth persistence immediately
setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Auth persistence error:", err);
});


// ==========================================
// ADMIN LOGIN
// ==========================================

async function loginAdmin(email, password) {
    try {
        email = String(email || "").trim();
        password = String(password || "");

        if (!email || !password) {
            return {
                success: false,
                message: "Email and password are required."
            };
        }

        await setPersistence(auth, browserLocalPersistence);
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;

        const adminRef = doc(kahootDb, "admins", uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists() || adminSnap.data().role !== "admin") {
            await signOut(auth);
            return {
                success: false,
                message: "You are not authorized as an admin."
            };
        }

        const adminData = adminSnap.data();
        const admin = {
            id: uid,
            email: credential.user.email,
            ...adminData,
            role: "admin"
        };

        localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(admin));
        return { success: true, admin };

    } catch (error) {
        console.error("Admin login error caught:", error);
        return { success: false, message: getAuthErrorMessage(error) };
    }
}


// ==========================================
// TEACHER LOGIN
// ==========================================

async function loginTeacher(email, password) {
    try {
        email = String(email || "").trim();
        password = String(password || "");

        if (!email || !password) {
            return {
                success: false,
                message: "Email and password are required."
            };
        }

        await setPersistence(auth, browserLocalPersistence);
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;

        const teacherRef = doc(kahootDb, "teachers", uid);
        const teacherSnap = await getDoc(teacherRef);

        if (!teacherSnap.exists()) {
            await signOut(auth);
            return {
                success: false,
                message: "You are not registered as a teacher."
            };
        }

        const teacherData = teacherSnap.data();

        if (teacherData.role !== "teacher" || teacherData.active === false) {
            await signOut(auth);
            return {
                success: false,
                message: "This account is not authorized as an active teacher."
            };
        }

        const sessionTeacher = {
            id: uid,
            email: credential.user.email,
            name: teacherData.name || "",
            role: "teacher",
            active: teacherData.active !== false
        };

        localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(sessionTeacher));

        return {
            success: true,
            teacher: sessionTeacher
        };

    } catch (error) {
        console.error("Teacher login error:", error);
        return {
            success: false,
            message: getAuthErrorMessage(error)
        };
    }
}


// ==========================================
// STUDENT LOGIN
// ==========================================

async function loginStudent(username, pin) {
    try {
        username = String(username || "").trim();
        pin = String(pin || "").trim();

        if (!username || !pin) {
            return {
                success: false,
                message: "Username and PIN are required."
            };
        }

        const studentsRef = collection(kahootDb, "students");
        const studentQuery = query(studentsRef, where("username", "==", username));
        const snapshot = await getDocs(studentQuery);

        if (snapshot.empty) {
            return {
                success: false,
                message: "Student account not found."
            };
        }

        let student = null;
        snapshot.forEach((studentDoc) => {
            const data = studentDoc.data();
            if (String(data.pin) === pin && data.active !== false) {
                student = { id: studentDoc.id, ...data };
            }
        });

        if (!student) {
            return { success: false, message: "Invalid student login." };
        }

        const sessionStudent = {
            id: student.id,
            username: student.username,
            name: student.name || "",
            role: "student",
            active: student.active !== false
        };

        localStorage.setItem(STORAGE_KEYS.STUDENT, JSON.stringify(sessionStudent));
        return { success: true, student: sessionStudent };

    } catch (error) {
        console.error("Student login error:", error);
        return { success: false, message: "Unable to login student." };
    }
}


// ==========================================
// GETTERS & ROLE CHECKS (Page-Aware Isolation)
// ==========================================

function getCurrentAdmin() {
    return getStoredUser(STORAGE_KEYS.ADMIN);
}

function getCurrentTeacher() {
    return getStoredUser(STORAGE_KEYS.TEACHER);
}

function getCurrentStudent() {
    return getStoredUser(STORAGE_KEYS.STUDENT);
}

function getCurrentUser() {
    const pathname = window.location.pathname.toLowerCase();

    // Isolate user context strictly by current browser tab URL path
    if (pathname.includes("/admin/")) {
        return getCurrentAdmin();
    }
    if (pathname.includes("/teacher/")) {
        return getCurrentTeacher();
    }
    if (pathname.includes("/student/")) {
        return getCurrentStudent();
    }

    // Fallback for root or mixed pages
    return getCurrentAdmin() || getCurrentTeacher() || getCurrentStudent();
}

function isAdmin() {
    const admin = getCurrentAdmin();
    return !!(admin && admin.role === "admin");
}

function isTeacher() {
    const teacher = getCurrentTeacher();
    return !!(teacher && teacher.role === "teacher");
}

function isStudent() {
    const student = getCurrentStudent();
    return !!(student && student.role === "student");
}

function isLoggedIn() {
    return isAdmin() || isTeacher() || isStudent();
}


// ==========================================
// ASYNC AUTH GUARDS (WAIT FOR FIREBASE)
// ==========================================

async function waitForAuthReady() {
    return new Promise((resolve) => {
        if (isAdmin()) {
            resolve("admin");
            return;
        }
        if (isTeacher()) {
            resolve("teacher");
            return;
        }
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (user) {
                try {
                    // Check Admin
                    const adminSnap = await getDoc(doc(kahootDb, "admins", user.uid));
                    if (adminSnap.exists() && adminSnap.data().role === "admin") {
                        const admin = { id: user.uid, email: user.email, ...adminSnap.data(), role: "admin" };
                        localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(admin));
                        resolve("admin");
                        return;
                    }

                    // Check Teacher
                    const teacherSnap = await getDoc(doc(kahootDb, "teachers", user.uid));
                    if (teacherSnap.exists() && teacherSnap.data().role === "teacher") {
                        const teacher = { id: user.uid, email: user.email, ...teacherSnap.data(), role: "teacher" };
                        localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(teacher));
                        resolve("teacher");
                        return;
                    }
                } catch (e) {
                    console.error("Verification check failed:", e);
                }
            }
            resolve(null);
        });
    });
}

async function requireAdmin(redirectUrl = "admin-login.html") {
    const role = await waitForAuthReady();
    if (role !== "admin") {
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

async function requireStudent(redirectUrl = "student-login.html") {
    if (!isStudent()) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}


// ==========================================
// LOGOUT FUNCTIONS
// ==========================================

async function logoutAdmin() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Admin logout error:", error);
    } finally {
        localStorage.removeItem(STORAGE_KEYS.ADMIN);
    }
}

async function logoutTeacher() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Teacher logout error:", error);
    } finally {
        localStorage.removeItem(STORAGE_KEYS.TEACHER);
    }
}

function logoutStudent() {
    localStorage.removeItem(STORAGE_KEYS.STUDENT);
}

async function logoutUser() {
    const pathname = window.location.pathname.toLowerCase();

    if (pathname.includes("/admin/")) {
        await logoutAdmin();
    } else if (pathname.includes("/teacher/")) {
        await logoutTeacher();
    } else if (pathname.includes("/student/")) {
        logoutStudent();
    } else {
        const user = getCurrentUser();
        if (!user) return;
        if (user.role === "admin") {
            await logoutAdmin();
        } else if (user.role === "teacher") {
            await logoutTeacher();
        } else if (user.role === "student") {
            logoutStudent();
        }
    }
}

function clearAllSessions() {
    localStorage.removeItem(STORAGE_KEYS.ADMIN);
    localStorage.removeItem(STORAGE_KEYS.TEACHER);
    localStorage.removeItem(STORAGE_KEYS.STUDENT);
}


// ==========================================
// HELPER UTILITIES
// ==========================================

function getStoredUser(key) {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (error) {
        localStorage.removeItem(key);
        return null;
    }
}

function getAuthErrorMessage(error) {
    switch (error?.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Invalid email or password.";
        case "auth/invalid-email":
            return "Invalid email address.";
        case "auth/user-disabled":
            return "This account has been disabled.";
        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";
        default:
            return error?.message || "Login failed.";
    }
}


// ==========================================
// EXPORT
// ==========================================

export {
    loginAdmin,
    logoutAdmin,
    getCurrentAdmin,
    isAdmin,
    requireAdmin,

    loginTeacher,
    logoutTeacher,
    getCurrentTeacher,
    isTeacher,
    requireTeacher,

    loginStudent,
    logoutStudent,
    getCurrentStudent,
    isStudent,
    requireStudent,

    getCurrentUser,
    isLoggedIn,
    logoutUser,
    clearAllSessions
};

