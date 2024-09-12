// Replace with your actual server IP
const SERVER_URL = 'http://192.168.178.29:8000';

// Initial balance update
updateBalance();

// Update balance every 5 seconds
setInterval(async () => {
    await updateBalance();
}, 5000);

// Function to switch tabs
async function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('active');
    
    await updateBalance();
    
    if (tabName === 'pending-orders') {
        startOrdersUpdate(); // Start the interval for updates, including the first update
    } else if (tabName === 'filled-orders') {
        await fetchFilledOrders();
    } else {
        stopOrdersUpdate();
    }
}
