
// ==========================================
// KAHOOTLIVE
// CLASSHQC QUIZ SYNC MODULE
// ==========================================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import {
    db as kahootDb
} from "./kahoot-firebase-config.js";

const classHqcFirebaseConfig = {
    apiKey: "AIzaSyCiWfRWFR2rDtCP_x8VdU40q2rkAJO4cWQ",
    authDomain: "classhqc.firebaseapp.com",
    projectId: "classhqc",
    storageBucket: "classhqc.firebasestorage.app",
    messagingSenderId: "682597020610",
    appId: "1:682597020610:web:96f56cab32e8eaae999c5b"
};

const existingApps = getApps();
const classHqcApp = existingApps.find(app => app.name === "classhqc-quiz-sync-app") 
    || initializeApp(classHqcFirebaseConfig, "classhqc-quiz-sync-app");

const classHqcDb = getFirestore(classHqcApp);

const CLASSHQC_COLLECTIONS = {
    QUIZ_METADATA: "quiz_metadata",
    QUIZ_QUESTIONS: "quiz_questions"
};

const KAHOOT_COLLECTIONS = {
    QUIZ_METADATA: "quiz_metadata",
    QUIZ_QUESTIONS: "quiz_questions"
};

async function syncQuizFromClassHqc(quizId) {
    if (!quizId) throw new Error("quizId is required.");
    if (!kahootDb) throw new Error("kahootDb is not initialized from kahoot-firebase-config.js.");

    const metadataRef = doc(classHqcDb, CLASSHQC_COLLECTIONS.QUIZ_METADATA, quizId);
    const metadataSnap = await getDoc(metadataRef);
    if (!metadataSnap.exists()) throw new Error(`Quiz metadata not found: ${quizId}`);
    const metadata = metadataSnap.data();

    const questionsRef = doc(classHqcDb, CLASSHQC_COLLECTIONS.QUIZ_QUESTIONS, quizId);
    const questionsSnap = await getDoc(questionsRef);
    if (!questionsSnap.exists()) throw new Error(`Quiz questions not found: ${quizId}`);
    const questions = questionsSnap.data();

    // Resolve human-readable names from reference collections
    let gradeName = metadata.gradeId || "N/A";
    let skillName = metadata.skillId || "N/A";
    let gameName = metadata.gameId || metadata.gameName || metadata.game || "N/A";

    try {
        if (metadata.gradeId) {
            const gradeSnap = await getDoc(doc(classHqcDb, "grades", String(metadata.gradeId).trim()));
            if (gradeSnap.exists()) {
                const gData = gradeSnap.data();
                gradeName = gData.name || gData.gradeName || metadata.gradeId;
            }
        }

        if (metadata.skillId) {
            const skillSnap = await getDoc(doc(classHqcDb, "skills", String(metadata.skillId).trim()));
            if (skillSnap.exists()) {
                const sData = skillSnap.data();
                skillName = sData.name || sData.skillName || metadata.skillId;
            }
        }

        const rawGameKey = String(metadata.gameId || "").trim();
        if (rawGameKey) {
            const gameSnap = await getDoc(doc(classHqcDb, "games", rawGameKey));
            if (gameSnap.exists()) {
                const gData = gameSnap.data();
                gameName = gData.name || gData.title || rawGameKey;
            }
        } else {
            const gameSnap = await getDoc(doc(classHqcDb, "games", quizId));
            if (gameSnap.exists()) {
                const gData = gameSnap.data();
                gameName = gData.name || gData.title || "N/A";
            }
        }
    } catch (e) {
        console.warn("Error resolving reference names during sync:", e);
    }

    // Heuristic fallback if gameName remains N/A or empty
    if (!gameName || gameName === "N/A" || gameName.trim() === "") {
        const skillCheckString = (skillName + " " + (metadata.skillId || "")).toLowerCase();
        if (skillCheckString.includes("vocabulary")) {
            gameName = "Spelling, Kahoot";
        } else if (skillCheckString.includes("grammar")) {
            gameName = "Kahoot";
        }
    }

    const kahootMetadataRef = doc(kahootDb, KAHOOT_COLLECTIONS.QUIZ_METADATA, quizId);
    await setDoc(kahootMetadataRef, {
        ...metadata,
        gradeName: gradeName,
        skillName: skillName,
        gameName: gameName,
        source: "classhqc",
        sourceProjectId: classHqcFirebaseConfig.projectId,
        sourceCollection: CLASSHQC_COLLECTIONS.QUIZ_METADATA,
        sourceQuizId: quizId,
        syncedAt: serverTimestamp()
    }, { merge: true });

    const kahootQuestionsRef = doc(kahootDb, KAHOOT_COLLECTIONS.QUIZ_QUESTIONS, quizId);
    await setDoc(kahootQuestionsRef, {
        ...questions,
        source: "classhqc",
        sourceProjectId: classHqcFirebaseConfig.projectId,
        sourceCollection: CLASSHQC_COLLECTIONS.QUIZ_QUESTIONS,
        sourceQuizId: quizId,
        syncedAt: serverTimestamp()
    }, { merge: true });

    return { success: true, quizId };
}

async function getClassHqcQuizzes() {
    const colRef = collection(classHqcDb, CLASSHQC_COLLECTIONS.QUIZ_METADATA);
    const snapshot = await getDocs(colRef);
    const quizzes = [];
    snapshot.forEach((documentSnapshot) => {
        quizzes.push({
            id: documentSnapshot.id,
            ...documentSnapshot.data()
        });
    });
    return quizzes;
}

async function syncAllClassHqcQuizzes() {
    const quizzes = await getClassHqcQuizzes();
    const results = [];
    for (const quiz of quizzes) {
        try {
            await syncQuizFromClassHqc(quiz.id);
            results.push({ quizId: quiz.id, success: true });
        } catch (error) {
            results.push({ quizId: quiz.id, success: false, error: error.message });
        }
    }
    return {
        success: true,
        total: quizzes.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
    };
}

async function isQuizSynced(quizId) {
    try {
        if (!kahootDb) return false;
        const metadataSnap = await getDoc(doc(kahootDb, KAHOOT_COLLECTIONS.QUIZ_METADATA, quizId));
        return metadataSnap.exists();
    } catch (e) {
        return false;
    }
}

export {
    classHqcApp,
    classHqcDb,
    kahootDb,
    classHqcFirebaseConfig,
    CLASSHQC_COLLECTIONS,
    KAHOOT_COLLECTIONS,
    getClassHqcQuizzes,
    syncQuizFromClassHqc,
    syncAllClassHqcQuizzes,
    isQuizSynced
};
