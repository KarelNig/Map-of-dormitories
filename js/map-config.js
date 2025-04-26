// Конфигурация карты и данные регионов
const regionNamesMapping = {
    "Almaty": "Алматы",
    "Almaty (Alma-Ata)": "Алматы",
    "Astana": "Астана",
    "Shymkent": "Шымкент",
    "Akmola": "Акмолинская область",
    "Aqmola": "Акмолинская область",
    "Karagandy": "Карагандинская область",
    "East Kazakhstan": "Восточно-Казахстанская область",
    "West Kazakhstan": "Западно-Казахстанская область",
    "Pavlodar": "Павлодарская область",
    "Kyzylorda": "Кызылординская область"
};

const regionsData = {
    "Алматы": {
        cities: ["Алматы"],
        center: [43.2220, 76.9120],
        zoom: 11
    },
    "Астана": {
        cities: ["Астана"],
        center: [51.1282, 71.4304],
        zoom: 11
    },
    "Шымкент": {
        cities: ["Шымкент"],
        center: [42.3155, 69.5908],
        zoom: 11
    },
    "Акмолинская область": {
        cities: ["Кокшетау", "Степногорск"],
        center: [52.0102, 69.2406],
        zoom: 8
    }
};

const cityCoordinates = {
    "Алматы": [43.2220, 76.9120],
    "Астана": [51.1282, 71.4304],
    "Шымкент": [42.3155, 69.5908],
    "Кокшетау": [53.2859, 69.3833],
    "Степногорск": [52.3419, 71.8814]
};

const defaultMapCenter = [48, 67];
const defaultMapZoom = 5;

// Экспорт для использования в других файлах
export {
    regionNamesMapping,
    regionsData,
    cityCoordinates,
    defaultMapCenter,
    defaultMapZoom
};

function getRussianRegionName(feature) {
    const latinName = feature.properties?.NAME_1 || feature.properties?.name || '';
    let russianName = regionNamesMapping[latinName] || latinName;
    
    // Если региона нет в данных - создаём базовую запись
    if (!regionsData[russianName]) {
        regionsData[russianName] = {
            cities: [russianName], // По умолчанию регион = город
            center: layer.getBounds().getCenter(),
            zoom: 9
        };
        console.log(`Автоматически добавлен регион: ${russianName}`);
    }
    
    return russianName;
}