async function loadAppData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to load app data:', error);
        return null;
    }
}

function getAppMode(settings) {
    const now = new Date();
    const hour = now.getHours();

    // Check for URL overrides for testing
    const urlParams = new URLSearchParams(window.location.search);
    const mockHour = urlParams.get('hour');
    const currentHour = mockHour !== null ? parseInt(mockHour) : hour;

    if (currentHour >= settings.late_night_start.value || currentHour < 5) {
        return 'late-night';
    } else if (currentHour >= settings.lunch_rush_start.value && currentHour < settings.lunch_rush_end.value) {
        return 'lunch-rush';
    }
    return 'regular';
}

function applyStyles(data) {
    const settings = data.sections.app_settings;
    const root = document.documentElement;

    root.style.setProperty('--primary-color', settings.primary_color.value);
    root.style.setProperty('--secondary-color', settings.secondary_color.value);
    root.style.setProperty('--background-color', settings.background_color.value);
    root.style.setProperty('--text-color', settings.text_color.value);
}

function renderMenu(data, mode) {
    const menuContainer = document.getElementById('menu-content');
    const categories = data.sections.categories.value;
    const allProducts = data.sections.products.value;
    const appContainer = document.getElementById('app-container');
    const modeText = document.getElementById('mode-text');

    menuContainer.innerHTML = '';
    appContainer.className = mode;

    if (mode === 'lunch-rush') {
        modeText.textContent = 'Lunch Rush Specials!';
    } else if (mode === 'late-night') {
        modeText.textContent = 'Late Night Menu';
    } else {
        modeText.textContent = 'Regular Hours';
    }

    categories.forEach((cat, catIdx) => {
        // Filter products based on mode
        let catProducts = allProducts
            .map((p, idx) => ({ ...p, _idx: idx }))
            .filter(p => p.category === cat.id);

        if (mode === 'late-night') {
            catProducts = catProducts.filter(p => p.is_late_night);
        } else if (mode === 'lunch-rush') {
            // Keep all but maybe sort combos to top or highlight them
            catProducts.sort((a, b) => (b.is_combo ? 1 : 0) - (a.is_combo ? 1 : 0));
        }

        if (catProducts.length === 0) return;

        const section = document.createElement('section');
        section.className = 'category-section';
        section.innerHTML = `<h2 class="category-name" data-bind-text="categories.${catIdx}.name">${cat.name}</h2>`;

        const productList = document.createElement('div');
        productList.className = 'product-list';
        productList.style.display = 'flex';
        productList.style.flexDirection = 'column';
        productList.style.gap = '1rem';

        catProducts.forEach(product => {
            const idx = product._idx;
            const card = document.createElement('div');
            card.className = `product-card ${product.is_special ? 'special' : ''} ${product.is_combo ? 'combo' : ''}`;

            if (product.is_special) {
                card.innerHTML += '<div class="special-badge">SPECIAL</div>';
            }

            card.innerHTML += `
                <img class="product-image" data-bind-src="products.${idx}.thumbnail" src="${product.thumbnail}" alt="${product.name}">
                <div class="product-info">
                    <div class="product-header">
                        <span class="product-name" data-bind-text="products.${idx}.name">${product.name}</span>
                        <span class="product-price" data-bind-currency="products.${idx}.price">$${product.price.toFixed(2)}</span>
                    </div>
                    <p class="product-desc" data-bind-text="products.${idx}.description">${product.description}</p>
                </div>
            `;
            productList.appendChild(card);
        });

        section.appendChild(productList);
        menuContainer.appendChild(section);
    });
}

async function init() {
    console.log('Initializing app...');
    const data = await loadAppData();
    console.log('Data loaded:', data ? 'success' : 'failed');
    if (!data) return;

    applyStyles(data);

    const mode = getAppMode(data.sections.app_settings);
    console.log('Current mode:', mode);
    renderMenu(data, mode);

    // Reveal app
    document.getElementById('app-container').classList.add('loaded');

    // Refresh every minute to check for mode changes
    setInterval(() => {
        const currentMode = getAppMode(data.sections.app_settings);
        renderMenu(data, currentMode);
    }, 60000);
}

init();
