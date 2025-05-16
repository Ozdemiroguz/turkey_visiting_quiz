document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const currentCityNameElement = document.getElementById('current-city-name');
    const placesList = document.getElementById('places-list');
    const newPlaceNameInput = document.getElementById('new-place-name');
    const newPlaceDescriptionInput = document.getElementById('new-place-description');
    const addPlaceBtn = document.getElementById('add-place-btn');
    const prevCityBtn = document.getElementById('prev-city');
    const nextCityBtn = document.getElementById('next-city');

    // Variables
    let cities = [];
    let currentCityIndex = 0;
    let userAddedPlaces = []; // Array to store user-added places

    // Event listeners
    prevCityBtn.addEventListener('click', showPreviousCity);
    nextCityBtn.addEventListener('click', showNextCity);
    addPlaceBtn.addEventListener('click', addNewPlace);

    // Initialize
    loadCitiesData();
    loadUserAddedPlaces();

    // Functions
    function loadCitiesData() {
        fetch('sehirler_ve_gezilecek_yerler.json')
            .then(response => response.json())
            .then(data => {
                cities = data;
                console.log('City explorer: Data loaded,', cities.length, 'cities');

                // Load the first city once data is available
                showCity(0);
            })
            .catch(error => {
                console.error('Error loading cities data:', error);
                currentCityNameElement.textContent = 'Veri yüklenemedi';
            });
    }

    function showPreviousCity() {
        const newIndex = (currentCityIndex - 1 + cities.length) % cities.length;
        showCity(newIndex);
    }

    function showNextCity() {
        const newIndex = (currentCityIndex + 1) % cities.length;
        showCity(newIndex);
    }

    function showCity(index) {
        if (!cities || !cities.length) return;

        currentCityIndex = index;
        const city = cities[currentCityIndex];

        // Update city name
        currentCityNameElement.textContent = city.city;

        // Display places
        displayPlaces(city);
    }

    function displayPlaces(city) {
        placesList.innerHTML = '';

        // Display default places
        city.places.forEach(place => {
            const placeElement = createPlaceElement(place.name, place.description, false);
            placesList.appendChild(placeElement);
        });

        // Display user-added places for this city
        const cityUserPlaces = userAddedPlaces.filter(place => place.cityId === city.id);
        if (cityUserPlaces.length > 0) {
            const userPlacesDivider = document.createElement('div');
            userPlacesDivider.className = 'places-divider';
            userPlacesDivider.textContent = 'Sizin Eklediğiniz Yerler:';
            placesList.appendChild(userPlacesDivider);

            cityUserPlaces.forEach(place => {
                const placeElement = createPlaceElement(place.name, place.description, true);
                placesList.appendChild(placeElement);
            });
        }
    }

    function createPlaceElement(name, description, isUserAdded) {
        const placeElement = document.createElement('div');
        placeElement.className = isUserAdded ? 'place-item user-added' : 'place-item';

        const nameElement = document.createElement('div');
        nameElement.className = 'place-name';
        nameElement.textContent = name;

        const descriptionElement = document.createElement('div');
        descriptionElement.className = 'place-description';
        descriptionElement.textContent = description;

        placeElement.appendChild(nameElement);
        placeElement.appendChild(descriptionElement);

        return placeElement;
    }

    function addNewPlace() {
        const name = newPlaceNameInput.value.trim();
        const description = newPlaceDescriptionInput.value.trim();

        if (!name) {
            alert('Lütfen yer adını giriniz.');
            return;
        }

        if (!description) {
            alert('Lütfen açıklama giriniz.');
            return;
        }

        const currentCity = cities[currentCityIndex];

        // Create new place object
        const newPlace = {
            id: Date.now(), // Unique ID
            cityId: currentCity.id,
            cityName: currentCity.city,
            name: name,
            description: description
        };

        // Add to user-added places
        userAddedPlaces.push(newPlace);

        // Save to local storage
        saveUserAddedPlaces();

        // Clear form
        newPlaceNameInput.value = '';
        newPlaceDescriptionInput.value = '';

        // Refresh display
        displayPlaces(currentCity);

        // Show confirmation
        alert(`"${name}" ${currentCity.city} için başarıyla eklendi.`);
    }

    function saveUserAddedPlaces() {
        localStorage.setItem('userAddedPlaces', JSON.stringify(userAddedPlaces));
    }

    function loadUserAddedPlaces() {
        const saved = localStorage.getItem('userAddedPlaces');
        if (saved) {
            userAddedPlaces = JSON.parse(saved);
        }
    }
});
