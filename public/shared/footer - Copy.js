
// ==========================================
// KAHOOTLIVE - MOBILE FOOTER
// ==========================================
// Role-aware
// Self-inserting
// Mobile / Redmi style with clean Emoji Icons
// ==========================================

import {
    getCurrentUser,
    logoutUser
} from "./auth.js";


// ==========================================
// ROLE NAVIGATION (EMOJI ICONS)
// ==========================================

const NAVIGATION = {

    student: [
        {
            label: "Home",
            icon: "🏠",
            path: "../student/student-kahoot-lobby.html"
        },
        {
            label: "Re-Join",
            icon: "▶️",
            path: "../student/student-login.html"
        },
        {
            label: "Result",
            icon: "🏆",
            path: "../student/student-leaderboard.html"
        },
        {
            label: "Lobby",
            icon: "⏳",
            path: "../student/student-kahoot-lobby.html"
        }
    ],

    teacher: [
        {
            label: "Dashboard",
            icon: "📊",
            path: "../teacher/teacher-dashboard.html"
        },
        {
            label: "Quiz",
            icon: "❓",
            path: "../teacher/quizdata.html"
        },
        {
            label: "Games Session",
            icon: "🎮",
            path: "../teacher/game-session.html"
        },
        {
            label: "Settings",
            icon: "⚙️",
            path: "../teacher/class-settings.html"
        }
    ],

    admin: [
        {
            label: "Dashboard",
            icon: "📊",
            path: "../admin/dashboard.html"
        },
        {
            label: "Teachers",
            icon: "👨‍🏫",
            path: "../admin/teachers.html"
        },
        {
            label: "Students",
            icon: "👨‍🎓",
            path: "../admin/students.html"
        },
        {
            label: "Account",
            icon: "👤",
            path: "../admin/account.html"
        }
    ]

};


// ==========================================
// GET USER ROLE
// ==========================================

function getUserRole() {
    const user = getCurrentUser();

    if (!user) {
        return "student";
    }

    if (user.role === "admin") {
        return "admin";
    }

    if (user.role === "teacher") {
        return "teacher";
    }

    return "student";
}


// ==========================================
// CREATE FOOTER
// ==========================================

function createFooter() {
    if (document.querySelector("#kahootlive-mobile-footer")) {
        return;
    }

    const role = getUserRole();
    const navigation = NAVIGATION[role];

    const footer = document.createElement("nav");
    footer.id = "kahootlive-mobile-footer";
    footer.className = "kh-mobile-footer";
    footer.setAttribute("aria-label", "Mobile navigation");

    footer.innerHTML = navigation.map((item, index) => {
        return `
            <a
                href="${item.path}"
                class="kh-nav-item"
                data-nav-index="${index}">
                <span class="kh-nav-icon">
                    ${item.icon}
                </span>
                <span class="kh-nav-label">
                    ${item.label}
                </span>
            </a>
        `;
    }).join("");

    document.body.appendChild(footer);
    initializeFooter();
}


// ==========================================
// INITIALIZE
// ==========================================

function initializeFooter() {
    setActivePage();
}


// ==========================================
// ACTIVE PAGE
// ==========================================

function setActivePage() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll(
        "#kahootlive-mobile-footer a.kh-nav-item"
    );

    links.forEach(link => {
        const href = link.getAttribute("href");
        if (!href) return;

        const linkPath = new URL(href, window.location.href).pathname;

        if (linkPath === currentPath) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}


// ==========================================
// CSS
// ==========================================

function injectFooterStyles() {
    if (document.querySelector("#kahootlive-footer-styles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "kahootlive-footer-styles";
    style.textContent = `
        .kh-mobile-footer {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
            height: 64px;
            display: flex;
            align-items: stretch;
            justify-content: space-around;
            background: #ffffff;
            border-top: 1px solid #e5e7eb;
            box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
            padding: 4px 6px env(safe-area-inset-bottom);
        }

        .kh-nav-item {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            border: 0;
            background: transparent;
            color: #6b7280;
            text-decoration: none;
            font-family: Roboto, Arial, sans-serif;
            -webkit-tap-highlight-color: transparent;
            cursor: pointer;
            transition: color .15s ease, transform .1s ease;
        }

        .kh-nav-icon {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            line-height: 1;
        }

        .kh-nav-label {
            font-size: 11px;
            font-weight: 500;
            line-height: 1;
            white-space: nowrap;
        }

        .kh-nav-item.active {
            color: #4f46e5;
        }

        .kh-nav-item:active {
            transform: scale(.94);
        }

        body {
            padding-bottom: calc(70px + env(safe-area-inset-bottom));
        }

        @media (min-width: 768px) {
            .kh-mobile-footer {
                display: none;
            }
            body {
                padding-bottom: 0;
            }
        }
    `;

    document.head.appendChild(style);
}


// ==========================================
// AUTO INITIALIZE
// ==========================================

function initFooter() {
    injectFooterStyles();
    createFooter();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFooter, { once: true });
} else {
    initFooter();
}


// ==========================================
// EXPORT
// ==========================================

export {
    createFooter,
    initializeFooter,
    setActivePage
};
