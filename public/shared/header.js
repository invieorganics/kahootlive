// ==========================================
// KAHOOTLIVE - HEADER (NAME ONLY DISPLAY WITH EMOJI LOGOUT)
// ==========================================
// Self-inserting global header fixed to the 
// absolute top edge, showing only the user's 
// name/username and using an emoji for logout.
// ==========================================

import {
    db as kahootDb,
    doc,
    getDoc
} from "./kahoot-firebase-config.js";

import {
    getCurrentUser,
    logoutUser
} from "./auth.js";


// ==========================================
// SETTINGS
// ==========================================

let headerSettings = {
    logourl: "",
    classname: "KahootLive"
};


// ==========================================
// LOAD SETTINGS
// ==========================================

async function loadHeaderSettings() {
    try {
        const settingsRef = doc(kahootDb, "settings", "class");
        const snapshot = await getDoc(settingsRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            headerSettings = {
                ...headerSettings,
                ...data
            };
        }
    } catch (error) {
        console.error("KahootLive header settings error:", error);
    }
}


// ==========================================
// CREATE HEADER
// ==========================================

async function createHeader() {
    // Prevent duplicate header
    if (document.querySelector("#kahootlive-header")) {
        return;
    }

    await loadHeaderSettings();

    const user = getCurrentUser();
    const header = document.createElement("header");

    header.id = "kahootlive-header";
    header.className = "kh-header";

    const logoHTML = headerSettings.logourl
        ? `
            <img
                src="${escapeHTML(headerSettings.logourl)}"
                class="kh-header-logo"
                alt="Logo"
                onerror="
                    this.style.display='none';
                    this.nextElementSibling.style.display='flex';
                "
            >
            <div class="kh-header-logo-fallback" style="display:none;">
                K
            </div>
        `
        : `
            <div class="kh-header-logo-fallback">
                K
            </div>
        `;

    // Only use username or name, ignoring email entirely
    const displayName = user
        ? (user.username || user.name || "")
        : "";

    header.innerHTML = `
        <div class="kh-header-inner">
            <a href="${getHomePath()}" class="kh-header-brand">
                ${logoHTML}
                <span class="kh-header-classname">
                    ${escapeHTML(headerSettings.classname || "KahootLive")}
                </span>
            </a>

            <div class="kh-header-user">
                ${
                    displayName
                        ? `<span class="kh-header-username">${escapeHTML(displayName)}</span>`
                        : ""
                }
                ${
                    user
                        ? `
                            <button
                                type="button"
                                id="kh-header-logout"
                                class="kh-header-logout"
                                aria-label="Logout"
                                title="Logout">
                                <span class="kh-logout-emoji">🚪</span>
                            </button>
                        `
                        : ""
                }
            </div>
        </div>
    `;

    document.body.prepend(header);
    initializeHeader();
}


// ==========================================
// INITIALIZE HEADER
// ==========================================

function initializeHeader() {
    const logoutButton = document.querySelector("#kh-header-logout");
    if (!logoutButton) return;

    logoutButton.addEventListener("click", async () => {
        const confirmed = window.confirm("Do you want to logout?");
        if (!confirmed) return;

        try {
            await logoutUser();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            window.location.href = getHomePath();
        }
    });
}


// ==========================================
// HOME PATH
// ==========================================

function getHomePath() {
    const path = window.location.pathname;
    if (path.includes("/admin/") || path.includes("/teacher/") || path.includes("/student/")) {
        return "../index.html";
    }
    return "../index.html";
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// CSS (FLUSH TOP LAYOUT FIX)
// ==========================================

function injectHeaderStyles() {
    if (document.querySelector("#kahootlive-header-styles")) return;

    const style = document.createElement("style");
    style.id = "kahootlive-header-styles";
    style.textContent = `
        /* Force root elements to strip default spacing causing the top gap */
        html {
            margin: 0 !important;
            padding: 0 !important;
        }

        body {
            margin: 0 !important;
            padding-top: 58px !important; /* Offset content below sticky header */
        }

        .kh-header {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 58px !important;
            z-index: 9998 !important;
            background: #ffffff !important;
            border-bottom: 1px solid #e5e7eb !important;
            box-shadow: 0 1px 8px rgba(0, 0, 0, .06) !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
        }

        .kh-header-inner {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 12px;
            box-sizing: border-box;
            margin: 0;
        }

        .kh-header-brand {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 9px;
            color: #111827;
            text-decoration: none;
        }

        .kh-header-logo,
        .kh-header-logo-fallback {
            width: 36px;
            height: 36px;
            flex: 0 0 36px;
            border-radius: 9px;
            object-fit: cover;
        }

        .kh-header-logo-fallback {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #4f46e5;
            color: #ffffff;
            font-size: 19px;
            font-weight: 700;
        }

        .kh-header-classname {
            max-width: 180px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family: Roboto, Arial, sans-serif;
            font-size: 16px;
            font-weight: 600;
        }

        .kh-header-user {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
        }

        .kh-header-username {
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family: Roboto, Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
        }

        .kh-header-logout {
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border: 0;
            border-radius: 10px;
            background: transparent;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
        }

        .kh-logout-emoji {
            font-size: 20px;
            line-height: 1;
        }

        .kh-header-logout:active {
            background: #f3f4f6;
            transform: scale(.94);
        }

        @media (min-width: 768px) {
            .kh-header-inner {
                padding: 0 20px;
            }
            .kh-header-classname {
                max-width: 400px;
            }
        }
    `;

    document.head.appendChild(style);
}


// ==========================================
// AUTO INITIALIZE
// ==========================================

async function initHeader() {
    injectHeaderStyles();
    await createHeader();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeader, { once: true });
} else {
    initHeader();
}


// ==========================================
// EXPORT
// ==========================================

export {
    createHeader,
    initializeHeader,
    loadHeaderSettings
};