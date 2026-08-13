const ORDER_API = "http://localhost:5000/api/orders";

const ordersContainer =
  document.getElementById("ordersContainer");

const token = localStorage.getItem("token");
const user = JSON.parse(
  localStorage.getItem("user")
);

// ========================================
// TOAST
// ========================================
function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ========================================
// SAFE HTML
// ========================================
function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ========================================
// LOGIN CHECK
// ========================================
if (!user || !token) {
  showToast("Please login first.");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
}

// ========================================
// FORMAT MONEY
// ========================================
function formatPrice(value) {
  return Number(value || 0).toLocaleString();
}

// ========================================
// FORMAT DATE
// ========================================
function formatDate(value) {
  if (!value) return "N/A";

  return new Date(value).toLocaleString(
    "en-PK",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

// ========================================
// LOAD ORDERS
// ========================================
async function loadOrders() {
  if (!token) return;

  ordersContainer.innerHTML = `
    <div class="empty-orders">
      <h2>Loading Orders...</h2>
      <p>Please wait.</p>
    </div>
  `;

  try {
    const res = await fetch(ORDER_API, {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    // Token expired
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      showToast(
        data.message ||
          "Session expired. Please login again."
      );

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);

      return;
    }

    if (!res.ok) {
      throw new Error(
        data.message || "Unable to load orders."
      );
    }

    const orders = data.orders || [];

    // ========================================
    // NO ORDERS
    // ========================================
    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-orders">
          <h2>No Orders Yet</h2>
          <p>
            You haven't placed any orders yet.
          </p>

          <a
            href="products.html"
            class="track-order-btn"
          >
            Start Shopping
          </a>
        </div>
      `;

      return;
    }

    ordersContainer.innerHTML = "";

    // ========================================
    // DISPLAY ORDERS
    // ========================================
    orders.forEach((order) => {
      let itemsHTML = "";

      (order.items || []).forEach((item) => {
        const product = item.product || {};

        const quantity =
          Number(item.quantity) || 1;

        const price =
          Number(item.price) ||
          Number(product.price) ||
          0;

        const itemTotal =
          price * quantity;

        itemsHTML += `
          <div class="order-item">
            <span>
              ${escapeHtml(
                product.name ||
                  "Product"
              )}
              × ${quantity}
            </span>

            <strong>
              Rs. ${formatPrice(itemTotal)}
            </strong>
          </div>
        `;
      });

      const orderNumber =
        order.orderNumber ||
        `ELT-${order._id
          ?.slice(-8)
          .toUpperCase()}`;

      const paymentMethod =
        order.payment?.method || "N/A";

      const paymentStatus =
        order.payment?.status || "Pending";

      ordersContainer.innerHTML += `
        <div class="order-card">

          <div class="order-top">

            <div>
              <h3>
                ${escapeHtml(orderNumber)}
              </h3>

              <p>
                ${formatDate(order.createdAt)}
              </p>
            </div>

            <div class="order-status">
              ${escapeHtml(
                order.status ||
                  "Order Placed"
              )}
            </div>

          </div>

          <div class="order-items">
            ${itemsHTML}
          </div>

          <hr>

          <div class="order-details-row">
            <span>Payment Method</span>

            <strong>
              ${escapeHtml(paymentMethod)}
            </strong>
          </div>

          <div class="order-details-row">
            <span>Payment Status</span>

            <strong>
              ${escapeHtml(paymentStatus)}
            </strong>
          </div>

          <div class="order-details-row">
            <span>Order Total</span>

            <strong>
              Rs. ${formatPrice(
                order.totalAmount
              )}
            </strong>
          </div>

          <div class="order-actions">

            <a
              href="track-order.html?id=${order._id}"
              class="track-order-btn"
            >
              Track Order
            </a>

          </div>

        </div>
      `;
    });
  } catch (error) {
    console.error(
      "Load orders error:",
      error
    );

    ordersContainer.innerHTML = `
      <div class="empty-orders">
        <h2>Failed to load orders</h2>
        <p>
          ${
            escapeHtml(
              error.message
            )
          }
        </p>
      </div>
    `;
  }
}

loadOrders();