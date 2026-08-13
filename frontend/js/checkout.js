function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

const CART_API = "http://localhost:5000/api/cart";
const ORDER_API = "http://localhost:5000/api/orders";

const checkoutItems = document.getElementById("checkoutItems");
const checkoutSubtotal = document.getElementById("checkoutSubtotal");
const checkoutTotal = document.getElementById("checkoutTotal");

const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

let cart = [];
let subtotal = 0;

// ========================================
// LOGIN CHECK
// ========================================
if (!user || !user._id || !token) {
  showToast("Please login first");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
}

// ========================================
// PREFILL USER DATA
// ========================================
function prefillUserData() {
  if (!user) return;

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");

  if (fullNameInput && user.name) {
    fullNameInput.value = user.name;
  }

  if (emailInput && user.email) {
    emailInput.value = user.email;
  }
}

// ========================================
// LOAD CHECKOUT CART
// ========================================
async function loadCheckout() {
  if (!user || !user._id) return;

  try {
    const res = await fetch(`${CART_API}/${user._id}`);

    if (!res.ok) {
      throw new Error("Failed to load cart");
    }

    cart = await res.json();

    checkoutItems.innerHTML = "";
    subtotal = 0;

    if (!Array.isArray(cart) || cart.length === 0) {
      checkoutItems.innerHTML =
        "<p>Your cart is empty.</p>";

      checkoutSubtotal.textContent = "Rs. 0";
      checkoutTotal.textContent = "Rs. 0";

      return;
    }

    cart.forEach((item) => {
      const product = item.product;
      const qty = Number(item.quantity) || 1;

      if (!product) return;

      const itemTotal =
        Number(product.price) * qty;

      subtotal += itemTotal;

      checkoutItems.innerHTML += `
        <div class="checkout-item">
          <span>${product.name} x ${qty}</span>
          <strong>Rs. ${itemTotal.toLocaleString()}</strong>
        </div>
      `;
    });

    checkoutSubtotal.textContent =
      `Rs. ${subtotal.toLocaleString()}`;

    checkoutTotal.textContent =
      `Rs. ${(subtotal + 250).toLocaleString()}`;
  } catch (error) {
    console.error("Checkout load error:", error);

    checkoutItems.innerHTML =
      "<p>Failed to load checkout.</p>";
  }
}

// ========================================
// PLACE ORDER
// ========================================
async function placeOrder(event) {
  event.preventDefault();

  if (!token) {
    showToast("Your session has expired. Please login again.");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);

    return;
  }

  if (!Array.isArray(cart) || cart.length === 0) {
    showToast("Your cart is empty.");
    return;
  }

  // ----------------------------------------
  // Get checkout form values
  // ----------------------------------------
  const fullName =
    document.getElementById("fullName").value.trim();

  const phone =
    document.getElementById("phone").value.trim();

  const email =
    document.getElementById("email").value.trim();

  const address =
    document.getElementById("address").value.trim();

  const city =
    document.getElementById("city").value.trim();

  const paymentMethod =
    document.getElementById("payment").value;

  // ----------------------------------------
  // Validation
  // ----------------------------------------
  if (
    !fullName ||
    !phone ||
    !email ||
    !address ||
    !city ||
    !paymentMethod
  ) {
    showToast("Please complete all checkout fields.");
    return;
  }

  // Basic Pakistan phone validation
  const cleanPhone = phone.replace(/[\s-]/g, "");

  const phoneRegex =
    /^(\+92|92|0)?3[0-9]{9}$/;

  if (!phoneRegex.test(cleanPhone)) {
    showToast(
      "Please enter a valid Pakistani mobile number."
    );

    return;
  }

  // ----------------------------------------
  // Online payment comes in next step
  // For now COD is fully testable
  // ----------------------------------------
  if (
    paymentMethod === "Card Payment" ||
    paymentMethod === "Bank Transfer"
  ) {
    showToast(
      "Online payment integration is being added next. Please use Cash on Delivery for this test."
    );

    return;
  }

  // ----------------------------------------
  // IMPORTANT:
  // Only send product ID + quantity.
  // Backend gets real prices from MongoDB.
  // ----------------------------------------
  const orderItems = cart.map((item) => ({
    product: item.product._id,
    quantity: Number(item.quantity) || 1,
  }));

  const shippingAddress = {
    fullName,
    phone: cleanPhone,
    email,
    addressLine1: address,
    city,
    country: "Pakistan",
  };

  const placeButton =
    document.querySelector(".place-btn");

  try {
    if (placeButton) {
      placeButton.disabled = true;
      placeButton.textContent =
        "Placing Order...";
    }

    const res = await fetch(ORDER_API, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        items: orderItems,
        shippingAddress,
        paymentMethod,
      }),
    });

    const data = await res.json();

    // ----------------------------------------
    // Invalid / expired token
    // ----------------------------------------
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
      showToast(
        data.message || "Unable to place order."
      );

      return;
    }

    // ----------------------------------------
    // Clear cart ONLY after successful order
    // ----------------------------------------
    for (const item of cart) {
      try {
        await fetch(
          `${CART_API}/${item._id}`,
          {
            method: "DELETE",
          }
        );
      } catch (error) {
        console.error(
          "Cart cleanup error:",
          error
        );
      }
    }

    // Save order info for thank-you page
    localStorage.setItem(
      "lastOrder",
      JSON.stringify(data.order)
    );

    showToast(
      `Order ${data.order.orderNumber} placed successfully!`
    );

    setTimeout(() => {
      window.location.href =
        "thankyou.html";
    }, 1200);
  } catch (error) {
    console.error(
      "Place order error:",
      error
    );

    showToast(
      "Could not connect to the server."
    );
  } finally {
    if (placeButton) {
      placeButton.disabled = false;
      placeButton.textContent =
        "Place Order";
    }
  }
}

// ========================================
// INITIALIZE
// ========================================
prefillUserData();
loadCheckout();