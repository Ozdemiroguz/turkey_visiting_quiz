document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const welcomeScreen = document.querySelector('.welcome-screen');
    const quizContainer = document.querySelector('.quiz-container');
    const resultsContainer = document.querySelector('.results-container');
    const wrongAnswersContainer = document.querySelector('.wrong-answers-container');
    const savedQuestionsContainer = document.querySelector('.saved-questions-container');

    const startQuizBtn = document.getElementById('start-quiz');
    const showWrongBtn = document.getElementById('show-wrong');
    const showSavedBtn = document.getElementById('show-saved');
    const nextBtn = document.getElementById('next-btn');
    const restartQuizBtn = document.getElementById('restart-quiz');
    const reviewWrongBtn = document.getElementById('review-wrong');
    const backToHomeBtn = document.getElementById('back-to-home');
    const backToHomeFromSavedBtn = document.getElementById('back-to-home-from-saved');

    const questionText = document.getElementById('question');
    const cityNameText = document.getElementById('city-name');
    const answersContainer = document.getElementById('answers');
    const currentQuestionElement = document.getElementById('current-question');
    const totalQuestionsElement = document.getElementById('total-questions');
    const scoreElement = document.getElementById('score');
    const totalElement = document.getElementById('total');
    const wrongAnswersList = document.getElementById('wrong-answers-list');
    const savedQuestionsList = document.getElementById('saved-questions-list');

    const startCityToPlaceQuizBtn = document.getElementById('start-city-to-place-quiz');
    const startPlaceToCityQuizBtn = document.getElementById('start-place-to-city-quiz');
    const quizTypeIndicator = document.getElementById('quiz-type-indicator');

    // Quiz variables
    let cities = [];
    let currentQuestion = 0;
    let score = 0;
    let wrongAnswers = [];
    let savedQuestions = []; // Array to store saved questions
    let selectedAnswer = null;
    let currentQuestionData = null; // Store current question data
    let currentQuizId = null; // Track current quiz session
    const minQuestionsBeforeFinish = 10; // Minimum questions before showing finish button

    // Add a variable to track quiz type
    let currentQuizType = 'cityToPlace'; // Default quiz type

    // Load cities data
    fetch('sehirler_ve_gezilecek_yerler.json')
        .then(response => response.json())
        .then(data => {
            cities = data;
            console.log('Data loaded:', cities.length, 'cities');

            // Enable start button
            startQuizBtn.disabled = false;

            // Check if there are any wrong answers or saved questions in local storage
            loadWrongAnswers();
            loadSavedQuestions();

            if (wrongAnswers.length > 0) {
                showWrongBtn.style.display = 'block';
            } else {
                showWrongBtn.style.display = 'none';
            }

            if (savedQuestions.length > 0) {
                showSavedBtn.style.display = 'block';
            } else {
                showSavedBtn.style.display = 'none';
            }
        })
        .catch(error => console.error('Error loading data:', error));

    // Event listeners
    startQuizBtn.addEventListener('click', startQuiz);
    showWrongBtn.addEventListener('click', showWrongAnswers);
    showSavedBtn.addEventListener('click', showSavedQuestions);
    nextBtn.addEventListener('click', nextQuestion);
    restartQuizBtn.addEventListener('click', startQuiz);
    reviewWrongBtn.addEventListener('click', showWrongAnswers);
    backToHomeBtn.addEventListener('click', backToHome);
    backToHomeFromSavedBtn.addEventListener('click', backToHome);

    // Update event listeners for quiz type buttons
    startCityToPlaceQuizBtn.addEventListener('click', function () {
        currentQuizType = 'cityToPlace';
        startQuiz();
    });

    startPlaceToCityQuizBtn.addEventListener('click', function () {
        currentQuizType = 'placeToCity';
        startQuiz();
    });

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
        savedQuestionsContainer.style.display = 'none';
        quizContainer.style.display = 'block';
        finishQuizBtn.style.display = 'none';

        // Reset quiz variables
        currentQuestion = 0;
        score = 0;
        wrongCount = 0;
        // Don't reset wrongAnswers array anymore
        // Instead, create a new quiz session ID
        currentQuizId = "Quiz " + (new Date().toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }));

        // Update UI
        totalQuestionsElement.textContent = '∞'; // Infinity symbol to show continuous questions

        // Load first question
        loadQuestion();

        // Update stats display
        updateStatsDisplay();

        // Update quiz type indicator
        updateQuizTypeIndicator();
    }

    // Add wrong count variable
    let wrongCount = 0;

    // Update stats display function
    function updateStatsDisplay() {
        document.getElementById('stats-question-count').textContent = currentQuestion + 1;
        document.getElementById('stats-correct-count').textContent = score;
        document.getElementById('stats-wrong-count').textContent = wrongCount;
    }

    // Load question based on quiz type
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

        if (currentQuizType === 'cityToPlace') {
            loadCityToPlaceQuestion();
        } else {
            loadPlaceToCityQuestion();
        }
    }

    // Original quiz type - City to Place
    function loadCityToPlaceQuestion() {
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
        renderAnswerOptions(answers);

        // Store current question data
        currentQuestionData = {
            city: city.city,
            question: `Hangisi ${city.city} şehrinde bulunan bir gezilecek yerdir?`,
            correctPlace: correctPlace,
            answers: answers,
            quizType: 'cityToPlace'
        };
    }

    // New quiz type - Place to City
    function loadPlaceToCityQuestion() {
        // Get random city
        const randomCityIndex = Math.floor(Math.random() * cities.length);
        const city = cities[randomCityIndex];

        // Get random place from that city
        const randomPlaceIndex = Math.floor(Math.random() * city.places.length);
        const place = city.places[randomPlaceIndex];

        // Set question
        cityNameText.textContent = place.name;
        questionText.textContent = `"${place.name}" hangi şehirde bulunmaktadır?`;

        // Add place description to the question to provide context
        const placeDescElement = document.createElement('div');
        placeDescElement.className = 'place-question-description';
        placeDescElement.textContent = `Açıklama: ${place.description}`;

        // Clear any existing description and add the new one
        const existingDesc = questionText.nextElementSibling;
        if (existingDesc && existingDesc.classList.contains('place-question-description')) {
            existingDesc.remove();
        }
        questionText.insertAdjacentElement('afterend', placeDescElement);

        // Get 3 wrong cities
        let wrongCities = [];
        let availableCities = [...cities];
        availableCities.splice(randomCityIndex, 1); // Remove correct city

        // Shuffle available cities
        availableCities.sort(() => 0.5 - Math.random());

        // Get 3 different cities
        for (let i = 0; i < 3 && i < availableCities.length; i++) {
            wrongCities.push(availableCities[i]);
        }

        // Create answers array with correct and wrong cities - NO DESCRIPTIONS
        let answers = [
            {
                text: city.city,
                description: '', // Empty description for correct answer
                correct: true
            },
            ...wrongCities.map(wrongCity => ({
                text: wrongCity.city,
                description: '', // Empty description for wrong answers too
                correct: false
            }))
        ];

        // Shuffle answers
        answers.sort(() => 0.5 - Math.random());

        // Add answers to DOM with modified rendering for this quiz type
        renderAnswerOptions(answers, 'placeToCity');

        // Store current question data
        currentQuestionData = {
            city: city.city,
            place: place.name,
            placeDescription: place.description,
            question: `"${place.name}" hangi şehirde bulunmaktadır?`,
            answers: answers,
            quizType: 'placeToCity'
        };
    }

    // Shared function to render answer options - modified to handle quiz types differently
    function renderAnswerOptions(answers, quizType = 'cityToPlace') {
        answersContainer.innerHTML = '';
        answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.classList.add('answer-btn');

            // Create HTML for the answer based on quiz type
            let answerHTML;

            if (quizType === 'placeToCity') {
                // For place-to-city, just show the city name without description
                answerHTML = `
                    <div class="answer-name">${answer.text}</div>
                `;
            } else {
                // For city-to-place, show both name and description
                answerHTML = `
                    <div class="answer-name">${answer.text}</div>
                    <div class="answer-description">${answer.description}</div>
                `;
            }

            button.innerHTML = answerHTML;
            button.dataset.index = index;
            button.dataset.correct = answer.correct;
            button.dataset.description = answer.description;

            button.addEventListener('click', selectAnswer);

            answersContainer.appendChild(button);
        });
    }

    // Select answer
    function selectAnswer(e) {
        if (selectedAnswer !== null) {
            return; // Already answered
        }

        // Find the button that was clicked (might be a child element)
        const clickedButton = e.target.classList.contains('answer-btn') ?
            e.target : e.target.closest('.answer-btn');

        if (!clickedButton) return; // Safety check

        selectedAnswer = clickedButton.dataset.index;
        const isCorrect = clickedButton.dataset.correct === 'true';

        // Find all answer buttons
        const answerButtons = document.querySelectorAll('.answer-btn');

        // Disable all buttons
        answerButtons.forEach(button => {
            button.removeEventListener('click', selectAnswer);

            if (button.dataset.correct === 'true') {
                button.classList.add('correct');
            } else if (button === clickedButton && !isCorrect) {
                button.classList.add('wrong');
            }
        });

        // Create question details for possible saving
        const cityName = cityNameText.textContent;
        const questionDetails = {
            id: Date.now(), // Unique ID for the question
            city: cityName,
            question: questionText.textContent,
            selectedAnswer: clickedButton.querySelector('.answer-name').textContent || clickedButton.textContent,
            selectedDescription: clickedButton.querySelector('.answer-description')?.textContent || clickedButton.dataset.description,
            correctAnswer: '',
            correctDescription: '',
            isCorrect: isCorrect,
            autoSaved: !isCorrect, // Mark if automatically saved (for wrong answers)
            quizSession: currentQuizId // Add quiz session ID
        };

        // Find the correct answer
        answerButtons.forEach(button => {
            if (button.dataset.correct === 'true') {
                questionDetails.correctAnswer = button.querySelector('.answer-name')?.textContent || button.textContent;
                questionDetails.correctDescription = button.querySelector('.answer-description')?.textContent || button.dataset.description;
            }
        });

        // Update score
        if (isCorrect) {
            score++;
            // Show save button in normal state for correct answers
            saveQuestionBtn.textContent = 'Soruyu Kaydet';
            saveQuestionBtn.classList.remove('saved', 'auto-saved');
        } else {
            // Only increment wrong counter and save wrong answers if the answer is actually wrong
            wrongCount++;

            // Add to wrong answers and save
            if (!wrongAnswers.some(q => q.id === questionDetails.id)) {
                wrongAnswers.push(questionDetails);
                saveWrongAnswers();
            }

            // For wrong answers, show as automatically saved
            saveQuestionBtn.textContent = 'Otomatik Kaydedildi ✓';
            saveQuestionBtn.classList.add('saved', 'auto-saved');

            // Update UI for wrong answers button
            showWrongBtn.style.display = 'block';
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
        // Make sure savedQuestions is loaded from localStorage
        loadSavedQuestions();

        if (!isSavedQuestion(questionData.id)) {
            savedQuestions.push(questionData);
            saveSavedQuestions();

            // Make sure the saved questions button is visible
            showSavedBtn.style.display = 'block';
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
        } else {
            savedQuestions = [];
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
        savedQuestionsContainer.style.display = 'none';
        wrongAnswersContainer.style.display = 'block';

        loadWrongAnswers();

        // Create quiz session selector if it doesn't exist
        if (!document.getElementById('quiz-session-selector')) {
            createQuizSessionSelector();
        } else {
            // Update the selector options
            updateQuizSessionSelector();
        }

        renderWrongAnswers('all'); // Show all sessions by default
    }

    // Create quiz session selector dropdown
    function createQuizSessionSelector() {
        // Create container
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'session-selector-container';

        // Create label
        const selectorLabel = document.createElement('label');
        selectorLabel.htmlFor = 'quiz-session-selector';
        selectorLabel.textContent = 'Quiz oturumunu seçin: ';

        // Create select element
        const selector = document.createElement('select');
        selector.id = 'quiz-session-selector';
        selector.className = 'quiz-session-selector';

        // Add change event listener
        selector.addEventListener('change', function () {
            renderWrongAnswers(this.value);
        });

        // Add elements to container
        selectorContainer.appendChild(selectorLabel);
        selectorContainer.appendChild(selector);

        // Add container to wrong answers container, after the title
        const title = wrongAnswersContainer.querySelector('h2');
        title.insertAdjacentElement('afterend', selectorContainer);

        // Update the selector options
        updateQuizSessionSelector();
    }

    // Update quiz session selector options
    function updateQuizSessionSelector() {
        const selector = document.getElementById('quiz-session-selector');
        if (!selector) return;

        // Clear current options
        selector.innerHTML = '';

        // Add "All Sessions" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'Tüm Oturumlar';
        selector.appendChild(allOption);

        // Get unique quiz sessions
        const sessions = [];
        wrongAnswers.forEach(item => {
            const session = item.quizSession || 'Eski Quiz';
            if (!sessions.includes(session)) {
                sessions.push(session);
            }
        });

        // Sort sessions (newest first)
        sessions.sort((a, b) => b.localeCompare(a));

        // Add options for each session
        sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session;
            option.textContent = session;
            selector.appendChild(option);
        });
    }

    // Render wrong answers
    function renderWrongAnswers(sessionFilter = 'all') {
        wrongAnswersList.innerHTML = '';

        if (wrongAnswers.length === 0) {
            const noWrong = document.createElement('p');
            noWrong.textContent = 'Henüz yanlış cevaplanan soru bulunmamaktadır.';
            wrongAnswersList.appendChild(noWrong);
            return;
        }

        // Filter wrong answers by session if needed
        let filteredAnswers = wrongAnswers;
        if (sessionFilter !== 'all') {
            filteredAnswers = wrongAnswers.filter(item =>
                (item.quizSession || 'Eski Quiz') === sessionFilter);

            if (filteredAnswers.length === 0) {
                const noWrong = document.createElement('p');
                noWrong.textContent = 'Bu oturumda yanlış cevaplanan soru bulunmamaktadır.';
                wrongAnswersList.appendChild(noWrong);
                return;
            }
        }

        // Group wrong answers by quiz session
        const groupedWrongAnswers = {};
        filteredAnswers.forEach(item => {
            const quizSession = item.quizSession || 'Eski Quiz'; // Use 'Eski Quiz' for older entries without session
            if (!groupedWrongAnswers[quizSession]) {
                groupedWrongAnswers[quizSession] = [];
            }
            groupedWrongAnswers[quizSession].push(item);
        });

        // Sort quiz sessions by newest first
        const sortedSessions = Object.keys(groupedWrongAnswers).sort((a, b) => {
            return b.localeCompare(a);
        });

        // Render each group
        sortedSessions.forEach(session => {
            // Create session header
            const sessionHeader = document.createElement('div');
            sessionHeader.classList.add('quiz-session-header');
            sessionHeader.textContent = session;
            wrongAnswersList.appendChild(sessionHeader);

            // Render questions for this session
            groupedWrongAnswers[session].forEach(item => {
                const wrongItem = document.createElement('div');
                wrongItem.classList.add('wrong-item');

                // If it's an older question without proper quiz session, mark it
                if (session === 'Eski Quiz') {
                    wrongItem.classList.add('old-quiz-item');
                }

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

    // Show saved questions
    function showSavedQuestions() {
        welcomeScreen.style.display = 'none';
        quizContainer.style.display = 'none';
        resultsContainer.style.display = 'none';
        wrongAnswersContainer.style.display = 'none';
        savedQuestionsContainer.style.display = 'block';

        loadSavedQuestions();
        renderSavedQuestions();
    }

    // Render saved questions
    function renderSavedQuestions() {
        savedQuestionsList.innerHTML = '';

        if (savedQuestions.length === 0) {
            const noSaved = document.createElement('p');
            noSaved.textContent = 'Henüz kaydettiğiniz soru bulunmamaktadır.';
            savedQuestionsList.appendChild(noSaved);
            return;
        }

        savedQuestions.forEach((item) => {
            const savedItem = document.createElement('div');
            savedItem.classList.add('saved-item');

            // Add a class based on whether it was correct or incorrect
            if (item.isCorrect) {
                savedItem.classList.add('correct-item');
            } else {
                savedItem.classList.add('wrong-item');
            }

            // Create header with title and delete button
            const savedItemHeader = document.createElement('div');
            savedItemHeader.classList.add('saved-item-header');

            const cityTitle = document.createElement('h3');
            cityTitle.textContent = item.city;

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = 'Sil';
            deleteBtn.dataset.id = item.id;
            deleteBtn.addEventListener('click', deleteSavedQuestion);

            savedItemHeader.appendChild(cityTitle);
            savedItemHeader.appendChild(deleteBtn);

            const questionText = document.createElement('p');
            questionText.textContent = item.question;

            // Only show selected/correct distinction if the question was answered incorrectly
            if (!item.isCorrect) {
                const wrongAnswer = document.createElement('div');
                wrongAnswer.classList.add('wrong-answer');
                wrongAnswer.textContent = `Seçilen: ${item.selectedAnswer} (${item.selectedDescription})`;

                const correctAnswer = document.createElement('div');
                correctAnswer.classList.add('correct-answer');
                correctAnswer.textContent = `Doğru cevap: ${item.correctAnswer} (${item.correctDescription})`;

                savedItem.appendChild(savedItemHeader);
                savedItem.appendChild(questionText);
                savedItem.appendChild(wrongAnswer);
                savedItem.appendChild(correctAnswer);
            } else {
                // Just show the correct answer for correctly answered questions
                const correctAnswer = document.createElement('div');
                correctAnswer.classList.add('correct-answer');
                correctAnswer.textContent = `Cevap: ${item.selectedAnswer} (${item.selectedDescription})`;

                savedItem.appendChild(savedItemHeader);
                savedItem.appendChild(questionText);
                savedItem.appendChild(correctAnswer);
            }

            savedQuestionsList.appendChild(savedItem);
        });
    }

    // Delete saved question
    function deleteSavedQuestion(e) {
        const id = parseInt(e.target.dataset.id);

        // Remove from saved questions
        savedQuestions = savedQuestions.filter(item => item.id !== id);

        // Also remove from wrong answers if it exists there
        wrongAnswers = wrongAnswers.filter(item => item.id !== id);

        // Save changes
        saveSavedQuestions();
        saveWrongAnswers();

        // Re-render saved questions list
        renderSavedQuestions();

        // Update UI buttons visibility
        if (savedQuestions.length === 0) {
            showSavedBtn.style.display = 'none';
        }

        if (wrongAnswers.length === 0) {
            showWrongBtn.style.display = 'none';
        }
    }

    // Back to home
    function backToHome() {
        wrongAnswersContainer.style.display = 'none';
        resultsContainer.style.display = 'none';
        quizContainer.style.display = 'none';
        savedQuestionsContainer.style.display = 'none';
        welcomeScreen.style.display = 'block';
    }

    // Save wrong answers to local storage
    function saveWrongAnswers() {
        // First load any existing answers that might not be in memory
        const savedWrongAnswers = localStorage.getItem('quizWrongAnswers');
        if (savedWrongAnswers) {
            const savedArray = JSON.parse(savedWrongAnswers);

            // Merge saved answers with current answers, avoiding duplicates
            wrongAnswers.forEach(item => {
                if (!savedArray.some(saved => saved.id === item.id)) {
                    savedArray.push(item);
                }
            });

            // Update the wrongAnswers array with the merged result
            wrongAnswers = savedArray;
        }

        // Save the merged array back to localStorage
        localStorage.setItem('quizWrongAnswers', JSON.stringify(wrongAnswers));
    }

    // Load wrong answers from local storage
    function loadWrongAnswers() {
        const savedWrongAnswers = localStorage.getItem('quizWrongAnswers');
        if (savedWrongAnswers) {
            wrongAnswers = JSON.parse(savedWrongAnswers);
        } else {
            wrongAnswers = [];
        }
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
        } else {
            savedQuestions = [];
        }
    }

    // Add this as a new function
    function updateQuizTypeIndicator() {
        quizTypeIndicator.className = 'quiz-type-indicator';

        if (currentQuizType === 'cityToPlace') {
            quizTypeIndicator.textContent = 'Şehir → Yer Quizi';
            quizTypeIndicator.classList.add('city-to-place');
        } else {
            quizTypeIndicator.textContent = 'Yer → Şehir Quizi';
            quizTypeIndicator.classList.add('place-to-city');
        }
    }
});
