const API_URL = "http://localhost:5000/api/products";
const productsList = document.getElementById("productsList");

let products = [];

async function getProducts() {
  try {
    const res = await fetch(API_URL);
    products = await res.json();

    displayProducts(products);
  } catch (error) {
    productsList.innerHTML = `<p class="no-products">Failed to load products.</p>`;
  }
}

function displayProducts(data) {
  productsList.innerHTML = "";

  if (data.length === 0) {
    productsList.innerHTML = `<p class="no-products">No products found.</p>`;
    return;
  }

  data.forEach(product => {
    productsList.innerHTML += `
      <div class="product-card">
        <button class="wish-btn" onclick="addToWishlist('${product._id}')">❤️</button>

        <div class="product-img">
        <img src="http://localhost:5000${product.image}" alt="${product.name}">
        </div>

        <h3>${product.name}</h3>
        <div class="rating">⭐ ${product.rating}</div>
        <div class="price">Rs. ${product.price}</div>

        <button onclick="addToCart('${product._id}')">Add to Cart</button>

        <a href="product-details.html?id=${product._id}" class="details-link">
          View Details
        </a>
      </div>
    `;
  });
}
async function addToCart(id) {
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user: user._id,
        product: id,
        quantity: 1
      })
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

function addToWishlist(id) {
  const product = products.find(item => item._id === id);
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  const exists = wishlist.find(item => item._id === id);

  if (exists) {
    showToast("Already in wishlist");
    return;
  }

  wishlist.push(product);
  localStorage.setItem("wishlist", JSON.stringify(wishlist));

  showToast("Added to wishlist ❤️");
}

document.querySelectorAll(".category-filter, .price-filter").forEach(input => {
  input.addEventListener("change", () => {
    let filtered = [...products];

    const selectedCategories = Array.from(
      document.querySelectorAll(".category-filter:checked")
    ).map(input => input.value);

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product =>
        selectedCategories.includes(product.category)
      );
    }

    const selectedPrice = document.querySelector(".price-filter:checked");

    if (selectedPrice) {
      if (selectedPrice.value === "under3000") {
        filtered = filtered.filter(product => product.price < 3000);
      }

      if (selectedPrice.value === "3000to6000") {
        filtered = filtered.filter(product => product.price >= 3000 && product.price <= 6000);
      }

      if (selectedPrice.value === "above6000") {
        filtered = filtered.filter(product => product.price > 6000);
      }
    }

    displayProducts(filtered);
  });
});

getProducts();