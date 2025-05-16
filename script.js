document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const welcomeScreen = document.querySelector('.welcome-screen');
    const quizContainer = document.querySelector('.quiz-container');
    const resultsContainer = document.querySelector('.results-container');
    const wrongAnswersContainer = document.querySelector('.wrong-answers-container');

    const startQuizBtn = document.getElementById('start-quiz');
    const showWrongBtn = document.getElementById('show-wrong');
    const nextBtn = document.getElementById('next-btn');
    const restartQuizBtn = document.getElementById('restart-quiz');
    const reviewWrongBtn = document.getElementById('review-wrong');
    const backToHomeBtn = document.getElementById('back-to-home');

    const questionText = document.getElementById('question');
    const cityNameText = document.getElementById('city-name');
    const answersContainer = document.getElementById('answers');
    const currentQuestionElement = document.getElementById('current-question');
    const totalQuestionsElement = document.getElementById('total-questions');
    const scoreElement = document.getElementById('score');
    const totalElement = document.getElementById('total');
    const wrongAnswersList = document.getElementById('wrong-answers-list');

    // Quiz variables
    let cities = [];
    let currentQuestion = 0;
    let score = 0;
    let wrongAnswers = [];
    let savedQuestions = []; // Array to store saved questions
    let selectedAnswer = null;
    let currentQuestionData = null; // Store current question data
    const minQuestionsBeforeFinish = 10; // Minimum questions before showing finish button

    // Load cities data
    fetch('sehirler_ve_gezilecek_yerler.json')
        .then(response => response.json())
        .then(data => {
            cities = data;
            console.log('Data loaded:', cities.length, 'cities');

            // Enable start button
            startQuizBtn.disabled = false;

            // Check if there are any wrong answers in local storage
            loadWrongAnswers();
            loadSavedQuestions();

            if (wrongAnswers.length > 0) {
                showWrongBtn.style.display = 'block';
            } else {
                showWrongBtn.style.display = 'none';
            }
        })
        .catch(error => console.error('Error loading data:', error));

    // Event listeners
    startQuizBtn.addEventListener('click', startQuiz);
    showWrongBtn.addEventListener('click', showWrongAnswers);
    nextBtn.addEventListener('click', nextQuestion);
    restartQuizBtn.addEventListener('click', startQuiz);
    reviewWrongBtn.addEventListener('click', showWrongAnswers);
    backToHomeBtn.addEventListener('click', backToHome);

    // Create finish quiz button
    const finishQuizBtn = document.createElement('button');
    finishQuizBtn.id = 'finish-quiz-btn';
    finishQuizBtn.className = 'btn secondary';
    finishQuizBtn.textContent = 'Quiz\'i Bitir';
    finishQuizBtn.style.display = 'none';
    finishQuizBtn.addEventListener('click', endQuiz);

    // Append finish button to controls div
    document.querySelector('.controls').appendChild(finishQuizBtn);

    // Create save question button
    const saveQuestionBtn = document.createElement('button');
    saveQuestionBtn.id = 'save-question-btn';
    saveQuestionBtn.className = 'btn secondary save-btn';
    saveQuestionBtn.textContent = 'Soruyu Kaydet';
    saveQuestionBtn.style.display = 'none';
    saveQuestionBtn.addEventListener('click', toggleSaveQuestion);

    // Append save button after answers container
    answersContainer.insertAdjacentElement('afterend', saveQuestionBtn);

    // Create quiz stats container
    const quizStatsContainer = document.createElement('div');
    quizStatsContainer.className = 'quiz-stats';

    // Create quiz stats elements
    const questionCounter = document.createElement('div');
    questionCounter.className = 'stat';
    questionCounter.innerHTML = '<span class="stat-icon">📋</span> Soru: <span id="stats-question-count">1</span>';

    const correctCounter = document.createElement('div');
    correctCounter.className = 'stat stat-correct';
    correctCounter.innerHTML = '<span class="stat-icon">✓</span> Doğru: <span id="stats-correct-count">0</span>';

    const wrongCounter = document.createElement('div');
    wrongCounter.className = 'stat stat-wrong';
    wrongCounter.innerHTML = '<span class="stat-icon">✗</span> Yanlış: <span id="stats-wrong-count">0</span>';

    // Add stats to container
    quizStatsContainer.appendChild(questionCounter);
    quizStatsContainer.appendChild(correctCounter);
    quizStatsContainer.appendChild(wrongCounter);

    // Create home button for quiz screen
    const homeBtn = document.createElement('button');
    homeBtn.id = 'home-btn';
    homeBtn.className = 'btn home-btn';
    homeBtn.textContent = 'Ana Sayfa';
    homeBtn.addEventListener('click', backToHome);

    // Get quiz header
    const quizHeader = document.querySelector('.quiz-header');

    // Add home button and stats before the question
    quizHeader.insertBefore(homeBtn, quizHeader.firstChild);
    quizHeader.insertBefore(quizStatsContainer, quizHeader.children[1]);

    // Start quiz
    function startQuiz() {
        welcomeScreen.style.display = 'none';
        resultsContainer.style.display = 'none';
        wrongAnswersContainer.style.display = 'none';
        quizContainer.style.display = 'block';
        finishQuizBtn.style.display = 'none';

        // Reset quiz variables
        currentQuestion = 0;
        score = 0;
        wrongCount = 0; // Add a counter for wrong answers
        wrongAnswers = [];

        // Update UI
        totalQuestionsElement.textContent = '∞'; // Infinity symbol to show continuous questions

        // Load first question
        loadQuestion();

        // Update stats display
        updateStatsDisplay();
    }

    // Add wrong count variable
    let wrongCount = 0;

    // Update stats display function
    function updateStatsDisplay() {
        document.getElementById('stats-question-count').textContent = currentQuestion + 1;
        document.getElementById('stats-correct-count').textContent = score;
        document.getElementById('stats-wrong-count').textContent = wrongCount;
    }

    // Load question
    function loadQuestion() {
        // Reset state
        selectedAnswer = null;
        nextBtn.disabled = true;
        saveQuestionBtn.style.display = 'none';
        saveQuestionBtn.textContent = 'Soruyu Kaydet';
        saveQuestionBtn.classList.remove('saved');

        // Update progress
        currentQuestionElement.textContent = currentQuestion + 1;

        // Show finish button after minimum questions
        if (currentQuestion >= minQuestionsBeforeFinish - 1) {
            finishQuizBtn.style.display = 'block';
        } else {
            finishQuizBtn.style.display = 'none';
        }

        // Get random city
        const randomCityIndex = Math.floor(Math.random() * cities.length);
        const city = cities[randomCityIndex];

        // Set question
        cityNameText.textContent = city.city;
        questionText.textContent = `Hangisi ${city.city} şehrinde bulunan bir gezilecek yerdir?`;

        // Get correct place 
        const correctPlaceIndex = Math.floor(Math.random() * city.places.length);
        const correctPlace = city.places[correctPlaceIndex];

        // Get 3 wrong places from other cities
        let wrongPlaces = [];
        let availableCities = [...cities];
        availableCities.splice(randomCityIndex, 1); // Remove current city

        // Shuffle available cities
        availableCities.sort(() => 0.5 - Math.random());

        // Get 3 places from different cities
        for (let i = 0; i < 3 && i < availableCities.length; i++) {
            const randomCityPlaces = availableCities[i].places;
            const randomPlaceIndex = Math.floor(Math.random() * randomCityPlaces.length);
            wrongPlaces.push(randomCityPlaces[randomPlaceIndex]);
        }

        // Create answers array with correct and wrong places
        let answers = [
            {
                text: correctPlace.name,
                description: correctPlace.description,
                correct: true
            },
            ...wrongPlaces.map(place => ({
                text: place.name,
                description: place.description,
                correct: false
            }))
        ];

        // Shuffle answers
        answers.sort(() => 0.5 - Math.random());

        // Add answers to DOM
        answersContainer.innerHTML = '';
        answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.classList.add('answer-btn');
            button.textContent = answer.text;
            button.dataset.index = index;
            button.dataset.correct = answer.correct;
            button.dataset.description = answer.description;

            button.addEventListener('click', selectAnswer);

            answersContainer.appendChild(button);
        });

        // Store current question data
        currentQuestionData = {
            city: city.city,
            question: `Hangisi ${city.city} şehrinde bulunan bir gezilecek yerdir?`,
            correctPlace: correctPlace,
            answers: answers
        };
    }

    // Select answer
    function selectAnswer(e) {
        if (selectedAnswer !== null) {
            return; // Already answered
        }

        selectedAnswer = e.target.dataset.index;
        const isCorrect = e.target.dataset.correct === 'true';

        // Find all answer buttons
        const answerButtons = document.querySelectorAll('.answer-btn');

        // Disable all buttons
        answerButtons.forEach(button => {
            button.removeEventListener('click', selectAnswer);

            if (button.dataset.correct === 'true') {
                button.classList.add('correct');
            } else if (button.dataset.index === selectedAnswer) {
                button.classList.add('wrong');
            }
        });

        // Create question details for possible saving
        const cityName = cityNameText.textContent;
        const questionDetails = {
            id: Date.now(), // Unique ID for the question
            city: cityName,
            question: questionText.textContent,
            selectedAnswer: e.target.textContent,
            selectedDescription: e.target.dataset.description,
            correctAnswer: '',
            correctDescription: '',
            isCorrect: isCorrect,
            autoSaved: !isCorrect // Mark if automatically saved (for wrong answers)
        };

        // Find the correct answer
        answerButtons.forEach(button => {
            if (button.dataset.correct === 'true') {
                questionDetails.correctAnswer = button.textContent;
                questionDetails.correctDescription = button.dataset.description;
            }
        });

        // Update score
        if (isCorrect) {
            score++;
        } else {
            wrongCount++; // Increment wrong counter
            // Store wrong answer and auto-save it
            wrongAnswers.push(questionDetails);
            saveWrongAnswers();

            // For wrong answers, show as automatically saved
            saveQuestionBtn.textContent = 'Otomatik Kaydedildi ✓';
            saveQuestionBtn.classList.add('saved', 'auto-saved');

            // Also add to saved questions
            saveQuestion(questionDetails);
        }

        // Update the stats display
        updateStatsDisplay();

        // Show save button
        saveQuestionBtn.style.display = 'block';
        saveQuestionBtn.dataset.questionId = questionDetails.id;
        saveQuestionBtn.dataset.autoSaved = !isCorrect;

        // Store current question details for saving
        currentQuestionData = questionDetails;

        // Enable next button
        nextBtn.disabled = false;
    }

    // Toggle save/unsave question
    function toggleSaveQuestion() {
        const questionId = parseInt(saveQuestionBtn.dataset.questionId);
        const isAutoSaved = saveQuestionBtn.dataset.autoSaved === 'true';

        if (isSavedQuestion(questionId)) {
            // Remove from saved questions
            removeSavedQuestion(questionId);

            if (isAutoSaved) {
                // For auto-saved questions, change text to indicate it was unsaved
                saveQuestionBtn.textContent = 'Otomatik Kaydı İptal Edildi';
                saveQuestionBtn.classList.remove('saved');
                saveQuestionBtn.classList.add('unsaved');

                // Also remove from wrong answers if it was auto-saved
                wrongAnswers = wrongAnswers.filter(q => q.id !== questionId);
                saveWrongAnswers();
            } else {
                saveQuestionBtn.textContent = 'Soruyu Kaydet';
                saveQuestionBtn.classList.remove('saved', 'auto-saved');
            }
        } else {
            // Add to saved questions
            saveQuestion(currentQuestionData);

            if (isAutoSaved) {
                // Re-add to wrong answers if it was auto-saved before
                if (!wrongAnswers.some(q => q.id === questionId)) {
                    wrongAnswers.push(currentQuestionData);
                    saveWrongAnswers();
                }
                saveQuestionBtn.textContent = 'Otomatik Kaydedildi ✓';
                saveQuestionBtn.classList.add('saved', 'auto-saved');
            } else {
                saveQuestionBtn.textContent = 'Kaydedildi ✓';
                saveQuestionBtn.classList.add('saved');
                saveQuestionBtn.classList.remove('auto-saved');
            }
        }
    }

    // Check if question is already saved
    function isSavedQuestion(id) {
        return savedQuestions.some(q => q.id === id);
    }

    // Save question
    function saveQuestion(questionData) {
        if (!isSavedQuestion(questionData.id)) {
            savedQuestions.push(questionData);
            saveSavedQuestions();
        }
    }

    // Remove saved question
    function removeSavedQuestion(id) {
        savedQuestions = savedQuestions.filter(q => q.id !== id);
        saveSavedQuestions();
    }

    // Save saved questions to local storage
    function saveSavedQuestions() {
        localStorage.setItem('quizSavedQuestions', JSON.stringify(savedQuestions));
    }

    // Load saved questions from local storage
    function loadSavedQuestions() {
        const saved = localStorage.getItem('quizSavedQuestions');
        if (saved) {
            savedQuestions = JSON.parse(saved);
        }
    }

    // Next question
    function nextQuestion() {
        currentQuestion++;
        loadQuestion();
        updateStatsDisplay(); // Update the stats when moving to next question
    }

    // End quiz
    function endQuiz() {
        quizContainer.style.display = 'none';
        resultsContainer.style.display = 'block';

        scoreElement.textContent = score;
        totalElement.textContent = currentQuestion;
    }

    // Show wrong answers
    function showWrongAnswers() {
        welcomeScreen.style.display = 'none';
        quizContainer.style.display = 'none';
        resultsContainer.style.display = 'none';
        wrongAnswersContainer.style.display = 'block';

        loadWrongAnswers();
        renderWrongAnswers();
    }

    // Render wrong answers
    function renderWrongAnswers() {
        wrongAnswersList.innerHTML = '';

        if (wrongAnswers.length === 0) {
            const noWrong = document.createElement('p');
            noWrong.textContent = 'Henüz yanlış cevaplanan soru bulunmamaktadır.';
            wrongAnswersList.appendChild(noWrong);
            return;
        }

        wrongAnswers.forEach((item, index) => {
            const wrongItem = document.createElement('div');
            wrongItem.classList.add('wrong-item');

            // Create header with title and delete button
            const wrongItemHeader = document.createElement('div');
            wrongItemHeader.classList.add('wrong-item-header');

            const cityTitle = document.createElement('h3');
            cityTitle.textContent = item.city;

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = 'Sil';
            deleteBtn.dataset.id = item.id;
            deleteBtn.addEventListener('click', deleteWrongAnswer);

            wrongItemHeader.appendChild(cityTitle);
            wrongItemHeader.appendChild(deleteBtn);

            const questionText = document.createElement('p');
            questionText.textContent = item.question;

            const wrongAnswer = document.createElement('div');
            wrongAnswer.classList.add('wrong-answer');
            wrongAnswer.textContent = `Seçilen: ${item.selectedAnswer} (${item.selectedDescription})`;

            const correctAnswer = document.createElement('div');
            correctAnswer.classList.add('correct-answer');
            correctAnswer.textContent = `Doğru cevap: ${item.correctAnswer} (${item.correctDescription})`;

            wrongItem.appendChild(wrongItemHeader);
            wrongItem.appendChild(questionText);
            wrongItem.appendChild(wrongAnswer);
            wrongItem.appendChild(correctAnswer);

            wrongAnswersList.appendChild(wrongItem);
        });
    }

    // Delete wrong answer
    function deleteWrongAnswer(e) {
        const id = parseInt(e.target.dataset.id);

        // Remove from wrong answers
        wrongAnswers = wrongAnswers.filter(item => item.id !== id);

        // Also remove from saved questions if it exists there
        savedQuestions = savedQuestions.filter(item => item.id !== id);

        // Save changes
        saveWrongAnswers();
        saveSavedQuestions();

        // Re-render wrong answers list
        renderWrongAnswers();

        // If no wrong answers left, show message
        if (wrongAnswers.length === 0) {
            showWrongBtn.style.display = 'none';
        }
    }

    // Back to home
    function backToHome() {
        wrongAnswersContainer.style.display = 'none';
        resultsContainer.style.display = 'none';
        quizContainer.style.display = 'none';
        welcomeScreen.style.display = 'block';
    }

    // Save wrong answers to local storage
    function saveWrongAnswers() {
        localStorage.setItem('quizWrongAnswers', JSON.stringify(wrongAnswers));
    }

    // Load wrong answers from local storage
    function loadWrongAnswers() {
        const savedWrongAnswers = localStorage.getItem('quizWrongAnswers');
        if (savedWrongAnswers) {
            wrongAnswers = JSON.parse(savedWrongAnswers);
        }
    }
});
