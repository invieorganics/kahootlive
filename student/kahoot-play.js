// 🔥 BULLETPROOF SECURE STUDENT PLAY SCRIPT STARTING...

try {
    const appCore = await import("../shared/app-core.js");
    const { initAppCore, db, doc, getDoc, collection, addDoc, query, where, getDocs, onSnapshot, setDoc, updateDoc } = appCore;

    let routerModule = null;
    try {
        routerModule = await import("./student-router.js");
    } catch (err) {
        console.warn("⚠️ Optional student-router.js not loaded:", err);
    }

    const initStudentGameListener = routerModule?.initStudentGameListener || routerModule?.default;

    const coreResult = initAppCore();
    if (coreResult instanceof Promise) {
        await coreResult;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const pin = urlParams.get("pin");
    let gradenameParam = urlParams.get("gradename");
    
    let localSession = JSON.parse(localStorage.getItem("kahootlive_student") || "{}");

    if (!gradenameParam && localSession.gradename) {
        gradenameParam = localSession.gradename;
    }

    // 🔍 FIX: Robust multi-fallback parsing for student name/nickname so it doesn't show Guest
    const nickname = urlParams.get("name") || urlParams.get("nickname") || urlParams.get("studentName") || localSession.name || localSession.username || localSession.nickname || "Student";
    const studentId = urlParams.get("id") || localSession.studentId || localSession.id || "";

    // Sync session data back into localStorage so app-core and other pages register it properly
    localSession.name = nickname;
    localSession.studentId = studentId;
    localStorage.setItem("kahootlive_student", JSON.stringify(localSession));

    // --- STRICT AUTHENTICATION GUARD ---
    if (!studentId || studentId === "STU-00000") {
        console.warn("⚠️ Unauthenticated student detected. Redirecting to join screen...");
        localStorage.removeItem("kahootlive_student");
        window.location.href = "student-join.html";
        throw new Error("Unauthenticated user. Redirecting to login.");
    }

    const studentAvatar = localSession.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(studentId)}`;

    document.getElementById("student-name-display").textContent = nickname;
    document.getElementById("student-id-display").textContent = `ID: ${studentId}`;
    document.getElementById("student-avatar-img").src = studentAvatar;

    if (!pin) {
        alert("Missing session PIN!");
        window.location.href = "student-join.html";
        throw new Error("Missing PIN.");
    }

    document.getElementById("display-pin").textContent = `PIN: ${pin}`;
    if (gradenameParam) {
        document.getElementById("display-gradename").textContent = decodeURIComponent(gradenameParam);
    } else {
        document.getElementById("display-gradename").style.display = "none";
    }

    // Clear previous question answers on fresh load/refresh so students don't get stuck locked out
    const storageKey = `kahoot_answers_${pin}_${studentId}`;
    const scoreStorageKey = `kahoot_scores_${pin}_${studentId}`;
    localStorage.removeItem(storageKey);

    const sessionRef = doc(db, "game_sessions", pin);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
        alert("Game session does not exist or has ended.");
        window.location.href = "student-join.html";
        throw new Error("Session does not exist.");
    }

    const sessionData = sessionSnap.data();

    if (sessionData.currentQuestionIndex === 0) {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(scoreStorageKey);
    }

    let answeredMap = {};
    let scoreMap = JSON.parse(localStorage.getItem(scoreStorageKey) || "{}");

    if (sessionData.title || sessionData.name) {
        document.getElementById("display-quiz-name").textContent = sessionData.title || sessionData.name;
    }

    let questions = Array.isArray(sessionData.questions) ? sessionData.questions : [];

    let lastProcessedIndex = -1;
    let answeredCurrentQuestion = false;
    let currentCorrectText = "";
    let selectedOptionText = null;
    let liveTimeLeft = 30; 
    let activeQuestionDuration = 30; 
    let clientTimerInterval = null;

    const questionCounterEl = document.getElementById("question-counter-label");
    const questionTextEl = document.getElementById("question-text-el");
    const studentImageContainer = document.getElementById("student-image-container");
    const studentQuestionImg = document.getElementById("student-question-img");
    const optionsContainer = document.getElementById("options-container");
    const timerFill = document.getElementById("timer-fill");
    const timerCountdown = document.getElementById("timer-countdown");
    const timerStatusLabel = document.getElementById("timer-status-label");
    const pauseStatusBanner = document.getElementById("pause-status-banner");
    const displayGameMode = document.getElementById("display-gamemode");
    const feedbackBanner = document.getElementById("feedback-banner");
    
    const scoreDisplayCard = document.getElementById("score-display-card");
    const scoreMainStatus = document.getElementById("score-main-status");
    const valBase = document.getElementById("val-base");
    const valFast = document.getElementById("val-fast");
    const valTotal = document.getElementById("val-total");

    if (scoreDisplayCard) {
        scoreDisplayCard.style.display = "flex";
    }

    if (typeof initStudentGameListener === "function") {
        initStudentGameListener(pin);
    }

    function getPastCumulativeScore() {
        let sum = 0;
        scoreMap = JSON.parse(localStorage.getItem(scoreStorageKey) || "{}");
        
        for (let key in scoreMap) {
            if (Number(key) !== Number(lastProcessedIndex)) {
                if (scoreMap[key] && typeof scoreMap[key].total === "number") {
                    sum += scoreMap[key].total;
                }
            }
        }
        return sum;
    }

    onSnapshot(sessionRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();

        if (Array.isArray(data.questions) && data.questions.length > 0) {
            questions = data.questions;
        }

        if (data.gameMode) {
            displayGameMode.textContent = `Mode: ${data.gameMode}`;
            if (data.gameMode === "leaderboard") {
                window.location.href = `student-kahoot-leaderboard.html?pin=${encodeURIComponent(pin)}&nickname=${encodeURIComponent(nickname)}&id=${encodeURIComponent(studentId)}`;
                return;
            }
        }

        const isPaused = Boolean(data.timerpauce);
        const activeIndex = typeof data.currentQuestionIndex === "number" ? data.currentQuestionIndex : 0;
        
        if (activeIndex === 0 && lastProcessedIndex > 0) {
            localStorage.removeItem(storageKey);
            localStorage.removeItem(scoreStorageKey);
            answeredMap = {};
            scoreMap = {};
        }

        const currentQ = questions[activeIndex] || {};
        activeQuestionDuration = Number(data.timePerQuestion || currentQ.time || currentQ.duration || 20);

        if (isPaused) {
            pauseStatusBanner.textContent = "⏸️ Timer Paused by Host";
            pauseStatusBanner.classList.add("paused");
            timerStatusLabel.textContent = "Timer Paused";
            if (clientTimerInterval) clearInterval(clientTimerInterval);

            liveTimeLeft = typeof data.timeLeft === "number" ? data.timeLeft : activeQuestionDuration;
            updateTimerDisplay(liveTimeLeft, activeQuestionDuration);
        } else {
            pauseStatusBanner.textContent = "🟢 Game Live";
            pauseStatusBanner.classList.remove("paused");
            timerStatusLabel.textContent = "Time Remaining";
            
            if (typeof data.questionStartedAt === "number") {
                startClientSyncTimer(data.questionStartedAt, activeQuestionDuration);
            } else if (typeof data.timeLeft === "number") {
                liveTimeLeft = data.timeLeft;
                updateTimerDisplay(liveTimeLeft, activeQuestionDuration);
            }
        }

        const serverIndex = activeIndex;
        if (serverIndex !== lastProcessedIndex && questions[serverIndex]) {
            lastProcessedIndex = serverIndex;
            processQuestionTransition(serverIndex, questions[serverIndex], questions.length);
        }
    });

    function updateTimerDisplay(currentSecs, duration) {
        timerCountdown.textContent = `${currentSecs}s`;
        const percentage = Math.max(0, Math.min(100, (currentSecs / duration) * 100));
        timerFill.style.width = `${percentage}%`;

        if (percentage <= 30 || currentSecs <= 3) {
            timerFill.style.backgroundColor = "#ef4444"; 
        } else if (percentage <= 60) {
            timerFill.style.backgroundColor = "#eab308"; 
        } else {
            timerFill.style.backgroundColor = "#22c55e"; 
        }
    }

    function startClientSyncTimer(startedAt, duration) {
        if (clientTimerInterval) clearInterval(clientTimerInterval);

        const tick = () => {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - startedAt) / 1000);
            liveTimeLeft = Math.max(0, duration - elapsedSeconds);

            updateTimerDisplay(liveTimeLeft, duration);

            if (liveTimeLeft <= 0) {
                clearInterval(clientTimerInterval);
                revealFinalResult();
            }
        };

        tick(); 
        clientTimerInterval = setInterval(tick, 1000);
    }

    function updateScoreDisplayValues(baseVal, fastVal, roundTotalVal, isCorrectState, isRevealed) {
        if (scoreDisplayCard) scoreDisplayCard.style.display = "flex";
        
        scoreMap = JSON.parse(localStorage.getItem(scoreStorageKey) || "{}");
        const pastTotal = getPastCumulativeScore();
        const fullTotal = pastTotal + roundTotalVal;

        if (!isRevealed) {
            valBase.textContent = "0 pts";
            valFast.textContent = "0 pts";
            valTotal.textContent = `${pastTotal} pts`;
            scoreMainStatus.textContent = answeredCurrentQuestion ? "🔒 Answer Locked (Waiting for timer)" : "Make your choice!";
        } else {
            valBase.textContent = `${baseVal} pts`;
            valFast.textContent = `${fastVal} pts`;
            valTotal.textContent = `${fullTotal} pts`;
            scoreMainStatus.textContent = isCorrectState ? "🎉 Correct Answer!" : "❌ Incorrect Answer";
        }
    }

    async function processQuestionTransition(index, q, totalLength) {
        lastProcessedIndex = index;
        answeredCurrentQuestion = false;
        selectedOptionText = null;
        
        updateScoreDisplayValues(0, 0, 0, false, false);
        renderActiveQuestion(q, index, totalLength, true);

        try {
            // Check nested subcollection instead of querying a flat root collection
            const answerDocRef = doc(db, "game_sessions", pin, "scores", studentId, "answers", String(index));
            const answerSnap = await getDoc(answerDocRef);
            
            if (answerSnap.exists()) {
                answeredCurrentQuestion = true;
                const existingAnsData = answerSnap.data();
                selectedOptionText = existingAnsData.answer;

                let totalScore = existingAnsData.totalScore || existingAnsData.score || 0;
                let isCorrect = existingAnsData.isCorrect;
                let baseVal = isCorrect ? 1000 : 0;
                let fastVal = existingAnsData.fastScore !== undefined ? existingAnsData.fastScore : Math.max(0, totalScore - baseVal);

                const scoreObj = { base: baseVal, fast: fastVal, total: totalScore, isCorrect: isCorrect };
                scoreMap[index] = scoreObj;
                localStorage.setItem(scoreStorageKey, JSON.stringify(scoreMap));

                if (liveTimeLeft <= 0) {
                    updateScoreDisplayValues(baseVal, fastVal, totalScore, isCorrect, true);
                }
            } else {
                answeredCurrentQuestion = false;
            }
        } catch (err) {
            console.error("❌ Error checking database submission document:", err);
            answeredCurrentQuestion = false;
        }

        renderActiveQuestion(q, index, totalLength, false);
    }

    function renderActiveQuestion(q, index, totalLength, isChecking) {
        if (isChecking) {
            feedbackBanner.className = "waiting";
            feedbackBanner.textContent = "⏳ Verifying submission status...";
        } else {
            feedbackBanner.className = answeredCurrentQuestion ? "locked" : "waiting";
            feedbackBanner.textContent = answeredCurrentQuestion ? "🔒 Answer Already Locked! Waiting for timer..." : "Tap an answer below!";
        }
        
        questionCounterEl.textContent = `Question ${index + 1} of ${totalLength}`;
        questionTextEl.textContent = q.question || q.text || q.prompt || "Question";

        const rawImgUrl = String(q.image_url || q.image || q.imageUrl || "").trim();
        if (rawImgUrl && rawImgUrl !== "https://cdn.example.com/image.jpg") {
            studentQuestionImg.src = rawImgUrl;
            studentImageContainer.classList.add("has-image");
        } else {
            studentQuestionImg.src = "";
            studentImageContainer.classList.remove("has-image");
        }

        currentCorrectText = String(q.correct_text ?? q.correctAnswer ?? q.answer ?? q.correct ?? "").trim();

        let optionsPool = [
            q.option_a,
            q.option_b,
            q.option_c,
            q.option_d,
            ...(Array.isArray(q.options) ? q.options : []),
            ...(Array.isArray(q.choices) ? q.choices : [])
        ].filter(opt => opt !== undefined && opt !== null && String(opt).trim() !== "");

        optionsPool = Array.from(new Set(optionsPool.map(o => String(o).trim()).filter(o => o !== "")));

        if (currentCorrectText && !optionsPool.some(o => o.toLowerCase() === currentCorrectText.toLowerCase())) {
            optionsPool.push(currentCorrectText);
        }

        while (optionsPool.length < 4) {
            optionsPool.push(`Option ${optionsPool.length + 1}`);
        }
        if (optionsPool.length > 4) {
            optionsPool = optionsPool.slice(0, 4);
        }

        const prefixLetters = ["A. ", "B. ", "C. ", "D. "];
        optionsContainer.innerHTML = "";

        optionsPool.forEach((opt, idx) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "option-btn";
            btn.textContent = `${prefixLetters[idx] || ""}${opt}`;
            btn.dataset.optionText = opt;

            if (opt.toLowerCase() === currentCorrectText.toLowerCase()) {
                btn.dataset.isCorrect = "true";
            }

            if (isChecking || answeredCurrentQuestion) {
                btn.disabled = true;
                if (selectedOptionText && opt.toLowerCase() === selectedOptionText.toLowerCase()) {
                    btn.classList.add("locked");
                } else {
                    btn.classList.add("dimmed");
                }
            } else {
                btn.addEventListener("click", () => handleAnswerSubmission(btn, opt, optionsContainer));
            }

            optionsContainer.appendChild(btn);
        });
    }

    async function handleAnswerSubmission(selectedBtn, chosenOption, container) {
        if (answeredCurrentQuestion) return;
        answeredCurrentQuestion = true;
        selectedOptionText = chosenOption;

        const allBtns = container.querySelectorAll(".option-btn");
        allBtns.forEach(b => {
            b.disabled = true;
            if (b === selectedBtn) {
                b.classList.add("locked");
            } else {
                b.classList.add("dimmed");
            }
        });

        feedbackBanner.className = "locked";
        feedbackBanner.textContent = "🔒 Answer Locked! Waiting for timer...";

        const currentQ = questions[lastProcessedIndex] || {};
        const correctVal = String(currentQ.correct_text ?? currentQ.correctAnswer ?? currentQ.answer ?? currentQ.correct ?? "").trim();
        const isCorrect = chosenOption.toLowerCase() === correctVal.toLowerCase();

        let baseScore = isCorrect ? 1000 : 0;
        let bonusScore = 0;
        let earnedScore = 0;

        if (isCorrect) {
            const safeTimeLeft = Math.max(0, Math.min(liveTimeLeft, activeQuestionDuration));
            bonusScore = safeTimeLeft * 100; 
            earnedScore = baseScore + bonusScore;
        }

        scoreMap[lastProcessedIndex] = { base: baseScore, fast: bonusScore, total: earnedScore, isCorrect: isCorrect };
        localStorage.setItem(scoreStorageKey, JSON.stringify(scoreMap));

        updateScoreDisplayValues(baseScore, bonusScore, earnedScore, isCorrect, false);

        try {
            console.log("Attempting to write answer into student's nested subcollection...");
            // Writes directly to: game_sessions/{pin}/scores/{studentId}/answers/{questionIndex}
            const studentAnswerDocRef = doc(db, "game_sessions", pin, "scores", studentId, "answers", String(lastProcessedIndex));
            
            await setDoc(studentAnswerDocRef, {
                studentId: studentId,
                nickname: nickname,
                questionIndex: lastProcessedIndex,
                answer: chosenOption,
                isCorrect: isCorrect,
                baseScore: baseScore,
                fastScore: bonusScore,
                totalScore: earnedScore,
                timestamp: new Date().toISOString()
            }, { merge: true });

            console.log("Attempting to write cumulative score to game_sessions scores subcollection...");
            const studentScoreDocRef = doc(db, "game_sessions", pin, "scores", studentId);
            const studentScoreSnap = await getDoc(studentScoreDocRef);
            
            let currentTotalBase = 0;
            let currentTotalFast = 0;
            let currentTotalScore = 0;

            if (studentScoreSnap.exists()) {
                const data = studentScoreSnap.data();
                currentTotalBase = Number(data.base || 0);
                currentTotalFast = Number(data.fast || 0);
                currentTotalScore = Number(data.total || 0);
            }

            await setDoc(studentScoreDocRef, {
                studentId: studentId,
                nickname: nickname,
                base: currentTotalBase + baseScore,
                fast: currentTotalFast + bonusScore,
                total: currentTotalScore + earnedScore
            }, { merge: true });

            console.log(`✅ Successfully saved points and structured answers for studentId: ${studentId}`);

        } catch (err) {
            console.error("❌ Firebase Write Failed! Check your Firestore Security Rules:", err.message, err);
            alert("Database Error: " + err.message);
        }
    }

    function revealFinalResult() {
        if (clientTimerInterval) clearInterval(clientTimerInterval);

        const sData = scoreMap[lastProcessedIndex] || { base: 0, fast: 0, total: 0, isCorrect: false };
        updateScoreDisplayValues(sData.base, sData.fast, sData.total, sData.isCorrect, true);

        const allBtns = optionsContainer.querySelectorAll(".option-btn");
        const isCorrect = selectedOptionText && selectedOptionText.toLowerCase() === currentCorrectText.toLowerCase();

        allBtns.forEach(b => {
            const isThisCorrect = b.dataset.isCorrect === "true";
            b.classList.remove("locked", "dimmed");

            if (isThisCorrect) {
                b.classList.add("correct-highlight");
            } else if (selectedOptionText && b.dataset.optionText.toLowerCase() === selectedOptionText.toLowerCase()) {
                b.classList.add("wrong-highlight");
            } else {
                b.classList.add("dimmed");
            }
        });

        if (!selectedOptionText) {
            feedbackBanner.className = "wrong";
            feedbackBanner.textContent = `⏰ Time's up! You didn't answer (Correct was: ${currentCorrectText})`;
        } else if (isCorrect) {
            feedbackBanner.className = "correct";
            feedbackBanner.textContent = "🎉 Correct Answer!";
        } else {
            feedbackBanner.className = "wrong";
            feedbackBanner.textContent = `❌ Incorrect (Correct was: ${currentCorrectText})`;
        }
    }

} catch (e) {
    console.error("FATAL STUDENT PLAY SCRIPT ERROR:", e.message, e);
}

