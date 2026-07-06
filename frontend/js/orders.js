const ORDER_API = "http://localhost:5000/api/orders";
const ordersContainer = document.getElementById("ordersContainer");

const user = JSON.parse(localStorage.getItem("user"));

if (!user || !user._id) {
  showToast("Please login first");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
}

async function loadOrders() {
  try {
    const res = await fetch(`${ORDER_API}/${user._id}`);
    const orders = await res.json();

    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-orders">
          <h2>No Orders Yet</h2>
          <p>You haven't placed any orders yet.</p>
        </div>
      `;
      return;
    }

    ordersContainer.innerHTML = "";

    orders.forEach((order, index) => {
      let itemsHTML = "";

      order.items.forEach(item => {
        const product = item.product;
        const qty = item.quantity || 1;
        const itemTotal = item.price * qty;

        itemsHTML += `
          <div class="order-item">
            <span>${product.name} × ${qty}</span>
            <strong>Rs. ${itemTotal}</strong>
          </div>
        `;
      });

      ordersContainer.innerHTML += `
        <div class="order-card">
          <div class="order-top">
            <div>
              <h3>Order #${index + 1}</h3>
              <p>${new Date(order.createdAt).toLocaleString()}</p>
            </div>

            <div class="order-status">
              ${order.status}
            </div>
          </div>

          <div class="order-items">
            ${itemsHTML}
          </div>

          <hr>

          <div class="order-item" style="margin-top:12px;">
            <strong>Total</strong>
            <strong>Rs. ${order.totalAmount}</strong>
          </div>
        </div>
      `;
    });

  } catch (error) {
    ordersContainer.innerHTML = `
      <div class="empty-orders">
        <h2>Failed to load orders</h2>
      </div>
    `;
  }
}

loadOrders();