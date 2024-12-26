document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ru', // Устанавливаем русский язык
        firstDay: 1, // Неделя начинается с понедельника
        events: [],
        editable: true,
        eventClick: function (info) {
            showEventModal(info.event, info.event.start, info.event.extendedProps.time);
        },
        buttonText: {
            today: 'сегодня' // Изменяем текст кнопки "today" на "сегодня"
        }
    });
    calendar.render();

    var events = JSON.parse(localStorage.getItem('events')) || [];

    // Функция для форматирования даты
    function formatDate(dateString) {
        var options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    }

    // Функция для форматирования времени
    function formatTime(timeString) {
        if (!timeString) {
            return 'время не указано';
        }
        var options = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' };
        return new Date('1970-01-01T' + timeString + 'Z').toLocaleTimeString('ru-RU', options);
    }

    // Функция для обновления календаря
    function updateCalendar() {
        updateEventColors();
        calendar.removeAllEvents();
        calendar.addEventSource(events);
        localStorage.setItem('events', JSON.stringify(events));
        updateEventLists();
    }

    // Функция для обновления списков мероприятий
    function updateEventLists() {
        var today = new Date().toISOString().split('T')[0];
        var pastEvents = events.filter(event => event.start < today);
        var futureEvents = events.filter(event => event.start >= today);

        document.getElementById('past-events').innerHTML = pastEvents.map(event => `
            <div class="event-item past-event">
                <span>${event.title} - ${formatDate(event.start)} ${formatTime(event.extendedProps.time)}</span>
                <button onclick="showConfirmDeleteModal('${event.start}', '${event.extendedProps.time}')">Удалить</button>
            </div>
        `).join('');

        document.getElementById('future-events').innerHTML = futureEvents.map(event => `
            <div class="event-item">
                <span>${event.title} - ${formatDate(event.start)} ${formatTime(event.extendedProps.time)}</span>
                <button onclick="showConfirmDeleteModal('${event.start}', '${event.extendedProps.time}')">Удалить</button>
            </div>
        `).join('');
    }

    // Функция для удаления мероприятия
    window.deleteEvent = function (date, time) {
        events = events.filter(event => event.start !== date || event.extendedProps.time !== time);
        updateCalendar();
        // Обновляем модальное окно после удаления
        closeAllModals();
    }

    // Функция для обновления цвета событий
    function updateEventColors() {
        var today = new Date().toISOString().split('T')[0];
        events.forEach(event => {
            if (event.start < today) {
                event.backgroundColor = '#dc3545'; // Красный цвет для прошедших событий
            } else {
                event.backgroundColor = '#007bff'; // Синий цвет для предстоящих событий
            }
        });
    }

    // Инициализация календаря с сохраненными мероприятиями
    updateCalendar();

    document.getElementById('event-form').addEventListener('submit', function (event) {
        event.preventDefault();
        var name = document.getElementById('event-name').value;
        var date = document.getElementById('event-date').value;
        var time = document.getElementById('event-time').value;
        var description = document.getElementById('event-description').value;

        var eventData = {
            title: name,
            start: date + (time ? 'T' + time : ''),
            backgroundColor: '#007bff', // Цвет фона для событий
            extendedProps: {
                time: time,
                description: description
            }
        };

        events.push(eventData);
        updateCalendar();

        document.getElementById('event-name').value = '';
        document.getElementById('event-date').value = '';
        document.getElementById('event-time').value = '';
        document.getElementById('event-description').value = '';
    });

    // Функция для открытия/закрытия вкладок
    window.toggleTab = function (evt, tabName) {
        var tabcontent = document.getElementById(tabName);
        var tablinks = evt.currentTarget;

        if (tabcontent.style.display === "block") {
            tabcontent.style.display = "none";
            tablinks.classList.remove("active");
        } else {
            var i, tabcontentArray, tablinksArray;
            tabcontentArray = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontentArray.length; i++) {
                tabcontentArray[i].style.display = "none";
            }
            tablinksArray = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinksArray.length; i++) {
                tablinksArray[i].className = tablinksArray[i].className.replace(" active", "");
            }
            tabcontent.style.display = "block";
            tablinks.className += " active";
        }
    }

    // Функция для отображения модального окна с информацией о мероприятии
    function showEventModal(event, date, time) {
        var modal = document.getElementById("eventModal");
        var eventTitle = document.getElementById("eventTitle");
        var eventDescription = document.getElementById("eventDescription");
        var eventDateTime = document.getElementById("eventDateTime");
        var deleteEventButton = document.getElementById("deleteEventButton");

        eventTitle.textContent = event.title;
        eventDescription.textContent = event.extendedProps.description || "Описание отсутствует";
        eventDateTime.textContent = `Дата и время: ${formatDate(event.start)} ${formatTime(event.extendedProps.time)}`;

        deleteEventButton.onclick = function () {
            showConfirmDeleteModal(date, time);
        };

        modal.style.display = "block";

        var span = modal.querySelector(".close");
        span.onclick = function () {
            closeAllModals();
        }

        window.onclick = function (event) {
            if (event.target == modal) {
                closeAllModals();
            }
        }
    }

    // Функция для закрытия всех модальных окон
    window.closeAllModals = function () {
        var modals = document.getElementsByClassName("modal");
        for (var i = 0; i < modals.length; i++) {
            modals[i].style.display = "none";
        }
        window.onclick = null; // Сбрасываем обработчик события
    }

    // Функция для поиска мероприятий по названию
    function searchEvents() {
        var searchQuery = document.getElementById('search-input').value.toLowerCase();
        var filteredEvents = events.filter(event => event.title.toLowerCase().includes(searchQuery));
        showSearchResults(filteredEvents);
    }

    // Функция для отображения результатов поиска в модальном окне
    function showSearchResults(filteredEvents) {
        var searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = filteredEvents.map(event => `
            <div class="event-item">
                <span>${event.title} - ${formatDate(event.start)} ${formatTime(event.extendedProps.time)}</span>
                <button onclick="showConfirmDeleteModal('${event.start}', '${event.extendedProps.time}')">Удалить</button>
            </div>
        `).join('');

        var searchModal = document.getElementById("searchModal");
        searchModal.style.display = "block";

        var span = searchModal.querySelector(".close");
        span.onclick = function () {
            closeAllModals();
        }

        window.onclick = function (event) {
            if (event.target == searchModal) {
                closeAllModals();
            }
        }
    }

    // Обработчик события для кнопки поиска
    document.getElementById('search-button').addEventListener('click', searchEvents);

    // Обработчик события для поля ввода поиска
    document.getElementById('search-input').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            searchEvents();
        }
    });

    // Функция для отображения модального окна подтверждения удаления
    window.showConfirmDeleteModal = function (date, time) {
        var confirmModal = document.getElementById("confirmDeleteModal");
        confirmModal.style.display = "block";

        var span = confirmModal.querySelector(".close");
        span.onclick = function () {
            closeAllModals();
        }

        window.onclick = function (event) {
            if (event.target == confirmModal) {
                closeAllModals();
            }
        }

        document.getElementById("confirmDeleteButton").onclick = function () {
            deleteEvent(date, time);
            closeAllModals();
        };

        document.getElementById("cancelDeleteButton").onclick = function () {
            closeAllModals();
        };
    }

    // Регистрация сервис-воркера
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js').then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }

    // Добавление кнопки для установки PWA
    let deferredPrompt;
    const installButton = document.createElement('button');
    installButton.id = 'installButton';
    installButton.style.display = 'none';
    installButton.textContent = 'Установить приложение';
    document.body.appendChild(installButton);

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButton.style.display = 'block';
    });

    installButton.addEventListener('click', async () => {
        if (deferredPrompt !== null) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                deferredPrompt = null;
                installButton.style.display = 'none';
            }
        }
    });

    window.addEventListener('appinstalled', (evt) => {
        deferredPrompt = null;
        installButton.style.display = 'none';
    });
});
