// ==========================================
// KAHOOTLIVE - GLOBAL LOADER
// ==========================================
// Self-inserting page/app loader
// Works on Student / Teacher / Admin sides
// ==========================================


// ==========================================
// LOADER ID
// ==========================================

const LOADER_ID = "kahootlive-loader";


// ==========================================
// CREATE LOADER
// ==========================================

function createLoader() {

    if (document.getElementById(LOADER_ID)) {
        return;
    }

    const loader = document.createElement("div");

    loader.id = LOADER_ID;

    loader.className = "kh-loader";

    loader.innerHTML = `
        <div class="kh-loader-content">

            <div class="kh-loader-spinner">
                <span></span>
                <span></span>
                <span></span>
            </div>

            <div
                id="kh-loader-text"
                class="kh-loader-text">
                Loading...
            </div>

        </div>
    `;

    document.body.appendChild(loader);
}


// ==========================================
// SHOW LOADER
// ==========================================

function showLoader(message = "Loading...") {

    createLoader();

    const loader =
        document.getElementById(LOADER_ID);

    const text =
        document.getElementById("kh-loader-text");


    if (text) {
        text.textContent = message;
    }


    if (loader) {

        loader.classList.remove(
            "kh-loader-hidden"
        );

        loader.classList.add(
            "kh-loader-visible"
        );

        document.body.classList.add(
            "kh-loading-active"
        );
    }
}


// ==========================================
// HIDE LOADER
// ==========================================

function hideLoader() {

    const loader =
        document.getElementById(LOADER_ID);


    if (!loader) {
        return;
    }


    loader.classList.remove(
        "kh-loader-visible"
    );

    loader.classList.add(
        "kh-loader-hidden"
    );


    document.body.classList.remove(
        "kh-loading-active"
    );


    // Remove after animation
    setTimeout(() => {

        if (
            loader &&
            loader.parentNode
        ) {

            loader.parentNode.removeChild(
                loader
            );
        }

    }, 250);
}


// ==========================================
// CHANGE LOADING MESSAGE
// ==========================================

function setLoaderMessage(message) {

    const text =
        document.getElementById(
            "kh-loader-text"
        );

    if (text) {
        text.textContent =
            message || "Loading...";
    }
}


// ==========================================
// CSS
// ==========================================

function injectLoaderStyles() {

    if (
        document.getElementById(
            "kahootlive-loader-styles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "kahootlive-loader-styles";


    style.textContent = `

        /* ==================================
           LOADER
           ================================== */

        .kh-loader {

            position: fixed;

            inset: 0;

            z-index: 99999;

            display: flex;

            align-items: center;

            justify-content: center;

            background:
                rgba(255, 255, 255, 0.98);

            opacity: 0;

            visibility: hidden;

            pointer-events: none;

            transition:
                opacity .2s ease,
                visibility .2s ease;

        }


        .kh-loader-visible {

            opacity: 1;

            visibility: visible;

            pointer-events: all;

        }


        .kh-loader-hidden {

            opacity: 0;

            visibility: hidden;

            pointer-events: none;

        }


        /* ==================================
           CONTENT
           ================================== */

        .kh-loader-content {

            display: flex;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            gap: 14px;

            font-family:
                Roboto,
                Arial,
                sans-serif;

        }


        /* ==================================
           SPINNER
           ================================== */

        .kh-loader-spinner {

            width: 42px;

            height: 42px;

            display: flex;

            align-items: center;

            justify-content: center;

            gap: 5px;

        }


        .kh-loader-spinner span {

            width: 7px;

            height: 7px;

            border-radius: 50%;

            background: #4f46e5;

            animation:
                kh-loader-bounce
                1.2s infinite ease-in-out;

        }


        .kh-loader-spinner span:nth-child(1) {

            animation-delay:
                -0.24s;

        }


        .kh-loader-spinner span:nth-child(2) {

            animation-delay:
                -0.12s;

        }


        .kh-loader-spinner span:nth-child(3) {

            animation-delay:
                0s;

        }


        @keyframes kh-loader-bounce {

            0%,
            80%,
            100% {

                transform:
                    scale(.65);

                opacity: .45;

            }

            40% {

                transform:
                    scale(1);

                opacity: 1;

            }

        }


        /* ==================================
           TEXT
           ================================== */

        .kh-loader-text {

            font-size: 14px;

            font-weight: 500;

            color: #4b5563;

            text-align: center;

        }


        /* ==================================
           PREVENT SCROLL WHILE LOADING
           ================================== */

        body.kh-loading-active {

            overflow: hidden;

        }

    `;


    document.head.appendChild(
        style
    );
}


// ==========================================
// INITIALIZE
// ==========================================

function initLoader() {

    injectLoaderStyles();

    createLoader();

    showLoader("Loading...");
}


// ==========================================
// AUTO START
// ==========================================

if (document.readyState === "loading") {

    // Create as soon as possible
    document.addEventListener(
        "DOMContentLoaded",
        initLoader,
        { once: true }
    );

} else {

    initLoader();
}


// ==========================================
// AUTO HIDE AFTER PAGE LOAD
// ==========================================

window.addEventListener(
    "load",
    () => {

        setTimeout(
            () => {
                hideLoader();
            },
            150
        );

    },
    { once: true }
);


// ==========================================
// EXPORT
// ==========================================

export {

    createLoader,
    showLoader,
    hideLoader,
    setLoaderMessage

};