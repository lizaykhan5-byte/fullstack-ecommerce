document.getElementById("navbar").innerHTML = `
  <header class="navbar">
    <a href="index.html" class="logo">Elite<span>Store</span></a>

    <div class="search">
      <input type="text" id="searchInput" placeholder="Search products">
      <button onclick="searchProducts()">Search</button>
    </div>

    <nav>
      <a href="index.html">Home</a>
      <a href="register.html">Register</a>
      <a href="login.html">Login</a>
      <a href="products.html">Products</a>
      <a href="contact.html">Contact</a>
      
      <a href="cart.html" class="cart">Cart <span id="cartCount">0</span></a>
    </nav>
  </header>
`;

async function updateCartCount() {
  const user = JSON.parse(localStorage.getItem("user"));
  const count = document.getElementById("cartCount");

  if (!count) return;

  if (!user || !user._id) {
    count.textContent = 0;
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/cart/${user._id}`);
    const cartItems = await res.json();

    count.textContent = cartItems.length;
  } catch (error) {
    count.textContent = 0;
  }
}

function searchProducts() {
  const input = document.getElementById("searchInput");
  const searchValue = input.value.trim();

  if (searchValue === "") {
    showToast("Please enter product name");
    return;
  }

  localStorage.setItem("searchQuery", searchValue);
  window.location.href = "products.html";
}

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

updateCartCount();
function checkLogin() {


    const user = JSON.parse(localStorage.getItem("user"));

    const nav = document.querySelector("nav");

    if (!user || !nav) return;

       if (user.role === "admin") {

    nav.innerHTML = `
        <a href="index.html">Home</a>
        <a href="products.html">Products</a>
        <a href="admin/dashboard.html">🛠 Admin Panel</a>
        <a href="#" onclick="logout()">Logout</a>
    `;

} else {

    nav.innerHTML = `
        <a href="index.html">Home</a>
        <a href="products.html">Products</a>
        <a href="contact.html">Contact</a>
        <a href="profile.html">Profile</a>
        <a href="#" onclick="logout()">Logout</a>

        <a href="cart.html" class="cart">
            Cart <span id="cartCount">0</span>
        </a>
    `;

}
    updateCartCount();
}
function logout() {

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    showToast("Logged out successfully");

    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);

}

checkLogin();