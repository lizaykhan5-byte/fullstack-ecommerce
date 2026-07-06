const CART_API = "http://localhost:5000/api/cart";

const cartItems = document.getElementById("cartItems");
const subtotal = document.getElementById("subtotal");
const total = document.getElementById("total");

let cart = [];

const user = JSON.parse(localStorage.getItem("user"));

if (!user || !user._id) {
  showToast("Please login first");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
}

async function loadCart() {
  try {
    const res = await fetch(`${CART_API}/${user._id}`);
    cart = await res.json();

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="empty-cart">
          <h2>Your cart is empty 🛒</h2>
          <p>Add some products to continue shopping.</p>
        </div>
      `;

      subtotal.textContent = "Rs. 0";
      total.textContent = "Rs. 0";
      return;
    }

    cartItems.innerHTML = "";
    let subTotalPrice = 0;

    cart.forEach((item) => {
      const product = item.product;
      const qty = item.quantity || 1;

      subTotalPrice += product.price * qty;

      cartItems.innerHTML += `
        <div class="cart-item">
          <div class="cart-img">
            <img src="http://localhost:5000${product.image}" alt="${product.name}">
          </div>

          <div class="cart-info">
            <h3>${product.name}</h3>
            <p>Rs. ${product.price}</p>

            <div class="qty-control">
  <button onclick="decreaseQty('${item._id}', ${qty})">-</button>
  <span>${qty}</span>
  <button onclick="increaseQty('${item._id}', ${qty})">+</button>
</div>
          </div>

          <button class="remove-btn" onclick="removeItem('${item._id}')">
            Remove
          </button>
        </div>
      `;
    });

    subtotal.textContent = `Rs. ${subTotalPrice}`;
    total.textContent = `Rs. ${subTotalPrice + 250}`;
  } catch (error) {
    cartItems.innerHTML = `<div class="empty-cart">Failed to load cart.</div>`;
  }
}

async function removeItem(cartItemId) {
  try {
    const res = await fetch(`${CART_API}/${cartItemId}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Failed to remove item");
      return;
    }

    showToast("Item removed");
    loadCart();
  } catch (error) {
    showToast("Backend connection failed");
  }
}

function goCheckout() {
  if (cart.length === 0) {
    showToast("Your cart is empty.");
    return;
  }

  window.location.href = "checkout.html";
}

loadCart();
async function increaseQty(id, currentQty) {
  await updateQty(id, currentQty + 1);
}

async function decreaseQty(id, currentQty) {
  if (currentQty <= 1) {
    showToast("Minimum quantity is 1");
    return;
  }

  await updateQty(id, currentQty - 1);
}

async function updateQty(id, quantity) {
  try {
    const res = await fetch(`http://localhost:5000/api/cart/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Failed to update quantity");
      return;
    }

    loadCart();
  } catch (error) {
    showToast("Backend connection failed");
  }
}