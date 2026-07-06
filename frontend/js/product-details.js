const API_URL = "http://localhost:5000/api/products";

let qty = 1;
let product = null;

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

async function loadDetails() {
  try {
    const res = await fetch(`${API_URL}/${productId}`);
    product = await res.json();

    if (!res.ok) {
      document.querySelector(".details-page").innerHTML = "<p>Product not found.</p>";
      return;
    }

    document.querySelector(".breadcrumb").textContent =
      `Home / Products / ${product.name}`;

    document.querySelector(".main-product-img").innerHTML =
      `<img src="http://localhost:5000${product.image}" alt="${product.name}">`

    document.querySelector(".info-area h1").textContent = product.name;

    document.querySelector(".rating").innerHTML =
      `⭐ ${product.rating} <small>245 reviews</small>`;

    document.querySelector(".info-area h2").textContent =
      `Rs. ${product.price}`;

    document.querySelector(".desc").textContent = product.description;

  } catch (error) {
    document.querySelector(".details-page").innerHTML =
      "<p>Failed to load product details.</p>";
  }
}

function plusQty() {
  qty++;
  document.getElementById("qtyValue").textContent = qty;
}

function minusQty() {
  if (qty > 1) {
    qty--;
    document.getElementById("qtyValue").textContent = qty;
  }
}
async function addDetailCart() {

  if (!product) {
    showToast("Product not loaded");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !user._id) {
    showToast("Please login first");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);

    return;
  }

  try {

    const res = await fetch("http://localhost:5000/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: user._id,
        product: product._id,
        quantity: qty,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Failed to add cart");
      return;
    }

    updateCartCount();

    showToast("Product added to cart");

  } catch (error) {

    showToast("Backend connection failed");

  }

}

loadDetails();
