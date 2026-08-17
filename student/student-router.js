import { db, doc, onSnapshot } from "../shared/app-core.js";

/**
 * Initializes real-time game mode tracking for students.
 * @param {string} sessionPin - The current game PIN/session ID the student joined.
 */
function initStudentGameListener(sessionPin) {
    if (!sessionPin) {
        console.error("No session PIN provided for game listener.");
        return;
    }

    const sessionRef = doc(db, "game_sessions", sessionPin);

    // Listen in real-time for changes made by the teacher
    onSnapshot(sessionRef, (docSnap) => {
        if (!docSnap.exists()) {
            console.warn("This game session no longer exists.");
            return;
        }

        const data = docSnap.data();
        const gameMode = data.gameMode; // 'lobby', 'playing', or 'leaderboard'

        // Determine current page type based on filename
        const currentPath = window.location.pathname;

        if (gameMode === "lobby" && !currentPath.includes("student-kahoot-lobby.html")) {
            window.location.href = `student-kahoot-lobby.html?pin=${encodeURIComponent(sessionPin)}`;
        } else if (gameMode === "playing" && !currentPath.includes("student-kahoot-playing.html")) {
            window.location.href = `student-kahoot-playing.html?pin=${encodeURIComponent(sessionPin)}`;
        } else if (gameMode === "leaderboard" && !currentPath.includes("student-kahoot-leaderboard.html")) {
            window.location.href = `student-kahoot-leaderboard.html?pin=${encodeURIComponent(sessionPin)}`;
        }
    }, (error) => {
        console.error("Error listening to game session changes:", error);
    });
}

// Example usage on any of the 3 student pages:
// Make sure to pass the active session PIN retrieved from URL parameters or storage
const urlParams = new URLSearchParams(window.location.search);
const activePin = urlParams.get("pin") || localStorage.getItem("kahoot_active_pin");

if (activePin) {
    initStudentGameListener(activePin);
}
