// Trade tab functionality
async function updatePrice() {
    if (currentCoin) {
        try {
            const response = await fetch(`${SERVER_URL}/price/${currentCoin}`);
            const data = await response.json();
            document.getElementById('price').textContent = `Price: $${data.price}`;
        } catch (error) {
            console.error('Error fetching price:', error);
            document.getElementById('price').textContent = 'Error fetching price';
        }
    } else {
        document.getElementById('price').textContent = '';
    }
    return new Promise(resolve => setTimeout(resolve, 1000));
}

function startPriceUpdates() {
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }

    currentCoin = document.getElementById('coinSearch').value.split(' ')[0];

    if (currentCoin) {
        async function update() {
            await updatePrice();
            priceUpdateInterval = setTimeout(update, 0);
        }
        update();
    } else {
        document.getElementById('price').textContent = '';
    }
}

async function handleTradeSubmit(event) {
    event.preventDefault();
    
    const currency = document.getElementById('coinSearch').value.split(' ')[0];
    const top = parseFloat(document.getElementById('topLimit').value);
    const bottom = parseFloat(document.getElementById('bottomLimit').value);
    const amount = parseFloat(document.getElementById('amount').value) || null;
    const quantity = parseFloat(document.getElementById('quantity').value) || null;

    if (!currency) {
        alert('Please select a coin first');
        return;
    }

    if (amount === null && quantity === null) {
        alert('Please provide either amount or quantity');
        return;
    }

    const tradeData = { currency, top, bottom, amount, quantity };

    // Update UI immediately to show order is being processed
    document.getElementById('orderStatus').textContent = 'Processing order...';
    
    try {
        const response = await fetch(`${SERVER_URL}/trade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tradeData),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        document.getElementById('orderStatus').textContent = data.message;

        // Update the balance on the client side
        await updateBalance();

        // Switch to pending orders tab
        switchTab('pending-orders');
        
        // Refresh the orders immediately
        fetchOrders();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('orderStatus').textContent = 'Error setting order: ' + error.message;
    }

    // Clear form fields
    document.getElementById('topLimit').value = '';
    document.getElementById('bottomLimit').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('quantity').value = '';
}

// Add event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for coin selection
    document.getElementById('coinSearch').addEventListener('change', startPriceUpdates);

    // Add event listener for trade form submission
    document.getElementById('tradeForm').addEventListener('submit', handleTradeSubmit);

    // Add event listeners for tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // Initial tab setup
    switchTab('trade');

    // Populate coin list
    populateCoinList();
});
