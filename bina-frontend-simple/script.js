// Replace with your actual server IP
const SERVER_URL = 'http://localhost:8000';

// Initial balance update
updateBalance();

// Update balance every 5 seconds
setInterval(async () => {
    await updateBalance();
}, 5000);

// Function to switch tabs
async function switchTab(tabName) {
    console.log(`Switching to ${tabName} tab`);
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
        activeTab.classList.add('active');
    } else {
        console.error(`Could not find tab with id ${tabName}-tab`);
    }
    
    const activeButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    } else {
        console.error(`Could not find button for tab ${tabName}`);
    }
    
    await updateBalance();
    
    if (tabName === 'pending-orders') {
        const loadingContainer = document.getElementById('pendingOrdersLoading');
        if (loadingContainer) loadingContainer.style.display = 'flex';
        stopPriceUpdates();
        stopOrdersUpdate();
        await fetchOrders();
    } else if (tabName === 'filled-orders') {
        const loadingContainer = document.getElementById('filledOrdersLoading');
        if (loadingContainer) loadingContainer.style.display = 'flex';
        stopPriceUpdates();
        stopOrdersUpdate();
        await fetchFilledOrders();
    } else if (tabName === 'trade') {
        startPriceUpdates();
    } else {
        console.error(`Unknown tab: ${tabName}`);
    }
}

// Make sure switchTab is available globally
window.switchTab = switchTab;
