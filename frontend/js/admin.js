const loggedUser = JSON.parse(localStorage.getItem("user"));

if (!loggedUser || loggedUser.role !== "admin") {
  alert("Access denied. Admin only.");
  window.location.href = "../login.html";
}

const PRODUCT_API = "http://localhost:5000/api/products";
const ORDER_API = "http://localhost:5000/api/orders";

// Dashboard
async function loadDashboardStats() {
  const totalProducts = document.getElementById("totalProducts");
  const totalOrders = document.getElementById("totalOrders");
  const pendingOrders = document.getElementById("pendingOrders");
  const totalRevenue = document.getElementById("totalRevenue");

  if (!totalProducts) return;

  try {
    const productsRes = await fetch(PRODUCT_API);
    const products = await productsRes.json();

    const ordersRes = await fetch(`${ORDER_API}/admin/all`);
    const orders = await ordersRes.json();

    const pending = orders.filter(order => order.status === "Pending");
    const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    totalProducts.textContent = products.length;
    totalOrders.textContent = orders.length;
    pendingOrders.textContent = pending.length;
    totalRevenue.textContent = `Rs. ${revenue}`;
  } catch (error) {
    console.log("Failed to load dashboard stats");
  }
}

function adminLogout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "../login.html";
}

loadDashboardStats();

// Products Table
async function loadProducts() {
  const table = document.getElementById("adminProducts");

  if (!table) return;

  try {
    const res = await fetch(PRODUCT_API);
    const products = await res.json();

    table.innerHTML = "";

    products.forEach(product => {
      table.innerHTML += `
        <tr>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${product.brand || "-"}</td>
          <td>Rs. ${product.price}</td>
          <td>${product.stock}</td>
          <td>
            <button
              class="edit-btn"
              onclick="window.location.href='edit-product.html?id=${product._id}'">
              Edit
            </button>

            <button
              class="delete-btn"
              onclick="deleteProduct('${product._id}')">
              Delete
            </button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.log(error);
  }
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  try {
    await fetch(`${PRODUCT_API}/${id}`, {
      method: "DELETE",
    });

    loadProducts();
  } catch (error) {
    alert("Failed to delete product");
  }
}

loadProducts();

// Add Product with Image Upload
async function addProduct(event) {
  event.preventDefault();

  const form = document.getElementById("productForm");
  if (!form) return;

  const formData = new FormData();

  formData.append("name", document.getElementById("name").value);
  formData.append("brand", document.getElementById("brand").value);
  formData.append("category", document.getElementById("category").value);
  formData.append("price", document.getElementById("price").value);
  formData.append("stock", document.getElementById("stock").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("rating", 4.5);

  const image = document.getElementById("image").files[0];

  if (image) {
    formData.append("image", image);
  }

  try {
    const res = await fetch(PRODUCT_API, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to add product");
      return;
    }

    alert("✅ Product added successfully!");
    form.reset();
    window.location.href = "products.html";
  } catch (error) {
    alert("Backend connection failed");
  }
}

// Admin Orders
async function loadAdminOrders() {
  const table = document.getElementById("adminOrders");

  if (!table) return;

  try {
    const res = await fetch(`${ORDER_API}/admin/all`);
    const orders = await res.json();

    table.innerHTML = "";

    orders.forEach(order => {
      const products = order.items
        .map(item => `${item.product?.name || "Product"} × ${item.quantity}`)
        .join("<br>");

      table.innerHTML += `
        <tr>
          <td>${order.user?.name || "Customer"}</td>
          <td>${products}</td>
          <td>Rs. ${order.totalAmount}</td>
          <td>${order.status}</td>
          <td>
            <select onchange="updateOrderStatus('${order._id}', this.value)">
              <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
              <option value="Shipped" ${order.status === "Shipped" ? "selected" : ""}>Shipped</option>
              <option value="Delivered" ${order.status === "Delivered" ? "selected" : ""}>Delivered</option>
            </select>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    table.innerHTML = `<tr><td colspan="5">Failed to load orders</td></tr>`;
  }
}

async function updateOrderStatus(id, status) {
  try {
    await fetch(`${ORDER_API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    alert("Order status updated");
    loadAdminOrders();
  } catch (error) {
    alert("Failed to update order");
  }
}

loadAdminOrders();

// Edit Product
const editForm = document.getElementById("editProductForm");

async function loadEditProduct() {
  if (!editForm) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  try {
    const res = await fetch(`${PRODUCT_API}/${id}`);
    const product = await res.json();

    document.getElementById("name").value = product.name;
    document.getElementById("brand").value = product.brand || "";
    document.getElementById("category").value = product.category;
    document.getElementById("price").value = product.price;
    document.getElementById("stock").value = product.stock;
    document.getElementById("description").value = product.description;
  } catch (error) {
    alert("Failed to load product");
  }
}

async function updateProduct(event) {
  event.preventDefault();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const formData = new FormData();

  formData.append("name", document.getElementById("name").value);
  formData.append("brand", document.getElementById("brand").value);
  formData.append("category", document.getElementById("category").value);
  formData.append("price", document.getElementById("price").value);
  formData.append("stock", document.getElementById("stock").value);
  formData.append("description", document.getElementById("description").value);

  const image = document.getElementById("image").files[0];

  if (image) {
    formData.append("image", image);
  }

  try {
    const res = await fetch(`${PRODUCT_API}/${id}`, {
      method: "PUT",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to update product");
      return;
    }

    alert("Product updated successfully");
    window.location.href = "products.html";
  } catch (error) {
    alert("Backend connection failed");
  }
}

loadEditProduct();