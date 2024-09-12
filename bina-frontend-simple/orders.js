// Orders tab functionality
let pendingOrders = [];
let filledOrders = [];
let ordersUpdateInterval;
let isOrdersFetching = false;

async function fetchOrders() {
    try {
        const response = await fetch(`${SERVER_URL}/pending_orders`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        pendingOrders = data.pending_orders;
        updatePendingOrdersTable();
    } catch (error) {
        console.error('Error fetching orders:', error);
    } finally {
        isOrdersFetching = false;
    }
}

function updatePendingOrdersTable() {
    const tableBody = document.querySelector('#pendingOrdersTable tbody');
    tableBody.innerHTML = '';
    
    pendingOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="delete-order" data-id="${order.id}">Close</button></td>
            <td>${order.currency}</td>
            <td class="current-price" data-currency="${order.currency}">${order.current_price.toFixed(2)}</td>
            <td>${order.top_limit.toFixed(2)}</td>
            <td>${order.bottom_limit.toFixed(2)}</td>
            <td>${order.amount.toFixed(2)}</td>
            <td>${order.top_quantity.toFixed(8)}</td>
            <td>${order.bottom_quantity.toFixed(8)}</td>
            <td>${order.status}</td>
            <td>${new Date(order.time).toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-order').forEach(button => {
        button.addEventListener('click', handleDeleteOrder);
    });
}

function updateFilledOrdersTable() {
    const tableBody = document.querySelector('#filledOrdersTable tbody');
    tableBody.innerHTML = '';
    
    filledOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.currency}</td>
            <td class="current-price" data-currency="${order.currency}">${order.execution_price.toFixed(2)}</td>
            <td>${order.top_limit.toFixed(2)}</td>
            <td>${order.bottom_limit.toFixed(2)}</td>
            <td>${order.amount.toFixed(2)}</td>
            <td>${(order.amount / order.execution_price).toFixed(8)}</td>
            <td>${order.quantity.toFixed(8)}</td>
            <td>${order.status}</td>
            <td>${new Date(order.time).toLocaleString()}</td>
            <td>${order.reason}</td>
        `;
        tableBody.appendChild(row);
    });
}

async function updatePrices() {
    const pricePromises = pendingOrders.map(order =>
        fetch(`${SERVER_URL}/price/${order.currency}`)
            .then(response => response.json())
            .then(data => ({ currency: order.currency, price: data.price }))
            .catch(error => {
                console.error(`Error fetching price for ${order.currency}:`, error);
                return null;
            })
    );

    const prices = await Promise.all(pricePromises);

    prices.forEach(priceData => {
        if (priceData) {
            const priceCell = document.querySelector(`.current-price[data-currency="${priceData.currency}"]`);
            if (priceCell) {
                priceCell.textContent = priceData.price.toFixed(2);
            }
        }
    });
}

function startOrdersUpdate() {
    if (ordersUpdateInterval) {
        clearInterval(ordersUpdateInterval);
    }
    fetchOrders(); // Initial fetch when starting the updates
    ordersUpdateInterval = setInterval(async () => {
        if (!isOrdersFetching) {
            isOrdersFetching = true;
            await fetchOrders();
            await updatePrices();
            isOrdersFetching = false;
        }
    }, 5000); // Update every 5 seconds
}

function stopOrdersUpdate() {
    if (ordersUpdateInterval) {
        clearInterval(ordersUpdateInterval);
    }
}

// Initialize orders when the tab is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch when the page loads is no longer needed
    // as it will be handled by switchTab function
});

async function handleDeleteOrder(event) {
    const orderId = event.target.dataset.id;
    const orderRow = event.target.closest('tr');
    const amountCell = orderRow.querySelector('td:nth-child(6)');
    const refundAmount = parseFloat(amountCell.textContent);

    try {
        const response = await fetch(`${SERVER_URL}/order/${orderId}?refund_amount=${refundAmount}`, { 
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to close order');
        }
        const data = await response.json();
        alert(`Order closed successfully. Refunded amount: $${data.refunded_amount}`);
        await fetchOrders(); // Refresh the orders list
        await updateBalance(); // Update the balance display
    } catch (error) {
        console.error('Error closing order:', error);
        alert('Failed to close order. Please try again.');
    }
}

async function fetchFilledOrders() {
    try {
        const response = await fetch(`${SERVER_URL}/filled_orders`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        filledOrders = data.filled_orders || [];
        updateFilledOrdersTable();
    } catch (error) {
        console.error('Error fetching filled orders:', error);
    }
}
