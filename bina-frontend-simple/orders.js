// Orders tab functionality
let pendingOrders = [];
let filledOrders = [];
let ordersUpdateInterval;
let isOrdersFetching = false;

async function fetchOrders() {
    console.log('Fetching orders...'); // Debug log
    try {
        const response = await fetch(`${SERVER_URL}/pending_orders`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        pendingOrders = data.pending_orders;
        updatePendingOrdersTable();
        await updatePrices(); // Update prices after fetching orders
    } catch (error) {
        console.error('Error fetching orders:', error);
    } finally {
        isOrdersFetching = false;
    }
}

function updatePendingOrdersTable() {
    const tableBody = document.querySelector('#pendingOrdersTable tbody');
    
    tableBody.innerHTML = '';
    
    if (pendingOrders.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="10">No pending orders available</td>';
        tableBody.appendChild(row);
    } else {
        pendingOrders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><button class="delete-order" data-id="${order.id}">Close</button></td>
                <td>${order.currency}</td>
                <td class="current-price" data-currency="${order.currency}">${getSharedPrice(order.currency)?.toFixed(2) || 'Loading...'}</td>
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
    }

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-order').forEach(button => {
        button.addEventListener('click', handleDeleteOrder);
    });
}

function updateFilledOrdersTable() {
    console.log('Updating filled orders table...');
    const tableBody = document.querySelector('#filledOrdersTable tbody');
    
    if (!tableBody) {
        console.error('Could not find table body element');
        return;
    }
    
    tableBody.innerHTML = '';
    
    console.log('Number of filled orders:', filledOrders.length);
    
    if (filledOrders.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6">No filled orders available</td>';
        tableBody.appendChild(row);
    } else {
        filledOrders.forEach(order => {
            console.log('Processing order:', order);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><button class="delete-order delete-filled-order" data-id="${order.id}">Delete</button></td>
                <td>${order.symbol}</td>
                <td>${parseFloat(order.price).toFixed(2)}</td>
                <td>${order.side}</td>
                <td>${parseFloat(order.quantity).toFixed(8)}</td>
                <td>${new Date(order.timestamp).toLocaleString()}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-filled-order').forEach(button => {
        button.addEventListener('click', handleDeleteFilledOrder);
    });
    
    console.log('Finished updating filled orders table');
}

async function updatePrices() {
    if (pendingOrders.length === 0) return;

    const currencies = [...new Set(pendingOrders.map(order => order.currency))];
    await Promise.all(currencies.map(updateSharedPrice));

    pendingOrders.forEach(order => {
        const price = getSharedPrice(order.currency);
        if (price !== null) {
            const priceCells = document.querySelectorAll(`.current-price[data-currency="${order.currency}"]`);
            priceCells.forEach(cell => {
                cell.textContent = price.toFixed(2);
            });
        }
    });
}

function startOrdersUpdate() {
    console.log('Starting orders update...'); // Debug log
    if (ordersUpdateInterval) {
        clearInterval(ordersUpdateInterval);
    }
    fetchOrders(); // Fetch immediately when starting updates
    ordersUpdateInterval = setInterval(async () => {
        if (!isOrdersFetching) {
            isOrdersFetching = true;
            await fetchOrders();
        }
    }, 3000); // Update every 3 seconds
}

// Add this function to stop the orders update interval
function stopOrdersUpdate() {
    console.log('Stopping orders update...'); // Debug log
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
    console.log('Fetching filled orders...');
    try {
        const response = await fetch(`${SERVER_URL}/filled_orders`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received filled orders data:', data);
        filledOrders = data;
        console.log('Filled orders array:', filledOrders);
        updateFilledOrdersTable();
    } catch (error) {
        console.error('Error fetching filled orders:', error);
    } finally {
    }
}

async function handleDeleteFilledOrder(event) {
    const orderId = event.target.dataset.id;
    
    try {
        const response = await fetch(`${SERVER_URL}/filled_order/${orderId}`, { 
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to delete filled order');
        }
        const data = await response.json();
        alert(`Filled order deleted successfully. Order ID: ${data.order_id}`);
        await fetchFilledOrders(); // Refresh the filled orders list
    } catch (error) {
        console.error('Error deleting filled order:', error);
        alert('Failed to delete filled order. Please try again.');
    }
}

// Make sure fetchOrders is available globally
window.fetchOrders = fetchOrders;
window.startOrdersUpdate = startOrdersUpdate;
window.stopOrdersUpdate = stopOrdersUpdate;
window.fetchFilledOrders = fetchFilledOrders;
window.updateFilledOrdersTable = updateFilledOrdersTable;
window.handleDeleteFilledOrder = handleDeleteFilledOrder;
