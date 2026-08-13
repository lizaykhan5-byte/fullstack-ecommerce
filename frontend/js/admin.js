// ========================================
// ADMIN AUTHENTICATION
// ========================================

const loggedUser = JSON.parse(
  localStorage.getItem("user")
);

const adminToken = localStorage.getItem("token");

if (
  !loggedUser ||
  loggedUser.role !== "admin" ||
  !adminToken
) {
  alert("Admin authentication required.");

  localStorage.removeItem("user");
  localStorage.removeItem("token");

  window.location.href = "../login.html";
}


// ========================================
// API URLS
// ========================================

const PRODUCT_API =
  "http://localhost:5000/api/products";

const ORDER_API =
  "http://localhost:5000/api/orders";


// ========================================
// HELPERS
// ========================================

function escapeAdminHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatAdminMoney(value) {
  return Number(value || 0).toLocaleString(
    "en-PK"
  );
}


function formatAdminDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


// ========================================
// ADMIN LOGOUT
// ========================================

function adminLogout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");

  window.location.href = "../login.html";
}


// ========================================
// DASHBOARD STATISTICS
// ========================================

async function loadDashboardStats() {
  const totalProducts =
    document.getElementById("totalProducts");

  const totalOrders =
    document.getElementById("totalOrders");

  const pendingOrders =
    document.getElementById("pendingOrders");

  const totalRevenue =
    document.getElementById("totalRevenue");

  // Only run on dashboard
  if (!totalProducts) return;

  try {
    // Products
    const productsRes = await fetch(
      PRODUCT_API
    );

    const products =
      await productsRes.json();


    // Orders
    const ordersRes = await fetch(
      `${ORDER_API}/admin/all`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${adminToken}`,
        },
      }
    );

    const orderData =
      await ordersRes.json();


    if (
      ordersRes.status === 401 ||
      ordersRes.status === 403
    ) {
      alert(
        orderData.message ||
          "Admin session expired."
      );

      adminLogout();

      return;
    }


    if (!ordersRes.ok) {
      throw new Error(
        orderData.message ||
          "Failed to load orders."
      );
    }


    const orders =
      orderData.orders || [];


    // Active / Pending orders
    const activeOrders = orders.filter(
      (order) =>
        order.status !== "Delivered" &&
        order.status !== "Cancelled"
    );


    // Revenue only from delivered orders
    const revenue = orders
      .filter(
        (order) =>
          order.status === "Delivered"
      )
      .reduce(
        (sum, order) =>
          sum +
          Number(order.totalAmount || 0),
        0
      );


    totalProducts.textContent =
      Array.isArray(products)
        ? products.length
        : 0;

    totalOrders.textContent =
      orders.length;

    pendingOrders.textContent =
      activeOrders.length;

    totalRevenue.textContent =
      `Rs. ${formatAdminMoney(revenue)}`;

  } catch (error) {
    console.error(
      "Dashboard stats error:",
      error
    );
  }
}


// ========================================
// PRODUCTS TABLE
// ========================================

async function loadProducts() {
  const table =
    document.getElementById(
      "adminProducts"
    );

  if (!table) return;

  try {
    const res =
      await fetch(PRODUCT_API);

    const products =
      await res.json();


    if (!res.ok) {
      throw new Error(
        products.message ||
          "Failed to load products."
      );
    }


    table.innerHTML = "";


    if (
      !Array.isArray(products) ||
      products.length === 0
    ) {
      table.innerHTML = `
        <tr>
          <td colspan="6">
            No products found.
          </td>
        </tr>
      `;

      return;
    }


    products.forEach((product) => {
      table.innerHTML += `
        <tr>

          <td>
            ${escapeAdminHtml(
              product.name
            )}
          </td>

          <td>
            ${escapeAdminHtml(
              product.category
            )}
          </td>

          <td>
            ${escapeAdminHtml(
              product.brand || "-"
            )}
          </td>

          <td>
            Rs. ${formatAdminMoney(
              product.price
            )}
          </td>

          <td>
            ${Number(
              product.stock || 0
            )}
          </td>

          <td>

            <button
              class="edit-btn"
              onclick="
                window.location.href=
                'edit-product.html?id=${product._id}'
              "
            >
              Edit
            </button>

            <button
              class="delete-btn"
              onclick="
                deleteProduct(
                  '${product._id}'
                )
              "
            >
              Delete
            </button>

          </td>

        </tr>
      `;
    });

  } catch (error) {
    console.error(
      "Load products error:",
      error
    );

    table.innerHTML = `
      <tr>
        <td colspan="6">
          Failed to load products.
        </td>
      </tr>
    `;
  }
}


// ========================================
// DELETE PRODUCT
// ========================================

async function deleteProduct(id) {
  if (
    !confirm(
      "Delete this product?"
    )
  ) {
    return;
  }

  try {
    const response = await fetch(
      `${PRODUCT_API}/${id}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${adminToken}`,
        },
      }
    );


    const data =
      await response.json();


    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to delete product."
      );
    }


    alert(
      "Product deleted successfully."
    );


    await loadProducts();

    await loadDashboardStats();

  } catch (error) {
    console.error(
      "Delete product error:",
      error
    );

    alert(
      error.message ||
        "Failed to delete product."
    );
  }
}


// ========================================
// ADD PRODUCT
// ========================================

async function addProduct(event) {
  event.preventDefault();

  const form =
    document.getElementById(
      "productForm"
    );

  if (!form) return;


  const formData =
    new FormData();


  formData.append(
    "name",
    document.getElementById(
      "name"
    ).value
  );

  formData.append(
    "brand",
    document.getElementById(
      "brand"
    ).value
  );

  formData.append(
    "category",
    document.getElementById(
      "category"
    ).value
  );

  formData.append(
    "price",
    document.getElementById(
      "price"
    ).value
  );

  formData.append(
    "stock",
    document.getElementById(
      "stock"
    ).value
  );

  formData.append(
    "description",
    document.getElementById(
      "description"
    ).value
  );

  formData.append(
    "rating",
    4.5
  );


  const image =
    document.getElementById(
      "image"
    ).files[0];


  if (image) {
    formData.append(
      "image",
      image
    );
  }


  try {
    const res = await fetch(
      PRODUCT_API,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${adminToken}`,
        },

        body: formData,
      }
    );


    const data =
      await res.json();


    if (!res.ok) {
      alert(
        data.message ||
          "Failed to add product."
      );

      return;
    }


    alert(
      "✅ Product added successfully!"
    );


    form.reset();


    window.location.href =
      "products.html";

  } catch (error) {
    console.error(
      "Add product error:",
      error
    );

    alert(
      "Backend connection failed."
    );
  }
}


// ========================================
// ADMIN ORDERS
// ========================================

let adminOrdersCache = [];


// ========================================
// STATUS OPTIONS
// ========================================

function getStatusOptions(
  currentStatus
) {
  const statuses = [
    "Order Placed",
    "Confirmed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];


  let html = "";


  // Support old orders
  if (
    currentStatus === "Pending"
  ) {
    html += `
      <option
        value="Pending"
        selected
        disabled
      >
        Pending
      </option>
    `;
  }


  statuses.forEach((status) => {
    html += `
      <option
        value="${status}"
        ${
          currentStatus === status
            ? "selected"
            : ""
        }
      >
        ${status}
      </option>
    `;
  });


  return html;
}


// ========================================
// LOAD ADMIN ORDERS
// ========================================

async function loadAdminOrders() {
  const table =
    document.getElementById(
      "adminOrders"
    );

  if (!table) return;


  table.innerHTML = `
    <tr>
      <td colspan="7">
        Loading orders...
      </td>
    </tr>
  `;


  try {
    const response =
      await fetch(
        `${ORDER_API}/admin/all`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${adminToken}`,
          },
        }
      );


    const data =
      await response.json();


    if (
      response.status === 401 ||
      response.status === 403
    ) {
      alert(
        data.message ||
          "Admin session expired."
      );

      adminLogout();

      return;
    }


    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to load orders."
      );
    }


    const orders =
      data.orders || [];


    adminOrdersCache =
      orders;


    if (
      orders.length === 0
    ) {
      table.innerHTML = `
        <tr>
          <td colspan="7">
            No orders found.
          </td>
        </tr>
      `;

      return;
    }


    table.innerHTML = "";


    orders.forEach((order) => {

      const products =
        (order.items || [])
          .map((item) => {

            const name =
              item.product?.name ||
              "Product";

            const quantity =
              Number(
                item.quantity
              ) || 1;

            return `
              <div
                class="admin-order-product"
              >
                ${escapeAdminHtml(
                  name
                )}
                × ${quantity}
              </div>
            `;
          })
          .join("");


      const displayOrderNumber =
        order.orderNumber ||
        `ELT-${String(
          order._id
        )
          .slice(-8)
          .toUpperCase()}`;


      const paymentMethod =
        order.payment?.method ||
        "N/A";


      const paymentStatus =
        order.payment?.status ||
        "Pending";


      const location =
        order.currentLocation ||
        {};


      const latitude =
        Number(
          location.latitude
        );


      const longitude =
        Number(
          location.longitude
        );


      const hasLocation =
        Number.isFinite(latitude) &&
        Number.isFinite(longitude);


      table.innerHTML += `
        <tr>

          <!-- ORDER -->
          <td>

            <strong>
              ${escapeAdminHtml(
                displayOrderNumber
              )}
            </strong>

            <small
              class="admin-order-date"
            >
              ${formatAdminDate(
                order.createdAt
              )}
            </small>

          </td>


          <!-- CUSTOMER -->
          <td>

            <strong>
              ${escapeAdminHtml(
                order.user?.name ||
                  "Customer"
              )}
            </strong>

            <small>
              ${escapeAdminHtml(
                order.user?.email ||
                  ""
              )}
            </small>

          </td>


          <!-- PRODUCTS -->
          <td>
            ${products}
          </td>


          <!-- TOTAL -->
          <td>

            <strong>
              Rs.
              ${formatAdminMoney(
                order.totalAmount
              )}
            </strong>

          </td>


          <!-- PAYMENT -->
          <td>

            <div
              class="admin-payment-info"
            >

              <strong>
                ${escapeAdminHtml(
                  paymentMethod
                )}
              </strong>

              <span>
                ${escapeAdminHtml(
                  paymentStatus
                )}
              </span>

            </div>

          </td>


          <!-- STATUS -->
          <td>

            <select
              class="admin-status-select"
              onchange="
                updateOrderStatus(
                  '${order._id}',
                  this.value,
                  this
                )
              "
            >
              ${getStatusOptions(
                order.status
              )}
            </select>

          </td>


          <!-- DELIVERY -->
          <td>

            <button
              type="button"
              class="location-btn"
              onclick="
                openLocationModal(
                  '${order._id}'
                )
              "
            >
              ${
                hasLocation
                  ? "Update Location"
                  : "Add Location"
              }
            </button>


            ${
              hasLocation
                ? `
                  <small
                    class="location-added"
                  >
                    📍 Location set
                  </small>
                `
                : `
                  <small
                    class="location-missing"
                  >
                    No location yet
                  </small>
                `
            }

          </td>

        </tr>
      `;
    });

  } catch (error) {

    console.error(
      "Load admin orders error:",
      error
    );


    table.innerHTML = `
      <tr>
        <td colspan="7">
          ${escapeAdminHtml(
            error.message ||
              "Failed to load orders."
          )}
        </td>
      </tr>
    `;
  }
}


// ========================================
// UPDATE ORDER STATUS
// ========================================

async function updateOrderStatus(
  id,
  status,
  selectElement
) {
  if (!status) return;


  const confirmed =
    confirm(
      `Change order status to "${status}"?`
    );


  if (!confirmed) {
    await loadAdminOrders();

    return;
  }


  try {
    if (selectElement) {
      selectElement.disabled =
        true;
    }


    const response =
      await fetch(
        `${ORDER_API}/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${adminToken}`,
          },

          body: JSON.stringify({
            status,
          }),
        }
      );


    const data =
      await response.json();


    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to update order."
      );
    }


    alert(
      `Order updated to ${status}.`
    );


    await loadAdminOrders();

    await loadDashboardStats();

  } catch (error) {

    console.error(
      "Update order error:",
      error
    );


    alert(
      error.message ||
        "Failed to update order."
    );


    await loadAdminOrders();
  }
}


// ========================================
// OPEN LOCATION MODAL
// ========================================

function openLocationModal(
  orderId
) {
  const modal =
    document.getElementById(
      "locationModal"
    );


  if (!modal) return;


  const order =
    adminOrdersCache.find(
      (item) =>
        item._id === orderId
    );


  if (!order) {
    alert(
      "Order information not found."
    );

    return;
  }


  const location =
    order.currentLocation ||
    {};


  document.getElementById(
    "locationOrderId"
  ).value = orderId;


  document.getElementById(
    "deliveryLatitude"
  ).value =
    location.latitude ?? "";


  document.getElementById(
    "deliveryLongitude"
  ).value =
    location.longitude ?? "";


  document.getElementById(
    "deliveryAddress"
  ).value =
    location.address || "";


  modal.classList.add(
    "show"
  );
}


// ========================================
// CLOSE LOCATION MODAL
// ========================================

function closeLocationModal() {
  const modal =
    document.getElementById(
      "locationModal"
    );


  if (!modal) return;


  modal.classList.remove(
    "show"
  );
}


// ========================================
// SAVE DELIVERY LOCATION
// ========================================

async function saveDeliveryLocation() {

  const orderId =
    document.getElementById(
      "locationOrderId"
    ).value;


  const latitude =
    Number(
      document.getElementById(
        "deliveryLatitude"
      ).value
    );


  const longitude =
    Number(
      document.getElementById(
        "deliveryLongitude"
      ).value
    );


  const address =
    document
      .getElementById(
        "deliveryAddress"
      )
      .value
      .trim();


  if (!orderId) {
    alert(
      "Order ID is missing."
    );

    return;
  }


  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    alert(
      "Enter a valid latitude between -90 and 90."
    );

    return;
  }


  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    alert(
      "Enter a valid longitude between -180 and 180."
    );

    return;
  }


  const button =
    document.querySelector(
      ".save-location-btn"
    );


  try {
    if (button) {
      button.disabled = true;

      button.textContent =
        "Updating...";
    }


    const response =
      await fetch(
        `${ORDER_API}/${orderId}/location`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${adminToken}`,
          },

          body: JSON.stringify({
            latitude,
            longitude,
            address,
          }),
        }
      );


    const data =
      await response.json();


    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to update location."
      );
    }


    alert(
      "Delivery location updated successfully."
    );


    closeLocationModal();


    await loadAdminOrders();

  } catch (error) {

    console.error(
      "Location update error:",
      error
    );


    alert(
      error.message ||
        "Failed to update delivery location."
    );

  } finally {

    if (button) {
      button.disabled = false;

      button.textContent =
        "Update Location";
    }
  }
}


// ========================================
// CLOSE LOCATION MODAL BY CLICKING OUTSIDE
// ========================================

window.addEventListener(
  "click",
  (event) => {

    const modal =
      document.getElementById(
        "locationModal"
      );


    if (
      modal &&
      event.target === modal
    ) {
      closeLocationModal();
    }
  }
);


// ========================================
// EDIT PRODUCT
// ========================================

const editForm =
  document.getElementById(
    "editProductForm"
  );


async function loadEditProduct() {

  if (!editForm) return;


  const params =
    new URLSearchParams(
      window.location.search
    );


  const id =
    params.get("id");


  if (!id) {
    alert(
      "Product ID is missing."
    );

    return;
  }


  try {
    const res =
      await fetch(
        `${PRODUCT_API}/${id}`
      );


    const product =
      await res.json();


    if (!res.ok) {
      throw new Error(
        product.message ||
          "Failed to load product."
      );
    }


    document.getElementById(
      "name"
    ).value =
      product.name || "";


    document.getElementById(
      "brand"
    ).value =
      product.brand || "";


    document.getElementById(
      "category"
    ).value =
      product.category || "";


    document.getElementById(
      "price"
    ).value =
      product.price || 0;


    document.getElementById(
      "stock"
    ).value =
      product.stock || 0;


    document.getElementById(
      "description"
    ).value =
      product.description || "";

  } catch (error) {

    console.error(
      "Load edit product error:",
      error
    );


    alert(
      error.message ||
        "Failed to load product."
    );
  }
}


// ========================================
// UPDATE PRODUCT
// ========================================

async function updateProduct(
  event
) {
  event.preventDefault();


  const params =
    new URLSearchParams(
      window.location.search
    );


  const id =
    params.get("id");


  if (!id) {
    alert(
      "Product ID is missing."
    );

    return;
  }


  const formData =
    new FormData();


  formData.append(
    "name",
    document.getElementById(
      "name"
    ).value
  );


  formData.append(
    "brand",
    document.getElementById(
      "brand"
    ).value
  );


  formData.append(
    "category",
    document.getElementById(
      "category"
    ).value
  );


  formData.append(
    "price",
    document.getElementById(
      "price"
    ).value
  );


  formData.append(
    "stock",
    document.getElementById(
      "stock"
    ).value
  );


  formData.append(
    "description",
    document.getElementById(
      "description"
    ).value
  );


  const image =
    document.getElementById(
      "image"
    ).files[0];


  if (image) {
    formData.append(
      "image",
      image
    );
  }


  try {
    const res =
      await fetch(
        `${PRODUCT_API}/${id}`,
        {
          method: "PUT",

          headers: {
            Authorization:
              `Bearer ${adminToken}`,
          },

          body: formData,
        }
      );


    const data =
      await res.json();


    if (!res.ok) {
      alert(
        data.message ||
          "Failed to update product."
      );

      return;
    }


    alert(
      "Product updated successfully."
    );


    window.location.href =
      "products.html";

  } catch (error) {

    console.error(
      "Update product error:",
      error
    );


    alert(
      "Backend connection failed."
    );
  }
}


// ========================================
// INITIALIZE ADMIN PAGES
// ========================================

loadDashboardStats();

loadProducts();

loadAdminOrders();

loadEditProduct();