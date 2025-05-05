import {
    // Assuming these are the variables defined in your updated map-config.js
    defaultMapCenter,
    defaultMapZoom,
    maxZoom,
    tileLayerUrl,
    tileLayerAttribution,
    defaultRegionStyle,
    highlightRegionStyle, // Optional: for hover effects if added later
    selectedRegionStyle
} from './map-config.js';

// Основные переменные
let map;
let regionsLayer; // Слой для регионов GeoJSON
let selectedRegionLayer = null; // Для хранения выделенного слоя на карте
let allHostelsData = null; // Для хранения загруженных данных хостелов
let currentRegionId = null; // Для хранения ID текущего выбранного региона (для кнопки "назад к списку")
let currentRegionName = null; // Для хранения имени текущего региона

// DOM элементы
let infoPane, initialContent, hostelListContent, hostelDetailContent,
    regionNameEl, hostelListEl, hostelDetailsEl, backButton,
    backToHostelListButton, searchInput, cityItems, adminPanelBtn, adminPanel;

// ----- Функции управления панелями -----

// Функция для отображения начальной панели (поиск + города)
function showInitialPanel() {
    initialContent.style.display = 'flex'; // Используем flex, так как задали в CSS
    hostelListContent.style.display = 'none';
    hostelDetailContent.style.display = 'none';
    backButton.style.display = 'none'; // Основная кнопка "Назад" не нужна здесь
    resetRegionHighlight(); // Сбрасываем выделение региона на карте
    // Плавно возвращаем карту к начальному виду
    map.flyTo(defaultMapCenter, defaultMapZoom, {
        animate: true,
        duration: 1 // Длительность анимации в секундах
    });
    currentRegionId = null; // Сбрасываем текущий регион
    currentRegionName = null;
}

// Функция для отображения панели со списком хостелов
function showHostelListPanel() {
    initialContent.style.display = 'none';
    hostelListContent.style.display = 'flex'; // Используем flex
    hostelDetailContent.style.display = 'none';
    backButton.style.display = 'inline-block'; // Показываем основную кнопку "Назад" (возврат к начальному экрану)
}

// Функция для отображения панели с деталями хостела
function showHostelDetailPanel() {
    initialContent.style.display = 'none';
    hostelListContent.style.display = 'none';
    hostelDetailContent.style.display = 'flex'; // Используем flex
    backButton.style.display = 'inline-block'; // Основная кнопка "Назад" остается видимой
    // Кнопка "Назад к списку" уже должна быть видимой внутри hostelDetailContent
}


// ----- Функции работы с картой -----

// Обработчик для каждой фичи региона на карте
function onEachRegionFeature(feature, layer) {
    // Добавляем всплывающую подсказку с именем региона (берем из свойств GeoJSON)
    const regionName = feature.properties.NAME_RU || feature.properties.NAME_1 || feature.properties.name || 'Регион';
    layer.bindPopup(regionName);

    layer.on({
        click: (e) => {
            currentRegionId = feature.properties.ID; // Сохраняем ID и имя
            currentRegionName = regionName;
            highlightRegion(layer);             // Выделяем регион на карте
            zoomToFeature(e);                   // Зум на регион
            showHostelsForRegion(currentRegionId, currentRegionName); // Показываем хостелы для этого региона
        },
        // Можно добавить реакцию на наведение мыши (mouseover/mouseout) при необходимости
        // mouseover: (e) => layer.setStyle(highlightRegionStyle),
        // mouseout: (e) => { if (selectedRegionLayer !== layer) regionsLayer.resetStyle(layer); }
    });
}

// Зум к выбранному региону
function zoomToFeature(e) {
    // map.fitBounds(e.target.getBounds()); // Резкий зум
    map.flyToBounds(e.target.getBounds(), { // Плавный зум
         animate: true,
         duration: 0.8,
         padding: [30, 30] // Небольшой отступ от краев
    });
}

// Функция выделения региона на карте
function highlightRegion(layer) {
    resetRegionHighlight(); // Сначала сбрасываем предыдущее выделение
    selectedRegionLayer = layer; // Запоминаем текущий слой
    if (layer && typeof layer.setStyle === 'function') {
         layer.setStyle(selectedRegionStyle); // Применяем стиль выделения

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
             if (typeof layer.bringToFront === 'function') {
                  layer.bringToFront(); // Переносим на передний план
             }
        }
    } else {
         console.warn("Не удалось применить стиль к слою:", layer);
    }
}

// Функция сброса выделения региона
function resetRegionHighlight() {
    if (selectedRegionLayer && regionsLayer && typeof regionsLayer.resetStyle === 'function') {
        regionsLayer.resetStyle(selectedRegionLayer); // Сбрасываем стиль для ранее выделенного слоя
    }
    selectedRegionLayer = null;
}

// ----- Функции работы с данными -----

// Показать хостелы для выбранного региона
function showHostelsForRegion(regionId, regionName) {
    if (!allHostelsData) {
        console.error("Данные хостелов не загружены!");
        hostelListEl.innerHTML = '<li>Ошибка загрузки данных хостелов.</li>';
        showHostelListPanel(); // Показываем панель со списком (с ошибкой)
        return;
    }

    regionNameEl.textContent = regionName; // Показываем название региона в панели
    hostelListEl.innerHTML = ''; // Очистка предыдущего списка

    const regionIdStr = String(regionId); // ID в hostels.json может быть строкой или числом

    // Фильтруем хостелы по ID региона
    const filteredHostels = allHostelsData.hostels.filter(hostel => String(hostel.region_id) === regionIdStr);

    if (filteredHostels.length > 0) {
        filteredHostels.forEach(hostel => {
            const li = document.createElement('li');
             // Добавляем data-атрибут для легкого доступа к ID
            li.dataset.hostelId = hostel.id;
             // Используем innerHTML для добавления разметки (иконка + название)
            li.innerHTML = `<i class="fas fa-hotel hostel-icon"></i> <span>${hostel.name}</span>`;
            li.addEventListener('click', () => showHostelDetails(hostel.id)); // Добавляем обработчик клика
            hostelListEl.appendChild(li);
        });
    } else {
        hostelListEl.innerHTML = '<li>В этом регионе общежития (получающие госзаказ) не найдены.</li>';
    }

    showHostelListPanel(); // Показываем панель со списком хостелов
}

// Показать детали хостела
function showHostelDetails(hostelId) {
    if (!allHostelsData) {
        console.error("Данные хостелов не загружены!");
        hostelDetailsEl.innerHTML = '<p>Ошибка загрузки данных хостелов.</p>';
         showHostelDetailPanel();
        return;
    }

    const hostelIdStr = String(hostelId);
    const hostel = allHostelsData.hostels.find(h => String(h.id) === hostelIdStr); // Ищем хостел по ID

    if (hostel) {
        // Формируем HTML для деталей
        // Добавим проверку на наличие данных перед выводом
        hostelDetailsEl.innerHTML = `
            <h3>${hostel.name || 'Название не указано'}</h3>
            ${hostel.address ? `<p><i class="fas fa-map-marker-alt"></i> <strong>Адрес:</strong> ${hostel.address}</p>` : ''}
            ${hostel.phone ? `<p><i class="fas fa-phone"></i> <strong>Телефон:</strong> ${hostel.phone}</p>` : ''}
            ${hostel.capacity !== undefined ? `<p><i class="fas fa-users"></i> <strong>Всего мест:</strong> ${hostel.capacity}</p>` : ''}
            ${hostel.available_spots !== undefined ? `<p><i class="fas fa-bed"></i> <strong>Свободно мест:</strong> ${hostel.available_spots}</p>` : ''}
            ${hostel.price_per_month !== undefined ? `<p><i class="fas fa-dollar-sign"></i> <strong>Цена:</strong> ${hostel.price_per_month} KZT/месяц</p>` : ''}
            ${hostel.description ? `<p><strong>Описание:</strong><br>${hostel.description}</p>` : ''}
            ${hostel.photos && hostel.photos.length > 0 ? '<div class="hostel-gallery"><h4>Фотографии:</h4>...</div>' : ''}
        `;
    } else {
        console.warn(`Хостел с ID ${hostelIdStr} не найден.`);
        hostelDetailsEl.innerHTML = '<p>Информация об общежитии не найдена.</p>';
    }
    showHostelDetailPanel(); // Показываем панель с деталями
}

// ----- Загрузка данных -----

// Функция загрузки GeoJSON регионов
function loadRegionsGeoJSON(url) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            regionsLayer = L.geoJson(data, {
                style: defaultRegionStyle, // Стиль по умолчанию из конфига
                onEachFeature: onEachRegionFeature // Функция обработки для каждого региона
            }).addTo(map);
        })
        .catch(error => {
            console.error('Ошибка загрузки GeoJSON регионов:', error);
            alert("Ошибка загрузки карты регионов. Пожалуйста, обновите страницу.");
        });
}

// Функция загрузки данных хостелов
function loadHostelsData(url) {
    fetch(url)
        .then(response => {
             if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status}`);
             }
             return response.json();
         })
        .then(data => {
            allHostelsData = data; // Сохраняем данные хостелов в глобальную переменную
            console.log("Данные хостелов успешно загружены.");
             // Можно добавить первичную обработку данных если нужно
        })
        .catch(error => {
            console.error('Ошибка загрузки данных хостелов:', error);
             // Можно оповестить пользователя или попытаться загрузить снова
             infoPane.innerHTML = "<p style='color:red;'>Не удалось загрузить информацию об общежитиях. Попробуйте обновить страницу.</p>";
        });
}


// ----- Прочие функции -----

// Переключение видимости админ панели
function toggleAdminPanel() {
    adminPanel.style.display = adminPanel.style.display === 'none' ? 'block' : 'none';
}


// ----- Инициализация приложения -----
document.addEventListener('DOMContentLoaded', function() {
    // Получаем ссылки на DOM элементы
    infoPane = document.getElementById('info-pane');
    initialContent = infoPane.querySelector('.initial-content');
    hostelListContent = document.getElementById('hostel-list-content');
    hostelDetailContent = document.getElementById('hostel-detail-content');
    regionNameEl = document.getElementById('region-name');
    hostelListEl = document.getElementById('hostel-list');
    hostelDetailsEl = document.getElementById('hostel-details');
    backButton = document.getElementById('backButton');
    backToHostelListButton = document.getElementById('backToHostelListButton');
    searchInput = document.getElementById('searchInput');
    cityItems = infoPane.querySelectorAll('.city-item'); // Получаем все элементы городов
    adminPanelBtn = document.getElementById('adminPanelBtn');
    adminPanel = document.getElementById('adminPanel');


    // Проверка наличия всех необходимых элементов
    if (!infoPane || !initialContent || !hostelListContent || !hostelDetailContent || !regionNameEl ||
        !hostelListEl || !hostelDetailsEl || !backButton || !backToHostelListButton || !searchInput ||
        !cityItems || !adminPanelBtn || !adminPanel) {
         console.error("Один или несколько HTML элементов не найдены! Проверьте ID и классы в index.html.");
         return; // Прерываем выполнение, если что-то не найдено
    }


    // Инициализация карты
    map = L.map('map').setView(defaultMapCenter, defaultMapZoom);
    L.tileLayer(tileLayerUrl, {
        maxZoom: maxZoom,
        attribution: tileLayerAttribution
    }).addTo(map);

    // Загрузка данных
    loadHostelsData('data/hostels.json');   // Загружаем хостелы
    loadRegionsGeoJSON('data/kz_1.json');   // Загружаем регионы (kz_1.json)


    // ----- Назначение обработчиков событий -----

    // Клик по основной кнопке "Назад" (возврат к начальной панели)
    backButton.addEventListener('click', showInitialPanel);

    // Клик по кнопке "Назад к списку" в деталях хостела
    backToHostelListButton.addEventListener('click', () => {
         // Возвращаемся к списку хостелов текущего региона
         if (currentRegionId && currentRegionName) {
              // Перегенерируем список для сохраненного региона
              // Это нужно если данные могли измениться, но пока просто показываем панель
               showHostelListPanel();
               // Если нужно обновить список: showHostelsForRegion(currentRegionId, currentRegionName);
         } else {
              // Если регион не сохранен, возвращаемся к начальной панели
              showInitialPanel();
         }
    });

    // Клик по кнопкам городов в начальной панели
    cityItems.forEach(item => {
        item.addEventListener('click', () => {
            const regionId = item.dataset.regionId; // Получаем ID из data-атрибута
            const cityName = item.querySelector('span')?.textContent || 'Город'; // Получаем имя города

            if (regionId && regionsLayer) {
                let targetLayer = null;
                let targetFeature = null;

                // Ищем слой региона на карте по ID
                regionsLayer.eachLayer(layer => {
                    // Сравниваем ID как строки для надежности
                    if (String(layer.feature.properties.ID) === String(regionId)) {
                        targetLayer = layer;
                        targetFeature = layer.feature;
                    }
                });

                if (targetLayer && targetFeature) {
                    currentRegionId = targetFeature.properties.ID; // Сохраняем ID и имя
                    currentRegionName = targetFeature.properties.NAME_RU || cityName;
                    highlightRegion(targetLayer); // Выделяем регион на карте
                    map.flyToBounds(targetLayer.getBounds(), { padding: [30, 30], duration: 0.8 }); // Плавно зумим
                    showHostelsForRegion(currentRegionId, currentRegionName); // Показываем хостелы
                } else {
                    console.warn(`Регион с ID ${regionId} (${cityName}) не найден на слое карты.`);
                    // Если регион не найден на карте, но есть ID,
                    // можно попробовать показать хостелы только по ID
                     currentRegionId = regionId;
                     currentRegionName = cityName;
                     showHostelsForRegion(currentRegionId, currentRegionName);
                     // Можно также попытаться найти координаты в конфиге и отцентрировать карту
                }
            } else if (!regionsLayer) {
                 console.error("Слой регионов еще не загружен.");
            } else {
                 console.warn("Не удалось получить regionId для элемента города:", item);
            }
        });
    });

    // Обработчик ввода в поле поиска (базовый)
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        console.log('Поиск:', searchTerm); // Выводим в консоль для отладки

        // TODO: Реализовать логику фильтрации/поиска
        // Например, фильтрация видимых элементов .city-item или .hostel-list li
        // Или отправка запроса на сервер/фильтрация allHostelsData
    });

    // Клик по кнопке админ панели
    adminPanelBtn.addEventListener('click', toggleAdminPanel);

    // Показываем начальную панель при загрузке
    showInitialPanel();

}); // Конец DOMContentLoaded