function initialClickHandler(feature, layer) {
    if (isZoomed) return;

    
    previousCenter = map.getCenter();
    previousZoom = map.getZoom();
    
   
    const cityName = feature.properties?.name || feature.properties?.NAME || 
                    feature.properties?.NAME_1 || 'Неизвестный город';
    
    console.log('Выбран город:', cityName); 
    
    try {
        const bounds = layer.getBounds();
        map.fitBounds(bounds, { animate: true, duration: 1.5 });

        applyBlur();

        setTimeout(() => {
            showHostels(cityName);
            removeBlur();
        }, 1500);

        isZoomed = true;
    } catch (error) {
        console.error('Ошибка при обработке клика:', error);
        showHostels(cityName); 
    }
}

if (!hostelsData) {
    console.error('Данные об общежитиях не загружены!');
    hostelsData = {}; 
}

function showHostels(city) {
    if (!city) {
        console.error('Не передан город для отображения');
        city = 'Неизвестный город';
    }
    
    currentCity = city;
    const panel = document.getElementById('hostelPanel');
    panel.innerHTML = `<h2 style="margin-bottom: 15px;">Общежития в ${city}</h2>`;
    
    
    if (hostelsData[city] && hostelsData[city].length > 0) {
        
    } else {
        panel.innerHTML += `
            <div class="hostel-card">
                <p>Информация об общежитиях в ${city} временно недоступна.</p>
                <p>Попробуйте позже или выберите другой город.</p>
            </div>
        `;
    }
    
    document.getElementById('backButton').style.display = 'block';
}