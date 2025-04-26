// Импорт конфигурации
import {
    regionNamesMapping,
    regionsData,
    cityCoordinates,
    defaultMapCenter,
    defaultMapZoom
} from './map-config.js';

// Основные переменные
let map;
let currentLayer;
let isZoomed = false;
let currentRegion = null;
let currentCity = null;
let previousZoom = defaultMapZoom;
let previousCenter = defaultMapCenter;
let previousLayerStyle = null;
let cityMarkers = [];

// Функции
function getRussianRegionName(feature) {
    const latinName = feature.properties?.NAME_1 || feature.properties?.name || '';
    return regionNamesMapping[latinName] || latinName;
}

function loadGeoJSON(url, clickHandler) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (currentLayer) {
                map.removeLayer(currentLayer);
                clearCityMarkers();
            }
            
            currentLayer = L.geoJSON(data, {
                style: { 
                    color: "#4CAF50", 
                    weight: 2,
                    fillOpacity: 0.2,
                    fillColor: "#4CAF50"
                },
                onEachFeature: function(feature, layer) {
                    const regionName = getRussianRegionName(feature);
                    layer.bindPopup(regionName);
                    layer.on('click', () => clickHandler(feature, layer));
                }
            }).addTo(map);
        })
        .catch(error => {
            console.error("Ошибка загрузки GeoJSON:", error);
            alert("Ошибка загрузки карты. Пожалуйста, обновите страницу.");
        });
}

function handleRegionClick(feature, layer) {
    const regionName = getRussianRegionName(feature);
    console.log("Выбран регион:", regionName);
    
    if (!regionsData[regionName]) {
        console.warn("Регион не найден:", regionName);
        // Автоматически создаем базовые данные для нового региона
        regionsData[regionName] = {
            cities: [regionName],
            center: layer.getBounds().getCenter(),
            zoom: 9
        };
        console.log("Автоматически добавлен регион:", regionName);
    }

    previousCenter = map.getCenter();
    previousZoom = map.getZoom();
    currentRegion = regionName;

    try {
        const bounds = layer.getBounds();
        map.fitBounds(bounds, {
            animate: true,
            duration: 1.5,
            padding: [50, 50]
        });

        setTimeout(() => {
            showCities(regionName);
            addCityMarkers(regionName);
        }, 1500);

        isZoomed = true;
        document.getElementById('backButton').style.display = 'block';
    } catch (error) {
        console.error("Ошибка:", error);
        showCities(regionName);
    }
}

// Остальные функции (showCities, addCityMarkers и т.д.) остаются без изменений

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    map = L.map('map').setView(defaultMapCenter, defaultMapZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    loadGeoJSON("data/kz_1.json", handleRegionClick);

    // Обработчики событий
    document.getElementById('backButton').addEventListener('click', goBack);
    document.getElementById('adminPanelBtn').addEventListener('click', toggleAdminPanel);
});