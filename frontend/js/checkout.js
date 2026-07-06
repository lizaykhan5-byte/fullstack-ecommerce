const CART_API = "http://localhost:5000/api/cart";
const ORDER_API = "http://localhost:5000/api/orders";

const checkoutItems = document.getElementById("checkoutItems");
const checkoutSubtotal = document.getElementById("checkoutSubtotal");
const checkoutTotal = document.getElementById("checkoutTotal");

const user = JSON.parse(localStorage.getItem("user"));
let cart = [];
let subtotal = 0;

if (!user || !user._id) {
  showToast("Please login first");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
}

async function loadCheckout() {
  try {
    const res = await fetch(`${CART_API}/${user._id}`);
    cart = await res.json();

    checkoutItems.innerHTML = "";
    subtotal = 0;

    if (cart.length === 0) {
      checkoutItems.innerHTML = "<p>Your cart is empty.</p>";
      checkoutSubtotal.textContent = "Rs. 0";
      checkoutTotal.textContent = "Rs. 0";
      return;
    }

    cart.forEach(item => {
      const product = item.product;
      const qty = item.quantity || 1;
      const itemTotal = product.price * qty;

      subtotal += itemTotal;

      checkoutItems.innerHTML += `
        <div class="checkout-item">
          <span>${product.name} x ${qty}</span>
          <strong>Rs. ${itemTotal}</strong>
        </div>
      `;
    });

    checkoutSubtotal.textContent = `Rs. ${subtotal}`;
    checkoutTotal.textContent = `Rs. ${subtotal + 250}`;

  } catch (error) {
    checkoutItems.innerHTML = "<p>Failed to load checkout.</p>";
  }
}

async function placeOrder(event) {
  event.preventDefault();

  if (cart.length === 0) {
    showToast("Your cart is empty.");
    return;
  }

  const orderItems = cart.map(item => ({
    product: item.product._id,
    quantity: item.quantity || 1,
    price: item.product.price
  }));

  try {
    const res = await fetch(ORDER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user: user._id,
        items: orderItems,
        totalAmount: subtotal + 250,
        status: "Pending"
      })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Order failed");
      return;
    }

    for (const item of cart) {
      await fetch(`${CART_API}/${item._id}`, {
        method: "DELETE"
      });
    }

    showToast("Order placed successfully");

    setTimeout(() => {
      window.location.href = "orders.html";
    }, 1000);

  } catch (error) {
    showToast("Backend connection failed");
  }
}

loadCheckout();