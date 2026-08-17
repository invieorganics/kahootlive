// ==========================================
// KAHOOTLIVE - AUTH GUARD
// ==========================================
// Protects Admin / Teacher / Student pages.
//
// Login pages:
//   admin-login.html
//   teacher-login.html
//   student-login.html
//
// Authentication:
//   Admin   → Firebase Auth + admins/{uid}
//   Teacher → Custom Firestore session
//   Student → Custom Firestore session
//
// IMPORTANT:
// This protects the application UI only.
// It is NOT Firestore security.
// ==========================================

import {
    getCurrentUser,
    isAdmin,
    isTeacher,
    isStudent
} from "./auth.js";


// ==========================================
// LOGIN PAGE NAMES
// ==========================================

const LOGIN_PAGES = {

    admin: "admin-login.html",

    teacher: "teacher-login.html",

    student: "student-login.html"

};


// ==========================================
// DETERMINE CURRENT ROLE AREA
// ==========================================

function getCurrentArea() {

    const pathname =
        window.location.pathname.toLowerCase();


    // --------------------------------------
    // ADMIN AREA
    // --------------------------------------

    if (
        pathname.includes("/admin/")
    ) {

        return "admin";

    }


    // --------------------------------------
    // TEACHER AREA
    // --------------------------------------

    if (
        pathname.includes("/teacher/")
    ) {

        return "teacher";

    }


    // --------------------------------------
    // STUDENT AREA
    // --------------------------------------

    if (
        pathname.includes("/student/")
    ) {

        return "student";

    }


    return null;
}


// ==========================================
// CALCULATE ROOT PATH
// ==========================================

function getRootPrefix() {

    const pathname =
        window.location.pathname;


    const segments =
        pathname
            .split("/")
            .filter(Boolean);


    // Remove current file
    if (
        segments.length > 0 &&
        segments[segments.length - 1]
            .includes(".")
    ) {

        segments.pop();

    }


    if (segments.length === 0) {

        return "";

    }


    return "../".repeat(
        segments.length
    );
}


// ==========================================
// GET LOGIN URL
// ==========================================

function getLoginUrl(role) {

    if (!role) {

        return null;

    }


    const rootPrefix =
        getRootPrefix();


    return (
        rootPrefix +
        LOGIN_PAGES[role]
    );
}


// ==========================================
// CHECK AUTHORIZATION
// ==========================================

function checkAuth() {

    const area =
        getCurrentArea();


    // --------------------------------------
    // Not inside a protected area
    // --------------------------------------

    if (!area) {

        return true;

    }


    // --------------------------------------
    // ADMIN
    // --------------------------------------

    if (area === "admin") {

        if (!isAdmin()) {

            redirectToLogin("admin");

            return false;

        }

        return true;

    }


    // --------------------------------------
    // TEACHER
    // --------------------------------------

    if (area === "teacher") {

        if (!isTeacher()) {

            redirectToLogin("teacher");

            return false;

        }

        return true;

    }


    // --------------------------------------
    // STUDENT
    // --------------------------------------

    if (area === "student") {

        if (!isStudent()) {

            redirectToLogin("student");

            return false;

        }

        return true;

    }


    return false;
}


// ==========================================
// REDIRECT TO LOGIN
// ==========================================

function redirectToLogin(role) {

    const loginUrl =
        getLoginUrl(role);


    if (!loginUrl) {

        return;

    }


    const currentPath =
        window.location.pathname;


    // --------------------------------------
    // Avoid redirect loop
    // --------------------------------------

    if (
        currentPath.endsWith(
            LOGIN_PAGES[role]
        )
    ) {

        return;

    }


    // --------------------------------------
    // Replace instead of href
    // --------------------------------------
    // Prevents protected page remaining
    // in browser history.
    // --------------------------------------

    window.location.replace(
        loginUrl
    );
}


// ==========================================
// GET LOGGED-IN USER
// ==========================================

function requireUser() {

    const user =
        getCurrentUser();


    if (!user) {

        const area =
            getCurrentArea();


        if (area) {

            redirectToLogin(area);

        }


        return null;

    }


    return user;
}


// ==========================================
// ROLE-SPECIFIC GUARDS
// ==========================================

function requireAdmin() {

    if (!isAdmin()) {

        redirectToLogin("admin");

        return false;

    }

    return true;
}


function requireTeacher() {

    if (!isTeacher()) {

        redirectToLogin("teacher");

        return false;

    }

    return true;
}


function requireStudent() {

    if (!isStudent()) {

        redirectToLogin("student");

        return false;

    }

    return true;
}


// ==========================================
// AUTO CHECK
// ==========================================

checkAuth();


// ==========================================
// EXPORT
// ==========================================

export {

    checkAuth,

    requireUser,

    requireAdmin,

    requireTeacher,

    requireStudent,

    getCurrentArea,

    getLoginUrl

};
