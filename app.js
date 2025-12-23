
const screenStart = document.getElementById("screen-start");
const screenQuiz = document.getElementById("screen-quiz");
const screenResult = document.getElementById("screen-result");
const btnStart = document.getElementById("btn-start");
const btnTraining = document.getElementById("btn-training");
const btnRetry = document.getElementById("btn-retry");
const btnSkip = document.getElementById("btn-skip");
const btnHomeQuiz = document.getElementById("btn-home-quiz");
const btnHomeResults = document.getElementById("btn-home-results");
const progress = document.getElementById("progress");
const liveScore = document.getElementById("live-score");
const questionText = document.getElementById("question-text");
const answersContainer = document.getElementById("answers");
const timeDisplay = document.getElementById("time-left");
const timerBar = document.getElementById("timer");
const finalScore = document.getElementById("final-score");
const scoreBoard = document.getElementById("score-board");
const btnShare = document.getElementById("btn-share");
const btnShareTop = document.getElementById("btn-share-top");
const playerNameInput = document.getElementById("player-name");
const categoryButtons = document.querySelectorAll(".btn-category");
const donationModal = document.getElementById("donation-modal");
const donationNumber = document.getElementById("donation-number");

let questions = [];
let quizList = [];
let currentIndex = 0;
let score = 0;
let timer = null;
let countdown = null;
let trainingMode = false;
let playerName = "Joueur";

console.log("📚 Chargement des questions...");

fetch("questions.json")
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        questions = data;
        console.log(`✅ ${questions.length} questions chargées avec succès`);
    })
    .catch(error => {
        console.error("❌ Erreur de chargement des questions:", error);
        const errorMsg = document.createElement("div");
        errorMsg.className = "error-message";
        errorMsg.innerHTML = `
            <p>⚠️ Impossible de charger les questions</p>
            <p>Vérifiez que le fichier questions.json existe</p>
        `;
        screenStart.appendChild(errorMsg);
    });

function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function setPlayerName() {
    const name = playerNameInput.value.trim();
    playerName = name || "Joueur";
    console.log(`👤 Nom du joueur défini: ${playerName}`);
    return playerName;
}

function resetGame() {
    console.log("🔄 Réinitialisation du jeu");
    currentIndex = 0;
    score = 0;
    clearTimeout(timer);
    clearInterval(countdown);
    timer = null;
    countdown = null;
    timeDisplay.textContent = "20 secondes restantes";
    timerBar.style.animation = "none";
}

function showToast(message, isError = false, duration = 3000) {
    const oldToast = document.querySelector(".toast");
    if (oldToast) oldToast.remove();
    const toast = document.createElement("div");
    toast.className = `toast ${isError ? "toast-error" : ""}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50%) translateY(20px)";
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showToast("✅ Copié dans le presse-papier !");
            })
            .catch(err => {
                console.error("Erreur API Clipboard:", err);
                copyFallback(text);
            });
    } else {
        copyFallback(text);
    }
}

function copyFallback(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
        const successful = document.execCommand("copy");
        if (successful) {
            showToast("✅ Copié dans le presse-papier !");
        } else {
            showToast(`❌ Impossible de copier. Le texte est: ${text}`, true);
        }
    } catch (err) {
        showToast(`❌ Erreur de copie. Le texte est: ${text}`, true);
    }
    document.body.removeChild(textarea);
}

function startQuiz(questionList) {
    console.log("🚀 Démarrage d'une nouvelle partie");
    resetGame();
    setPlayerName();
    quizList = shuffle(questionList).slice(0, 10);
    console.log(`📝 ${quizList.length} questions sélectionnées`);
    console.log(`🎮 Mode entraînement: ${trainingMode ? "OUI" : "NON"}`);
    screenStart.classList.add("hidden");
    screenResult.classList.add("hidden");
    screenQuiz.classList.remove("hidden");
    showQuestion();
}

function showQuestion() {
    if (!quizList[currentIndex]) {
        console.error("❌ Aucune question à afficher");
        showResults();
        return;
    }
    const question = quizList[currentIndex];
    console.log(`📊 Question ${currentIndex + 1}/${quizList.length}: ${question.category}`);
    clearTimeout(timer);
    clearInterval(countdown);
    progress.innerHTML = `<i class="fas fa-list-ol"></i><span>Question ${currentIndex + 1}/${quizList.length}</span>`;
    liveScore.innerHTML = `<i class="fas fa-star"></i><span>Score : ${score}</span>`;
    const categoryElement = document.getElementById("current-category");
    if (categoryElement) {
        categoryElement.textContent = question.category || "Toutes catégories";
    }
    questionText.textContent = question.text;
    if (!trainingMode) {
        startTimer(20);
        document.getElementById("training-indicator").classList.add("hidden");
    } else {
        document.getElementById("training-indicator").classList.remove("hidden");
        timerBar.style.animation = "none";
        timeDisplay.textContent = "Mode entraînement";
    }
    displayAnswers(question);
}

function startTimer(seconds) {
    let timeLeft = seconds;
    timeDisplay.innerHTML = `<i class="fas fa-clock"></i><span>${timeLeft} secondes restantes</span>`;
    timer = setTimeout(handleTimeUp, timeLeft * 1000);
    countdown = setInterval(() => {
        timeLeft--;
        timeDisplay.innerHTML = `<i class="fas fa-clock"></i><span>${timeLeft} secondes restantes</span>`;
        if (timeLeft <= 0) {
            clearInterval(countdown);
        }
    }, 1000);
    timerBar.style.animation = "none";
    void timerBar.offsetWidth;
    timerBar.style.animation = `countdown ${seconds}s linear forwards`;
}

function displayAnswers(question) {
    answersContainer.innerHTML = "";
    const shuffledAnswers = shuffle(question.answers);
    shuffledAnswers.forEach(answer => {
        const button = document.createElement("button");
        button.className = "answer-btn";
        button.textContent = answer;
        button.addEventListener("click", () => {
            checkAnswer(question, answer, button);
        });
        answersContainer.appendChild(button);
    });
}

function checkAnswer(question, selectedAnswer, button) {
    clearTimeout(timer);
    clearInterval(countdown);
    disableAllAnswers();
    const isCorrect = selectedAnswer === question.correct;
    if (isCorrect) {
        handleCorrectAnswer(button);
    } else {
        handleWrongAnswer(question, button);
    }
}

function disableAllAnswers() {
    Array.from(answersContainer.children).forEach(btn => {
        btn.disabled = true;
    });
}

function handleCorrectAnswer(button) {
    score++;
    button.classList.add("correct");
    liveScore.innerHTML = `<i class="fas fa-star"></i><span>Score : ${score}</span>`;
    setTimeout(goNextQuestion, 800);
}

function handleWrongAnswer(question, clickedButton) {
    clickedButton.classList.add("incorrect");
    clickedButton.classList.add("wrong");
    Array.from(answersContainer.children).forEach(btn => {
        if (btn.textContent === question.correct) {
            btn.classList.add("correct");
        }
    });
    setTimeout(goNextQuestion, 1500);
}

function handleTimeUp() {
    const question = quizList[currentIndex];
    disableAllAnswers();
    Array.from(answersContainer.children).forEach(btn => {
        if (btn.textContent === question.correct) {
            btn.classList.add("correct");
        }
    });
    setTimeout(goNextQuestion, 1500);
}

function goNextQuestion() {
    currentIndex++;
    if (currentIndex < quizList.length) {
        showQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    console.log("🏁 Fin du quiz - Affichage des résultats");
    screenQuiz.classList.add("hidden");
    screenResult.classList.remove("hidden");
    clearTimeout(timer);
    clearInterval(countdown);
    const totalQuestions = quizList.length;
    const correctAnswers = score;
    const wrongAnswers = totalQuestions - score;
    const percent = Math.round((score / totalQuestions) * 100);
    let message = "";
    let emoji = "🎉";
    if (percent === 100) {
        message = "Parfait ! Vous êtes un expert absolu !";
        emoji = "🌟";
    } else if (percent >= 70) {
        message = "Excellent ! Très bon score.";
        emoji = "👏";
    } else if (percent >= 40) {
        message = "Bien joué ! Continuez à progresser.";
        emoji = "👍";
    } else {
        message = "Courage ! Continuez à vous entraîner.";
        emoji = "💪";
    }
    let badge = "";
    if (percent === 100) badge = "🌟 Expert Absolu";
    else if (percent >= 70) badge = "🏅 Maître du Quiz";
    else if (percent >= 40) badge = "🎓 Apprenti Motivé";
    else badge = "💡 Explorateur Curieux";
    finalScore.innerHTML = `
        <h3>${emoji} ${playerName}, voici vos résultats :</h3>
        <div class="score-final">${score}/${totalQuestions}</div>
        <div class="score-percent">${percent}% de réussite</div>
        <p>${message}</p>
    `;
    const statsContainer = document.getElementById("result-stats");
    statsContainer.innerHTML = `
        <div class="stat-item">
            <span class="stat-value">${correctAnswers}</span>
            <span class="stat-label">Bonnes réponses</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${wrongAnswers}</span>
            <span class="stat-label">Mauvaises réponses</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${percent}%</span>
            <span class="stat-label">Taux de réussite</span>
        </div>
    `;
    const badgeContainer = document.getElementById("achievement-badge");
    badgeContainer.innerHTML = `<div class="badge-text">${badge}</div>`;
    updateLeaderboard();
}

function updateLeaderboard() {
    const categoryPlayed = quizList[0]?.category || "Toutes catégories";
    const percent = Math.round((score / quizList.length) * 100);
    let leaderboard = JSON.parse(localStorage.getItem(categoryPlayed) || "[]");
    leaderboard.push({
        name: playerName,
        score: score,
        total: quizList.length,
        percent: percent,
        date: new Date().toLocaleDateString("fr-FR")
    });
    leaderboard.sort((a, b) => {
        if (b.percent !== a.percent) return b.percent - a.percent;
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.date) - new Date(a.date);
    });
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem(categoryPlayed, JSON.stringify(leaderboard));
    displayLeaderboard(leaderboard);
}

function displayLeaderboard(leaderboard) {
    scoreBoard.innerHTML = "";
    if (leaderboard.length === 0) {
        scoreBoard.innerHTML = '<p class="no-scores">Aucun score enregistré</p>';
        return;
    }
    leaderboard.forEach((entry, index) => {
        const row = document.createElement("div");
        row.className = "leaderboard-row";
        if (entry.name === playerName && entry.score === score) {
            row.classList.add("current-player");
        }
        row.innerHTML = `
            <span class="leaderboard-rank">${index + 1}</span>
            <span class="leaderboard-name">${entry.name}</span>
            <span class="leaderboard-score">${entry.score}/${entry.total}</span>
        `;
        scoreBoard.appendChild(row);
    });
}

function returnToHome() {
    if (!screenQuiz.classList.contains("hidden")) {
        const confirmQuit = confirm("Voulez-vous vraiment quitter le quiz et retourner à l'accueil ?\n\nVotre progression en cours sera perdue.");
        if (!confirmQuit) {
            return;
        }
    }
    console.log("🏠 Retour à l'accueil");
    resetGame();
    screenQuiz.classList.add("hidden");
    screenResult.classList.add("hidden");
    screenStart.classList.remove("hidden");
}

function shareScore() {
    const percent = Math.round((score / quizList.length) * 100);
    const shareUrl = window.location.href;
    const shareMessage = `🎯 J'ai obtenu ${score}/${quizList.length} (${percent}%) au Quiz Culture Africain !\nTestez vos connaissances : ${shareUrl}\n\n#QuizAfrique #CultureAfricaine`;
    
    // Vérifier si le SDK Facebook est chargé
    if (typeof FB !== 'undefined') {
        console.log("Tentative de partage Facebook...");
        FB.ui({
            method: 'share',
            href: shareUrl,
            quote: shareMessage,
            hashtag: '#QuizAfrique'
        }, function(response) {
            if (response && !response.error_message) {
                showToast("✅ Partagé sur Facebook !");
            } else {
                console.log('Erreur Facebook ou partage annulé');
                fallbackShare(shareMessage);
            }
        });
    } else {
        console.log('SDK Facebook non chargé, fallback...');
        fallbackShare(shareMessage);
    }
}

function fallbackShare(text) {
    // Méthode moderne (mobile surtout)
    if (navigator.share) {
        navigator.share({
            title: 'Mon score au Quiz Culture Africain',
            text: text,
            url: window.location.href
        });
    } else {
        // Méthode de secours : copie dans presse-papier
        navigator.clipboard.writeText(text).then(() => {
            showToast("✅ Score copié ! Collez-le où vous voulez (WhatsApp, etc.)");
        }).catch(() => {
            // Fallback ultime
            prompt("Copiez ce texte pour partager votre score :", text);
        });
    }
}



function shareLeaderboard() {
    const categoryPlayed = quizList[0]?.category || "Toutes catégories";
    const leaderboard = JSON.parse(localStorage.getItem(categoryPlayed) || "[]");
    if (leaderboard.length === 0) {
        showToast("❌ Aucun classement disponible pour le moment", true);
        return;
    }
    let shareMessage = `🏆 CLASSEMENT TOP 10 - QUIZ CULTURE AFRICAINE
📊 CATÉGORIE : ${categoryPlayed}
📅 ${new Date().toLocaleDateString("fr-FR")}

`;
    leaderboard.forEach((entry, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
        shareMessage += `${medal} ${entry.name} - ${entry.score}/${entry.total}\n`;
    });
    shareMessage += `
🎯 Mon score : ${playerName} - ${score}/${quizList.length}
🔗 Jouez aussi : ${window.location.href}

#ClassementAfrique #QuizCulturel #Top10`;
    if (navigator.share) {
        navigator.share({
            title: `Classement Quiz Culture Africaine - ${categoryPlayed}`,
            text: shareMessage,
            url: window.location.href
        })
        .catch(error => {
            console.log("❌ Partage annulé:", error);
            copyToClipboard(shareMessage);
        });
    } else {
        copyToClipboard(shareMessage);
    }
}

function showDonationModal() {
    console.log("💝 Ouverture du modal des dons");
    donationModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeDonationModal() {
    donationModal.classList.add("hidden");
    document.body.style.overflow = "";
}

function copyDonationNumber() {
    const number = donationNumber.textContent;
    copyToClipboard(number);
}

function showWesternUnionGuide() {
    const guide = `💡 GUIDE WESTERN UNION :

1. Rendez-vous dans une agence Western Union
2. Remplissez le formulaire avec :
   • Nom du bénéficiaire : KOUDAYA Lossa Maxim
   • Pays : Bénin
   • Ville : Cotonou
   • Téléphone : +229 01 66 62 84 63
3. Gardez le numéro MTCN
4. Envoyez-nous le MTCN à : lesagekmal@gmail.com

Merci pour votre soutien ! 🙏`;
    showToast(guide, false, 10000);
}

function initEventListeners() {
    console.log("🎮 Initialisation des événements");
    btnStart.addEventListener("click", () => {
        trainingMode = false;
        startQuiz(questions);
    });
    btnTraining.addEventListener("click", () => {
        trainingMode = true;
        startQuiz(questions);
    });
    btnRetry.addEventListener("click", () => {
        screenResult.classList.add("hidden");
        screenStart.classList.remove("hidden");
        resetGame();
    });
    btnSkip.addEventListener("click", () => {
        clearTimeout(timer);
        clearInterval(countdown);
        goNextQuestion();
    });
    btnHomeQuiz.addEventListener("click", returnToHome);
    btnHomeResults.addEventListener("click", returnToHome);
    btnShare.addEventListener("click", shareScore);
    btnShareTop.addEventListener("click", shareLeaderboard);
    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            trainingMode = false;
            const chosenCategory = btn.getAttribute("data-category");
            console.log(`🎯 Catégorie sélectionnée : ${chosenCategory}`);
            const filteredQuestions = questions.filter(q => q.category === chosenCategory);
            const questionsToUse = filteredQuestions.length > 0 
                ? filteredQuestions 
                : questions;
            startQuiz(questionsToUse);
        });
    });
    donationModal.addEventListener("click", (e) => {
        if (e.target === donationModal) {
            closeDonationModal();
        }
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !donationModal.classList.contains("hidden")) {
            closeDonationModal();
        }
    });
    playerNameInput.addEventListener("input", () => {
        const name = playerNameInput.value.trim();
        if (name) {
            localStorage.setItem("quizPlayerName", name);
        }
    });
    playerNameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            trainingMode = false;
            startQuiz(questions);
        }
    });
}

function initApp() {
    console.log("🚀 Initialisation de l'application Quiz Culture Africain");
    const savedName = localStorage.getItem("quizPlayerName");
    if (savedName) {
        playerNameInput.value = savedName;
        playerName = savedName;
        console.log(`👤 Nom restauré : ${playerName}`);
    }
    initEventListeners();
    screenQuiz.classList.add("hidden");
    screenResult.classList.add("hidden");
    screenStart.classList.remove("hidden");
    if (questions.length === 0) {
        console.warn("⚠️ Aucune question chargée - vérifiez le fichier questions.json");
    }
    console.log("✅ Application prête !");
}

document.addEventListener("DOMContentLoaded", initApp);






// Fonctions pour copier les informations de don
function copyMTNNumber() {
    const text = "+229 01 66 62 84 63";
    copyToClipboard(text);
}

function copyWesternName() {
    const text = "KOUDAYA Lossa Maxim";
    copyToClipboard(text);
}

function copyPayPalEmail() {
    const text = "lesagekmal@gmail.com";
    copyToClipboard(text);
}

function showWesternGuide() {
    const guide = `📋 GUIDE WESTERN UNION :
    
1. Rendez-vous dans une agence Western Union
2. Remplissez le formulaire avec :
   • Nom du bénéficiaire : KOUDAYA Lossa Maxim
   • Pays : Bénin
   • Ville : Cotonou
   • Téléphone : +229 01 66 62 84 63
3. Gardez le numéro MTCN
4. Envoyez-nous le MTCN à : lesagekmal@gmail.com

Merci pour votre soutien ! 🙏`;
    
    showToast(guide, false, 10000);
}