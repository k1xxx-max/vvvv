// Админ-промокод
const ADMIN_PROMO = "admin123";

// Данные номеров с странами
let phoneNumbers = [];

// История покупок
let purchaseHistory = [];

let currentCountryFilter = 'all';
let isAdmin = false;
let currentPayment = null;
let paymentTimer = null;

// Загрузка приложения
window.addEventListener('load', function() {
    setTimeout(function() {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        loadPhoneNumbers();
        updatePurchaseHistory();
    }, 3000);
});

// Переключение фильтра стран
function toggleCountryFilter() {
    const dropdown = document.getElementById('countryDropdown');
    const arrow = document.getElementById('filterArrow');
    
    dropdown.classList.toggle('show');
    arrow.classList.toggle('fa-chevron-down');
    arrow.classList.toggle('fa-chevron-up');
}

// Выбор страны
document.querySelectorAll('.country-option').forEach(option => {
    option.addEventListener('click', function() {
        const country = this.getAttribute('data-country');
        
        // Обновляем активный класс
        document.querySelectorAll('.country-option').forEach(opt => {
            opt.classList.remove('active');
        });
        this.classList.add('active');
        
        // Обновляем текст фильтра
        const filterText = document.getElementById('filterText');
        filterText.textContent = this.querySelector('span').textContent;
        
        // Применяем фильтр
        currentCountryFilter = country;
        loadPhoneNumbers();
        
        // Закрываем dropdown
        document.getElementById('countryDropdown').classList.remove('show');
        document.getElementById('filterArrow').classList.add('fa-chevron-down');
        document.getElementById('filterArrow').classList.remove('fa-chevron-up');
    });
});

// Загрузка номеров с фильтром
function loadPhoneNumbers() {
    const productsContainer = document.getElementById('productsContainer');
    productsContainer.innerHTML = '';

    const filteredNumbers = phoneNumbers.filter(phone => {
        if (currentCountryFilter === 'all') return true;
        return phone.country === currentCountryFilter;
    });

    if (filteredNumbers.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-numbers">
                <i class="fas fa-phone-slash"></i>
                <p>Номера скоро появятся</p>
            </div>
        `;
        return;
    }

    filteredNumbers.forEach((phone, index) => {
        const originalIndex = phoneNumbers.findIndex(p => p.number === phone.number);
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-header">
                <span class="phone-number">${phone.number}</span>
                <span class="price">${phone.price} ₽</span>
            </div>
            <div class="product-status">
                <span class="status">${phone.available ? 'В наличии' : 'Продано'}</span>
                <button class="buy-btn" ${!phone.available ? 'disabled' : ''} 
                        onclick="startPayment(${originalIndex})">
                    ${phone.available ? 'Купить' : 'Продано'}
                </button>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
}

// Начало оплаты
function startPayment(index) {
    const phone = phoneNumbers[index];
    
    if (!phone.available) {
        showNotification('Этот номер уже продан!', 'error');
        return;
    }

    currentPayment = {
        index: index,
        phone: phone.number,
        price: phone.price,
        startTime: Date.now()
    };

    // Генерируем ссылку для оплаты через @CryptoBot
    const cryptoAmount = (phone.price * 0.015).toFixed(2); // Примерный курс USDT к рублю
    const paymentLink = `https://t.me/CryptoBot?start=invoice_${generateRandomId()}`;
    
    // Заполняем модальное окно
    document.getElementById('paymentPhone').textContent = phone.number;
    document.getElementById('paymentAmount').textContent = phone.price;
    document.getElementById('cryptoAmount').textContent = cryptoAmount;
    document.getElementById('paymentLink').href = paymentLink;

    // Запускаем таймер
    startPaymentTimer();

    // Показываем модальное окно
    document.getElementById('paymentModal').classList.remove('hidden');
}

// Генерация случайного ID для инвойса
function generateRandomId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Закрытие модального окна оплаты
function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
    stopPaymentTimer();
    currentPayment = null;
}

// Таймер оплаты
function startPaymentTimer() {
    let timeLeft = 15 * 60; // 15 минут в секундах
    
    paymentTimer = setInterval(() => {
        timeLeft--;
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        document.getElementById('paymentTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            stopPaymentTimer();
            showNotification('Время оплаты истекло!', 'error');
            closePaymentModal();
        }
    }, 1000);
}

function stopPaymentTimer() {
    if (paymentTimer) {
        clearInterval(paymentTimer);
        paymentTimer = null;
    }
}

// Подтверждение оплаты
function confirmPayment() {
    if (!currentPayment) return;

    // Симуляция проверки оплаты
    showNotification('Проверяем оплату в системе...', 'info');
    
    setTimeout(() => {
        // В 50% случаев симулируем успешную оплату, в 50% - ожидание
        if (Math.random() > 0.5) {
            completePayment();
        } else {
            showNotification('Оплата еще не поступила. Попробуйте через 30 секунд.', 'info');
        }
    }, 3000);
}

// Завершение оплаты
function completePayment() {
    if (!currentPayment) return;

    const phoneIndex = currentPayment.index;
    
    // Помечаем номер как проданный
    phoneNumbers[phoneIndex].available = false;
    
    // Добавляем в историю покупок
    purchaseHistory.unshift({
        number: currentPayment.phone,
        price: currentPayment.price,
        date: new Date().toLocaleDateString('ru-RU')
    });
    
    // Обновляем интерфейс
    loadPhoneNumbers();
    updatePurchaseHistory();
    
    // Закрываем модальное окно
    closePaymentModal();
    
    // Показываем уведомление
    showNotification('Оплата подтверждена! Номер выдан.', 'success');
}

// Уведомления
function showNotification(message, type = 'info') {
    // Удаляем предыдущее уведомление
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Обновление истории покупок
function updatePurchaseHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    if (purchaseHistory.length === 0) {
        historyList.innerHTML = '<div style="color: #666; text-align: center; padding: 2rem;">Покупок пока нет</div>';
        return;
    }

    purchaseHistory.forEach(purchase => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div>
                <div class="history-phone">${purchase.number}</div>
                <div class="history-date">${purchase.date}</div>
            </div>
            <div class="history-price">${purchase.price} ₽</div>
        `;
        historyList.appendChild(historyItem);
    });
}

// Проверка промокода
function checkPromoCode() {
    const promoInput = document.getElementById('promoCode');
    const promoValue = promoInput.value.trim();
    
    if (promoValue === ADMIN_PROMO) {
        isAdmin = true;
        document.getElementById('adminPanelBtn').classList.remove('hidden');
        promoInput.value = '';
        showAdminPanel();
        showNotification('Промокод активирован! Открыта панель управления.', 'success');
    } else {
        showNotification('Неверный промокод!', 'error');
    }
}

// Админ-панель
function showAdminPanel() {
    document.getElementById('adminPanel').classList.remove('hidden');
    loadAdminNumbersList();
}

function closeAdminPanel() {
    document.getElementById('adminPanel').classList.add('hidden');
}

// Переключение вкладок админки
function showAdminTab(tabId) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Добавление номеров
function addNumbers() {
    const country = document.getElementById('countrySelect').value;
    const numbersText = document.getElementById('numbersInput').value;
    const price = parseInt(document.getElementById('priceInput').value);

    if (!numbersText.trim()) {
        showNotification('Введите номера!', 'error');
        return;
    }

    const numbersArray = numbersText.split('\n')
        .map(num => num.trim())
        .filter(num => num.length > 0);

    numbersArray.forEach(number => {
        phoneNumbers.unshift({
            number: number,
            price: price,
            available: true,
            country: country
        });
    });

    // Очищаем поле ввода
    document.getElementById('numbersInput').value = '';
    
    // Обновляем списки
    loadPhoneNumbers();
    loadAdminNumbersList();
    
    showNotification(`Добавлено ${numbersArray.length} номеров!`, 'success');
}

// Загрузка списка номеров в админке
function loadAdminNumbersList() {
    const listContainer = document.getElementById('adminNumbersList');
    listContainer.innerHTML = '';

    if (phoneNumbers.length === 0) {
        listContainer.innerHTML = '<div style="color: #666; text-align: center; padding: 2rem;">Номера не добавлены</div>';
        return;
    }

    phoneNumbers.forEach((phone, index) => {
        const numberItem = document.createElement('div');
        numberItem.className = 'admin-number-item';
        numberItem.innerHTML = `
            <div class="number-info">
                <span class="number-phone">${phone.number}</span>
                <span class="number-meta">
                    ${getCountryName(phone.country)} • ${phone.price} ₽ • 
                    ${phone.available ? 'В наличии' : 'Продано'}
                </span>
            </div>
            <div class="number-actions">
                <button class="action-btn toggle" onclick="toggleNumberAvailability(${index})">
                    ${phone.available ? 'Продать' : 'Вернуть'}
                </button>
                <button class="action-btn delete" onclick="deleteNumber(${index})">
                    Удалить
                </button>
            </div>
        `;
        listContainer.appendChild(numberItem);
    });
}

// Вспомогательные функции
function getCountryName(code) {
    const countries = {
        'ru': 'Россия',
        'ua': 'Украина', 
        'kz': 'Казахстан',
        'by': 'Беларусь'
    };
    return countries[code] || code;
}

function toggleNumberAvailability(index) {
    phoneNumbers[index].available = !phoneNumbers[index].available;
    loadPhoneNumbers();
    loadAdminNumbersList();
    showNotification('Статус номера изменен!', 'success');
}

function deleteNumber(index) {
    if (confirm('Удалить этот номер?')) {
        phoneNumbers.splice(index, 1);
        loadPhoneNumbers();
        loadAdminNumbersList();
        showNotification('Номер удален!', 'success');
    }
}

// Переключение страниц
function showPage(pageId) {
    // Скрыть все страницы
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Показать выбранную страницу
    document.getElementById(pageId).classList.add('active');
    
    // Обновить активную кнопку навигации
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Найти и активировать соответствующую кнопку
    const navButtons = document.querySelectorAll('.nav-btn');
    const pageIndex = Array.from(document.querySelectorAll('.page')).findIndex(page => page.id === pageId);
    if (navButtons[pageIndex]) {
        navButtons[pageIndex].classList.add('active');
    }
}

// Копирование реферальной ссылки
function copyRefLink() {
    const link = document.getElementById('ref-link').textContent;
    navigator.clipboard.writeText(link).then(() => {
        showNotification('Ссылка скопирована!', 'success');
    });
}

// Контакт с поддержкой
function contactSupport() {
    showNotification('Для связи: @maloy_support в Telegram', 'info');
}

// Показать FAQ
function showFAQ() {
    showNotification('FAQ: 1. Оплата - USDT 2. Выдача - автоматически 3. Гарантии - 100%', 'info');
}