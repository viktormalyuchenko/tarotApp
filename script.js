// Загрузка данных о картах
async function loadCardData() {
    try {
        const response = await fetch('data/cards.json');
        if (!response.ok) { // Проверяем HTTP-статус
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка загрузки данных о картах:', error);
        document.getElementById('error-message').textContent = `Произошла ошибка при загрузке данных карт: ${error.message}`;
        document.getElementById('error-message').style.display = 'block';
        return null;
    }
}

let cardData;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loading-indicator').style.display = 'block'; // Показываем индикатор
    loadCardData().then(data => {
        cardData = data;
        document.getElementById('loading-indicator').style.display = 'none';// Скрываем

        if (cardData) {
            shuffleDeck();
            displayCardOfTheDay(); // Добавляем вызов функции
        }
    }).catch(error => { // Добавили .catch для обработки ошибок
        document.getElementById('loading-indicator').style.display = 'none';
        //Сообщение об ошибке уже выводится в loadCardData, поэтому здесь ничего не делаем
    });
});
// Функция случайного выбора карт
function getRandomCards(numCards) {
    const shuffledCards = [];
    const deck = Array.from({ length: 78 }, (_, i) => i);

    for (let i = 0; i < numCards; i++) {
        const randomIndex = Math.floor(Math.random() * deck.length);
        shuffledCards.push(deck.splice(randomIndex, 1)[0]);
    }
    return shuffledCards;
}

// Функция отображения карт (с задержкой)
function displayCards(cardIndices, spreadType) {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = ''; // Очищаем

    cardIndices.forEach((cardIndex, position) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.style.backgroundImage = `url(images/${cardIndex}.jpg)`;
        cardDiv.style.animationDelay = `${position * 0.2}s`; // Добавляем задержку

        const isReversed = Math.random() < 0.3;
        if (isReversed) {
            cardDiv.classList.add('reversed');
        }
        cardDiv.addEventListener('click', () => showCardInterpretation(cardIndex, isReversed, position, spreadType));
        cardsContainer.appendChild(cardDiv);
    });
}

// Функция отображения толкования
function showCardInterpretation(cardIndex, isReversed, position, spreadType) {
    const interpretationDiv = document.getElementById('interpretation');
    interpretationDiv.innerHTML = ''; //Очищаем

    if (!cardData) {
        interpretationDiv.innerHTML = '<p>Ошибка: данные о картах не загружены.</p>';
        return;
    }

    const card = cardData[cardIndex];
    const cardInterpretationDiv = document.createElement('div');
    cardInterpretationDiv.classList.add('card-interpretation');

    let title = `<h3>${card.name}</h3>`;
    if (spreadType === 'three-card') {
      const positions = ['Прошлое', 'Настоящее', 'Будущее'];
      title = `<h3>${positions[position]}: ${card.name}</h3>`
    }
    else if(spreadType === "celtic-cross"){
      const positions = [
        "Настоящее", "Препятствие", "Основа", "Прошлое",
        "Возможности", "Будущее", "Внутреннее состояние", "Внешние влияния", "Надежды и страхи", "Исход"
      ];
      title = `<h3>${positions[position]}: ${card.name}</h3>`;
    }

    cardInterpretationDiv.innerHTML = title;
    const meaning = isReversed ? card.meanings.reversed : card.meanings.upright;
    cardInterpretationDiv.innerHTML += `<p>${meaning}</p>`;
    interpretationDiv.appendChild(cardInterpretationDiv);

     // Добавляем плавную прокрутку
     interpretationDiv.scrollIntoView({ behavior: 'smooth' });
}

// Функция "перемешивания" колоды
function shuffleDeck() {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = ''; // Очищаем

    for (let i = 0; i < 15; i++) { // Увеличим количество "карт"
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        const randomCardBack = Math.floor(Math.random() * 3);
        cardDiv.style.backgroundImage = `url(images/back${randomCardBack}.jpg)`;

        // Увеличиваем задержку и делаем анимацию чуть дольше
        cardDiv.style.animation = `shuffle 0.2s ease-in-out ${i * 0.03}s`;
        cardsContainer.appendChild(cardDiv);
    }
}

// Обработчик нажатия кнопки
document.getElementById('draw-cards').addEventListener('click', () => {
    const spreadType = document.getElementById('spread-type').value;
    const question = document.getElementById('question').value;
    let numCards = 1;

    if (spreadType === 'three-card') {
        numCards = 3;
    } else if (spreadType === 'celtic-cross') {
        numCards = 10;
    }

    const cardIndices = getRandomCards(numCards);

    shuffleDeck(); // "Перемешиваем"

     // Увеличиваем задержку, чтобы анимация перемешивания успела завершиться
     setTimeout(() => {
        displayCards(cardIndices, spreadType);
        document.getElementById('interpretation').innerHTML = '';

        if (question) {
            const questionDiv = document.createElement('div');
            questionDiv.innerHTML = `<h3>Ваш вопрос:</h3><p>${question}</p>`;
            document.getElementById('interpretation').prepend(questionDiv);
        }
    }, 1000); // 1 секунда
});

// Обновление года в подвале
document.getElementById('current-year').textContent = new Date().getFullYear();

//Функция карты дня
function displayCardOfTheDay() {
    const cotdContainer = document.getElementById('cotd-container');
    const cotdInterpretation = document.getElementById('cotd-interpretation');
    cotdContainer.innerHTML = ''; // Очищаем
    cotdInterpretation.innerHTML = '';

    if (!cardData) {
        return; // Если данные карт не загружены, ничего не делаем
    }

    // Получаем текущую дату (без времени)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Обнуляем время
    const todayStr = today.toDateString(); // Получаем строку вида "Tue Oct 29 2024"

    let cardOfTheDayIndex;
    let isReversed;

    // Проверяем, есть ли карта дня в localStorage
    if (localStorage.getItem('cardOfTheDayDate') === todayStr) {
        cardOfTheDayIndex = parseInt(localStorage.getItem('cardOfTheDayIndex'));
        isReversed = localStorage.getItem('cardOfTheDayIsReversed') === 'true';
    } else {
        // Если нет, выбираем случайную карту
        cardOfTheDayIndex = Math.floor(Math.random() * 78);
        isReversed = Math.random() < 0.3;

        // Сохраняем в localStorage
        localStorage.setItem('cardOfTheDayDate', todayStr);
        localStorage.setItem('cardOfTheDayIndex', cardOfTheDayIndex);
        localStorage.setItem('cardOfTheDayIsReversed', isReversed);
    }

    // Отображаем карту
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    cardDiv.style.backgroundImage = `url(images/${cardOfTheDayIndex}.jpg)`;
    if (isReversed) {
        cardDiv.classList.add('reversed');
    }
    cotdContainer.appendChild(cardDiv);

    // Отображаем толкование
    const card = cardData[cardOfTheDayIndex];
    const meaning = isReversed ? card.meanings.reversed : card.meanings.upright;

    cotdInterpretation.innerHTML = `
        <h3>${card.name}</h3>
        <p>${meaning}</p>
    `;
     // Добавляем обработчик, чтобы при клике показывалось тоже толкование, как и в раскладах
    cardDiv.addEventListener('click', () => showCardInterpretation(cardOfTheDayIndex, isReversed, 0, 'one-card'));
}

//Генератор случайных вопросов
const questions = [
    "Что меня ждет в ближайшем будущем?",
    "Каковы мои сильные стороны?",
    "На что мне следует обратить внимание в отношениях?",
    "Как мне улучшить свое финансовое положение?",
    "Какой урок мне нужно извлечь из текущей ситуации?",
    "В каком направлении мне двигаться дальше?",
    "Что мешает моему успеху?",
    "Как мне обрести внутренний покой?",
    "Каков мой скрытый потенциал?",
    "Что мне нужно изменить в себе?",
    "Какова моя миссия в жизни?",
    "Как мне найти свою любовь?",
    "Что мне нужно сделать, чтобы достичь своей цели?",
    "Какое препятствие мне нужно преодолеть?",
    "Как мне улучшить свое здоровье?",
];

function generateRandomQuestion() {
    const randomIndex = Math.floor(Math.random() * questions.length);
    document.getElementById('question').value = questions[randomIndex];
}

document.getElementById('generate-question').addEventListener('click', generateRandomQuestion);