// Shared functionality
let currentCoin = '';
let priceUpdateInterval;
let balanceUpdateInterval;

async function updateBalance() {
    try {
        const response = await fetch(`${SERVER_URL}/balance`, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const balanceText = `Balance: $${data.balance.toFixed(6)}`;
        
        const updateElement = (id) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = balanceText;
            }
        };

        updateElement('balance');
        updateElement('balance-pending-orders');
        updateElement('balance-filled-orders');
    } catch (error) {
        console.error('Error fetching balance:', error);
        const errorText = `Error fetching balance: ${error.message}`;
        
        const updateElementWithError = (id) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = errorText;
            }
        };

        updateElementWithError('balance');
        updateElementWithError('balance-pending-orders');
        updateElementWithError('balance-filled-orders');
    }
}

// Make updateBalance available globally
window.updateBalance = updateBalance;

function startBalanceUpdate() {
    updateBalance(); // Initial update
    balanceUpdateInterval = setInterval(updateBalance, 10000); // Update every 10 seconds
}

function stopBalanceUpdate() {
    clearInterval(balanceUpdateInterval);
}

function populateCoinList() {
    const datalist = document.getElementById('coinList');
    coinOptions.forEach(coin => {
        const option = document.createElement('option');
        option.value = coin.value;
        option.textContent = coin.name;
        datalist.appendChild(option);
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('active');
    
    if (tabName === 'pending-orders') {
        startOrdersUpdate(true);
    } else {
        stopOrdersUpdate();
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    populateCoinList();
    startBalanceUpdate();

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    switchTab('trade');
});

// Add this to the existing code in common.js
let priceCacheMap = new Map();
let priceUpdatePromises = new Map();

async function updateSharedPrice(currency) {
    if (!priceCacheMap.has(currency)) {
        priceCacheMap.set(currency, { price: null, lastUpdated: 0 });
    }
    const cacheEntry = priceCacheMap.get(currency);
    const now = Date.now();

    if (now - cacheEntry.lastUpdated > 1000 && !priceUpdatePromises.has(currency)) {
        const updatePromise = fetch(`${SERVER_URL}/price/${currency}`)
            .then(response => response.json())
            .then(data => {
                cacheEntry.price = data.price;
                cacheEntry.lastUpdated = now;
                priceUpdatePromises.delete(currency);
                return data.price;
            })
            .catch(error => {
                console.error(`Error fetching price for ${currency}:`, error);
                priceUpdatePromises.delete(currency);
                return null;
            });

        priceUpdatePromises.set(currency, updatePromise);
        return updatePromise;
    }

    return priceUpdatePromises.get(currency) || Promise.resolve(cacheEntry.price);
}

function getSharedPrice(currency) {
    return priceCacheMap.get(currency)?.price || null;
}
