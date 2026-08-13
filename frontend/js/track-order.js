const ORDER_API = "http://localhost:5000/api/orders";

const token = localStorage.getItem("token");

// ========================================
// ELEMENTS
// ========================================
const trackingLoading =
  document.getElementById("trackingLoading");

const trackingError =
  document.getElementById("trackingError");

const trackingContent =
  document.getElementById("trackingContent");

const trackingErrorMessage =
  document.getElementById("trackingErrorMessage");

const orderNumber =
  document.getElementById("orderNumber");

const orderCreatedDate =
  document.getElementById("orderCreatedDate");

const currentStatus =
  document.getElementById("currentStatus");

const estimatedDelivery =
  document.getElementById("estimatedDelivery");

const paymentMethod =
  document.getElementById("paymentMethod");

const paymentStatus =
  document.getElementById("paymentStatus");

const trackingLastUpdated =
  document.getElementById("trackingLastUpdated");

const shippingName =
  document.getElementById("shippingName");

const shippingAddress =
  document.getElementById("shippingAddress");

const shippingPhone =
  document.getElementById("shippingPhone");

const shippingEmail =
  document.getElementById("shippingEmail");

const trackingOrderItems =
  document.getElementById("trackingOrderItems");

const trackingSubtotal =
  document.getElementById("trackingSubtotal");

const trackingShipping =
  document.getElementById("trackingShipping");

const trackingDiscount =
  document.getElementById("trackingDiscount");

const trackingTotal =
  document.getElementById("trackingTotal");

// ========================================
// ORDER STAGES
// ========================================
const ORDER_STAGES = [
  "Order Placed",
  "Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

// ========================================
// HELPERS
// ========================================
function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString(
    "en-PK"
  )}`;
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDateOnly(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function showError(message) {
  trackingLoading.classList.add("hidden");
  trackingContent.classList.add("hidden");

  trackingError.classList.remove("hidden");

  trackingErrorMessage.textContent = message;
}

// ========================================
// GET ORDER ID FROM URL
// ========================================
function getOrderId() {
  const params = new URLSearchParams(
    window.location.search
  );

  return params.get("id");
}

// ========================================
// TIMELINE
// ========================================
function renderTimeline(order) {
  const steps = document.querySelectorAll(
    ".tracking-step"
  );

  const status = order.status || "Order Placed";

  // Cancelled orders should not pretend
  // delivery is still progressing.
  if (status === "Cancelled") {
    steps.forEach((step) => {
      step.classList.remove(
        "completed",
        "current"
      );

      step.style.opacity = "0.45";
    });

    currentStatus.textContent = "Cancelled";
    currentStatus.style.color = "#ffb3b3";

    return;
  }

  const currentIndex =
    ORDER_STAGES.indexOf(status);

  steps.forEach((step, index) => {
    step.classList.remove(
      "completed",
      "current"
    );

    const stepStatus =
      step.dataset.status;

    const stepIndex =
      ORDER_STAGES.indexOf(stepStatus);

    if (
      currentIndex >= 0 &&
      stepIndex < currentIndex
    ) {
      step.classList.add("completed");
    }

    if (stepIndex === currentIndex) {
      step.classList.add("current");
    }

    // Delivered means all steps complete.
    if (status === "Delivered") {
      step.classList.add("completed");
      step.classList.remove("current");
    }

    const timeElement =
      step.querySelector(
        ".tracking-step-time"
      );

    if (!timeElement) return;

    const historyEntry =
      (order.trackingHistory || [])
        .slice()
        .reverse()
        .find(
          (entry) =>
            entry.status === stepStatus
        );

    if (historyEntry) {
      timeElement.textContent =
        formatDate(historyEntry.timestamp);
    } else {
      timeElement.textContent = "";
    }
  });
}

// ========================================
// ORDER ITEMS
// ========================================
function renderItems(order) {
  trackingOrderItems.innerHTML = "";

  const items = order.items || [];

  if (items.length === 0) {
    trackingOrderItems.innerHTML = `
      <p>No items found for this order.</p>
    `;

    return;
  }

  items.forEach((item) => {
    const product = item.product || {};

    const quantity =
      Number(item.quantity) || 1;

    const price =
      Number(item.price) ||
      Number(product.price) ||
      0;

    const total =
      price * quantity;

    trackingOrderItems.innerHTML += `
      <div class="tracking-order-item">

        <div class="tracking-order-item-info">

          <strong>
            ${escapeHtml(
              product.name ||
                "Product"
            )}
          </strong>

          <span>
            Quantity: ${quantity}
            &nbsp;•&nbsp;
            ${formatMoney(price)} each
          </span>

        </div>

        <div class="tracking-order-item-price">
          ${formatMoney(total)}
        </div>

      </div>
    `;
  });
}

// ========================================
// SHIPPING ADDRESS
// ========================================
function renderShipping(order) {
  const address =
    order.shippingAddress || {};

  shippingName.textContent =
    address.fullName || "Not available";

  const addressParts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.province,
    address.postalCode,
    address.country,
  ].filter(Boolean);

  shippingAddress.textContent =
    addressParts.length > 0
      ? addressParts.join(", ")
      : "Address not available";

  shippingPhone.textContent =
    address.phone
      ? `Phone: ${address.phone}`
      : "Phone: Not available";

  shippingEmail.textContent =
    address.email
      ? `Email: ${address.email}`
      : "Email: Not available";
}

// ========================================
// LAST UPDATE
// ========================================
function getLastTrackingUpdate(order) {
  const history =
    order.trackingHistory || [];

  if (history.length > 0) {
    const latest = history
      .slice()
      .sort(
        (a, b) =>
          new Date(b.timestamp) -
          new Date(a.timestamp)
      )[0];

    return latest.timestamp;
  }

  return order.updatedAt ||
    order.createdAt;
}

// ========================================
// DELIVERY MAP
// ========================================
let deliveryMapInstance = null;

function renderDeliveryMap(order) {
  const mapContainer =
    document.getElementById("deliveryMap");

  if (!mapContainer) return;

  const location =
    order.currentLocation || {};

  const latitude =
    Number(location.latitude);

  const longitude =
    Number(location.longitude);

  // ======================================
  // NO LOCATION YET
  // ======================================
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    mapContainer.innerHTML = `
      <div>

        <span class="map-placeholder-icon">
          📍
        </span>

        <h3>
          Location Not Available Yet
        </h3>

        <p>
          Delivery location will appear
          once your order has been shipped.
        </p>

      </div>
    `;

    return;
  }

  // Remove placeholder styling
  mapContainer.classList.remove(
    "delivery-map-placeholder"
  );

  mapContainer.innerHTML = "";

  // Prevent duplicate Leaflet map
  if (deliveryMapInstance) {
    deliveryMapInstance.remove();
  }

  // ======================================
  // INITIALIZE MAP
  // ======================================
  deliveryMapInstance = L.map(
    "deliveryMap"
  ).setView(
    [latitude, longitude],
    14
  );

  // ======================================
  // MAP TILES
  // ======================================
  L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,

      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  ).addTo(deliveryMapInstance);

  // ======================================
  // DELIVERY MARKER
  // ======================================
  const deliveryMarker =
    L.marker([
      latitude,
      longitude,
    ]).addTo(
      deliveryMapInstance
    );

  const safeAddress =
    location.address
      ? escapeHtml(location.address)
      : "Current delivery location";

  deliveryMarker
    .bindPopup(`
      <strong>🚚 Your Order</strong>
      <br>
      ${safeAddress}
    `)
    .openPopup();

  // ======================================
  // FIX MAP SIZE
  // ======================================
  setTimeout(() => {
    deliveryMapInstance.invalidateSize();
  }, 150);
}
// ========================================
// RENDER ORDER
// ========================================
function renderOrder(order) {
  const displayOrderNumber =
    order.orderNumber ||
    `ELT-${String(order._id)
      .slice(-8)
      .toUpperCase()}`;

  orderNumber.textContent =
    displayOrderNumber;

  orderCreatedDate.textContent =
    `Placed on ${formatDate(
      order.createdAt
    )}`;

  currentStatus.textContent =
    order.status || "Order Placed";

  estimatedDelivery.textContent =
    formatDateOnly(
      order.estimatedDelivery
    );

  paymentMethod.textContent =
    order.payment?.method ||
    "Not available";

  paymentStatus.textContent =
    order.payment?.status ||
    "Pending";

  trackingLastUpdated.textContent =
    `Last updated ${formatDate(
      getLastTrackingUpdate(order)
    )}`;

  renderTimeline(order);
  renderShipping(order);
  renderItems(order);
  renderDeliveryMap(order);
  trackingSubtotal.textContent =
    formatMoney(order.subtotal);

  trackingShipping.textContent =
    formatMoney(order.shippingFee);

  trackingDiscount.textContent =
    `- ${formatMoney(order.discount)}`;

  trackingTotal.textContent =
    formatMoney(order.totalAmount);
}

// ========================================
// LOAD ORDER
// ========================================
async function loadOrder() {
  const orderId = getOrderId();

  // ----------------------------
  // Authentication check
  // ----------------------------
  if (!token) {
    showToast(
      "Please login to track your order."
    );

    setTimeout(() => {
      window.location.href =
        "login.html";
    }, 1000);

    return;
  }

  // ----------------------------
  // Order ID check
  // ----------------------------
  if (!orderId) {
    showError(
      "Order ID is missing from the URL."
    );

    return;
  }

  try {
    const response = await fetch(
      `${ORDER_API}/${orderId}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    // ----------------------------
    // Session expired
    // ----------------------------
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      showToast(
        data.message ||
          "Your session has expired."
      );

      setTimeout(() => {
        window.location.href =
          "login.html";
      }, 1000);

      return;
    }

    // ----------------------------
    // Unauthorized order access
    // ----------------------------
    if (response.status === 403) {
      showError(
        data.message ||
          "You cannot access this order."
      );

      return;
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to load order."
      );
    }

    if (!data.order) {
      throw new Error(
        "Order data was not returned."
      );
    }

    renderOrder(data.order);

    trackingLoading.classList.add(
      "hidden"
    );

    trackingError.classList.add(
      "hidden"
    );

    trackingContent.classList.remove(
      "hidden"
    );
  } catch (error) {
    console.error(
      "Order tracking error:",
      error
    );

    showError(
      error.message ||
        "Unable to load your order."
    );
  }
}

// ========================================
// INITIALIZE
// ========================================
loadOrder();