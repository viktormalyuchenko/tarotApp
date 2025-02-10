// Загрузка данных о картах
async function loadCardData() {
    try {
        const response = await fetch('data/cards.json');
        if (!response.ok) {
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
    document.getElementById('loading-indicator').style.display = 'block';
    loadCardData().then(data => {
        cardData = data;
        document.getElementById('loading-indicator').style.display = 'none';

        if (cardData) {
            restoreReading(); // Пытаемся восстановить расклад при загрузке
            showTab('tarot'); // Показываем вкладку "Гадание Таро" по умолчанию
            displayCardOfTheDay(); // Отображаем карту дня
        }

    }).catch(error => {
        document.getElementById('loading-indicator').style.display = 'none';
        // Сообщение об ошибке уже выводится
    });


    // Обработчики для кнопок вкладок
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
             //Перед переключением сохраняем, если текущая вкладка tarot
            if(document.querySelector('.tab-button.active').dataset.tab === "tarot"){
              saveReading();
            }
            showTab(tabId);

        });
    });

      // Запускаем функцию для гадания по часам и ставим интервал
    checkTimeDivination();
    setInterval(checkTimeDivination, 60000);

    //Навешиваем обработчики сразу, а не в функциях
    const timeDivinationButton = document.getElementById('time-divination-button');
    if (timeDivinationButton) {
        timeDivinationButton.addEventListener('click', checkTimeDivination);
    }

    const timeInput = document.getElementById('time-input');
    if (timeInput) {
        timeInput.addEventListener('input', (event) => {
            let value = event.target.value;

            // Удаляем все не-цифры
            value = value.replace(/\D/g, '');

            // Ограничиваем длину 4 цифрами
            value = value.substring(0, 4);

            // Добавляем двоеточие
            if (value.length > 2) {
                value = value.substring(0, 2) + ':' + value.substring(2);
            }

            // Обновляем значение поля
            event.target.value = value;
        });
        timeInput.addEventListener('change', checkTimeDivination);
    }
    //Для таро тоже
    document.getElementById('draw-cards').addEventListener('click', handleDrawCards);
    document.getElementById('generate-question').addEventListener('click', generateRandomQuestion);

});

// Функция для показа/скрытия вкладок
function showTab(tabId) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tabContent => {
        tabContent.classList.remove('active');
    });

    // Убираем класс active у всех кнопок
     document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Показываем нужную вкладку
    document.getElementById(`${tabId}-tab`).classList.add('active');

    // Добавляем класс active к соответствующей кнопке
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');

    //Особый случай для карты дня
    if(tabId === "cotd" && cardData){
        displayCardOfTheDay();
    }
    //Для таро тоже особый случай
    if(tabId === "tarot" && cardData){
      restoreReading(); // Восстанавливаем при переключении
      shuffleDeck();  // "Перемешиваем" карты
    }
      //Добавил скролл к элементу
    const content = document.getElementById('content');
    if (content) {
      content.scrollIntoView({ behavior: 'smooth' });
    }
}

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

//  измененная функция showCardInterpretation
function showCardInterpretation(cardIndex, isReversed, position, spreadType) {
    const interpretationDiv = document.getElementById('interpretation');
    interpretationDiv.innerHTML = '';

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
      title = `<h3>${positions[position]}: ${card.name}</h3>`;
    } else if (spreadType === "celtic-cross") {
      const positions = [
        "Настоящее", "Препятствие", "Основа", "Прошлое",
        "Возможности", "Будущее", "Внутреннее состояние", "Внешние влияния", "Надежды и страхи", "Исход"
      ];
      title = `<h3>${positions[position]}: ${card.name}</h3>`;
    }

    cardInterpretationDiv.innerHTML = title;

      //  Получаем толкование в зависимости от положения карты
    const meanings = isReversed ? card.meanings.reversed : card.meanings.upright;

      //  Определяем выбранную сферу
    const selectedSphere = document.getElementById('sphere-select').value;


      //  Выводим общее значение
    if (meanings.general) {
      cardInterpretationDiv.innerHTML += `<h4>Общее значение:</h4><p>${meanings.general}</p>`;
    }

      //  Выводим значение для выбранной сферы
      // Добавили проверку, что сфера не general, чтобы не выводить дважды
    if (meanings[selectedSphere] && selectedSphere !== 'general') {
      cardInterpretationDiv.innerHTML += `<h4>${getSphereLabel(selectedSphere)}:</h4><p>${meanings[selectedSphere]}</p>`;
    }

      //  Выводим ключевые слова (красиво оформленные)
    if (meanings.keywords && meanings.keywords.length > 0) {
      cardInterpretationDiv.innerHTML += `<h4>Ключевые слова:</h4><ul>`;
      meanings.keywords.forEach(keyword => {
        cardInterpretationDiv.innerHTML += `<li>${keyword}</li>`;
      });
      cardInterpretationDiv.innerHTML += `</ul>`;
    }

      //  Выводим совет, предостережение и аффирмацию
    if (meanings.advice) {
      cardInterpretationDiv.innerHTML += `<h4>Совет:</h4><p>${meanings.advice}</p>`;
    }
    if (meanings.warning) {
      cardInterpretationDiv.innerHTML += `<h4>Предостережение:</h4><p>${meanings.warning}</p>`;
    }
    if (meanings.affirmation) {
      cardInterpretationDiv.innerHTML += `<h4>Аффирмация:</h4><p>${meanings.affirmation}</p>`;
    }

    interpretationDiv.appendChild(cardInterpretationDiv);
    // interpretationDiv.scrollIntoView({ behavior: 'smooth' }); //Убрал, теперь скролл в showTab
  }

// Вспомогательная функция для получения заголовков
function getSphereLabel(sphere) {
    switch (sphere) {
      case 'love': return 'Любовь и отношения';
      case 'work': return 'Работа и карьера';
      case 'finance': return 'Финансы';
      case 'health': return 'Здоровье';
      case 'spirituality': return 'Духовность';
      default: return ''; //  Не должно произойти, но на всякий случай
    }
}

// Функция "перемешивания" колоды
function shuffleDeck() {
    const cardsContainer = document.getElementById('cards-container');
    if(!cardsContainer) return;  //Если не страница с гаданием
    cardsContainer.innerHTML = '';

    for (let i = 0; i < 15; i++) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        const randomCardBack = Math.floor(Math.random() * 3);
        cardDiv.style.backgroundImage = `url(images/back${randomCardBack}.jpg)`;
        cardDiv.style.animation = `shuffle 0.2s ease-in-out ${i * 0.03}s`;
        cardsContainer.appendChild(cardDiv);
    }
}

// Обработчик нажатия кнопки "Тянуть карты"
const handleDrawCards = () => {
    const spreadType = document.getElementById('spread-type').value;
    const sphere = document.getElementById('sphere-select').value; // Получаем сферу
    let numCards = 1;

    if (spreadType === 'three-card') {
        numCards = 3;
    } else if (spreadType === 'celtic-cross') {
        numCards = 10;
    }

    const cardIndices = getRandomCards(numCards);

    shuffleDeck();

    setTimeout(() => {
        displayCards(cardIndices, spreadType);
        document.getElementById('interpretation').innerHTML = '';

        // Показываем блок #reading-result
        document.getElementById('reading-result').style.display = 'block'; //  Или 'flex'

        //Сохраняем расклад
        saveReading(cardIndices, spreadType, sphere);

    }, 1000);
};


// --- КАРТА ДНЯ ---

function displayCardOfTheDay() {
    const cotdContainer = document.getElementById('cotd-container');
    const cotdInterpretation = document.getElementById('cotd-interpretation');
    cotdContainer.innerHTML = '';
    cotdInterpretation.innerHTML = '';

    if (!cardData) {
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toDateString();

    let cardOfTheDayIndex;
    let isReversed;

    if (localStorage.getItem('cardOfTheDayDate') === todayStr) {
        cardOfTheDayIndex = parseInt(localStorage.getItem('cardOfTheDayIndex'));
        isReversed = localStorage.getItem('cardOfTheDayIsReversed') === 'true';
    } else {
        cardOfTheDayIndex = Math.floor(Math.random() * 78);
        isReversed = Math.random() < 0.3;
        localStorage.setItem('cardOfTheDayDate', todayStr);
        localStorage.setItem('cardOfTheDayIndex', cardOfTheDayIndex);
        localStorage.setItem('cardOfTheDayIsReversed', isReversed);
    }

    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    cardDiv.style.backgroundImage = `url(images/${cardOfTheDayIndex}.jpg)`;
    if (isReversed) {
        cardDiv.classList.add('reversed');
    }
    cotdContainer.appendChild(cardDiv);

    // Добавляем НОВЫЙ обработчик клика, который НЕ скроллит
    cardDiv.addEventListener('click', () => {
        showCardOfTheDayInterpretation(cardOfTheDayIndex, isReversed);
    });
}
//  функция для отображения толкования карты дня (без прокрутки)
function showCardOfTheDayInterpretation(cardIndex, isReversed) {
    const cotdInterpretation = document.getElementById('cotd-interpretation');
    cotdInterpretation.innerHTML = ''; //Очищаем

    if (!cardData) {
        cotdInterpretation.innerHTML = '<p>Ошибка: данные о картах не загружены.</p>';
        return;
    }

    const card = cardData[cardIndex];
    const cardInterpretationDiv = document.createElement('div');
    cardInterpretationDiv.classList.add('card-interpretation');

    let title = `<h3>${card.name}</h3>`;
    cardInterpretationDiv.innerHTML = title;

    //  Добавляем толкование!
    const meanings = isReversed ? card.meanings.reversed : card.meanings.upright;

     // Добавляем разделы с заголовками
    if (meanings.general) {
        cardInterpretationDiv.innerHTML += `<h4>Общее значение:</h4><p>${meanings.general}</p>`;
    }
    if (meanings.love) {
        cardInterpretationDiv.innerHTML += `<h4>Любовь и отношения:</h4><p>${meanings.love}</p>`;
    }
    if (meanings.work) {
        cardInterpretationDiv.innerHTML += `<h4>Работа и карьера:</h4><p>${meanings.work}</p>`;
    }
    if (meanings.finance) {
        cardInterpretationDiv.innerHTML += `<h4>Финансы:</h4><p>${meanings.finance}</p>`;
    }
    if (meanings.health) {
        cardInterpretationDiv.innerHTML += `<h4>Здоровье:</h4><p>${meanings.health}</p>`;
     }
        if (meanings.spirituality) {
        cardInterpretationDiv.innerHTML += `<h4>Духовность:</h4><p>${meanings.spirituality}</p>`;
    }

    if (meanings.keywords && meanings.keywords.length > 0) {
        cardInterpretationDiv.innerHTML += `<h4>Ключевые слова:</h4><ul>`;
        meanings.keywords.forEach(keyword => {
            cardInterpretationDiv.innerHTML += `<li>${keyword}</li>`;
        });
        cardInterpretationDiv.innerHTML += `</ul>`;
    }

    if (meanings.advice) {
        cardInterpretationDiv.innerHTML += `<h4>Совет:</h4><p>${meanings.advice}</p>`;
    }
    if (meanings.warning) {
        cardInterpretationDiv.innerHTML += `<h4>Предостережение:</h4><p>${meanings.warning}</p>`;
    }
    if (meanings.affirmation) {
        cardInterpretationDiv.innerHTML += `<h4>Аффирмация:</h4><p>${meanings.affirmation}</p>`;
     }
    cotdInterpretation.appendChild(cardInterpretationDiv); // Добавляем в cotdInterpretation

}

// --- СЛУЧАЙНЫЙ ВОПРОС --- (Этот функционал можно убрать)
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


// --- ГАДАНИЕ ПО ЧАСАМ ---

const hourDivination = {
    "00:00": "Загадайте желание – оно сбудется!",
    "01:01": "Ждите хороших новостей от мужчины.",
    "01:10": "Ваши мысли и желания скоро материализуются.", // Зеркальная
    "02:02": "Вас пригласят на свидание или вечеринку.",
    "02:20": "Будьте внимательны к своим словам и действиям.", // Зеркальная
    "03:03": "Признание в любви, романтическое приключение.",
    "03:30": "Ваши мечты сбудутся, если вы будете действовать.", // Зеркальная
    "04:04": "Посмотрите на ситуацию с другой стороны.",
    "04:40": "Сегодня не ваш день для риска.", // Зеркальная
    "05:05": "Ваши враги замышляют недоброе.",
    "05:50": "Неожиданная удача, приятный сюрприз.",      // Зеркальная
    "06:06": "Скорое замужество/женитьба.",
    "07:07": "Остерегайтесь человека в форме.",
    "08:08": "Успех в карьере, повышение.",
    "09:09": "Будьте осторожны с деньгами и ценными вещами.",
    "10:01": "Знакомство с влиятельным человеком.", // Зеркальная
    "10:10": "Наступает время перемен.",
    "11:11": "Успех в делах, исполнение желаний.",
    "12:12": "Гармония в любви, удачный союз.",
    "12:21": "Встреча, которая изменит вашу жизнь.",       // Зеркальная
    "13:13": "Остерегайтесь соперников.",
    "13:31": "Получите то, о чем давно мечтали.",       // Зеркальная
    "14:14": "Вам повезет в любви.",
    "14:41": "Неприятности, будьте осторожны.",        // Зеркальная
    "15:15": "Прислушайтесь к совету мудрого человека.",
    "15:51": "Бурный, но короткий роман.",             // Зеркальная
    "16:16": "Будьте осторожны в дороге.",
    "17:17": "Избегайте конфликтов на улице.",
    "18:18": "Неожиданный поворот событий.",
    "19:19": "Успех во всех начинаниях.",
    "20:02": "Гармония в отношениях, взаимопонимание.",  // Добавили 20:02
    "20:20": "Важные новости, будьте внимательны.",       // Зеркальная
    "21:12": "Рождение ребенка или нового проекта.",    // Зеркальная
    "21:21": "Страстный роман, новое знакомство.",
    "22:22": "Судьбоносная встреча, важный поворот в жизни.",
    "23:23": "Опасная связь, будьте осторожны.",
    "23:32": "Проблемы со здоровьем, обратите внимание.",    // Зеркальная
};

function checkTimeDivination() {
    const timeInput = document.getElementById('time-input');
    const hourDivinationDiv = document.getElementById('hour-divination');

    if (!timeInput || !hourDivinationDiv) {
        return;
    }

    let timeStr = timeInput.value;

    // Дополнительная валидация (на случай, если pattern не сработает)
    if (!/^(?:[01]\d|2[0-3]):?[0-5]\d$/.test(timeStr)) {
        hourDivinationDiv.textContent = "Введите время в формате ЧЧ:ММ или ЧЧММ (24-часовой формат).";
        return;
    }

    //Убираем ведущие нули из часов для корректного поиска в hourDivination
     const [hours, minutes] = timeStr.split(":");
     timeStr = `${parseInt(hours, 10)}:${minutes}`;
     timeStr = timeStr.padStart(5,'0'); //Добавляем обратно нули

    const divinationText = hourDivination[timeStr];

    if (divinationText) {
        hourDivinationDiv.textContent = divinationText;
    } else {
        hourDivinationDiv.textContent = "Для этого времени нет толкования.";
    }
}

// --- Функции для сохранения и восстановления расклада ---

function saveReading(cardIndices, spreadType, sphere) {
  if(!cardIndices) return; //Если не передали карты, то выходим
    const readingData = {
        cardIndices: cardIndices,
        spreadType: spreadType,
        sphere: sphere,
        timestamp: Date.now() //  Добавляем метку времени (для возможной очистки старых данных)
    };
    localStorage.setItem('tarotReading', JSON.stringify(readingData));
}

function restoreReading() {
    const readingDataString = localStorage.getItem('tarotReading');
    if (readingDataString) {
        const readingData = JSON.parse(readingDataString);

        // Проверяем, что данные не устарели (например, прошло не больше суток)
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
        if (now - readingData.timestamp < maxAge) {
             // Восстанавливаем расклад
            displayCards(readingData.cardIndices, readingData.spreadType);
            showCardInterpretation(readingData.cardIndices[0], false, 0, readingData.spreadType); //Вызываем для первой карты
             // Т.к. у нас обработчик на клик, то выводим толкование первой карты.
             //  Можно сделать иначе

            // Устанавливаем выбранный расклад
            document.getElementById('spread-type').value = readingData.spreadType;

            // Устанавливаем выбранную сферу
            document.getElementById('sphere-select').value = readingData.sphere;
            // Показываем блок
            document.getElementById('reading-result').style.display = 'block';
        } else {
            // Данные устарели, удаляем их
            localStorage.removeItem('tarotReading');
        }
    }
}