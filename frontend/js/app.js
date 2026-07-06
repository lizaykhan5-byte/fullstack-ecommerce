const products = [
  {
    id: 1,
    name: "Wireless Bluetooth Headphones",
    price: 4500,
    oldPrice: 6000,
    rating: "★★★★☆",
    image: "https://m.media-amazon.com/images/I/61CGHv6kmWL._AC_SL1500_.jpg"
  },
  {
    id: 2,
    name: "Smart Watch Fitness Tracker",
    price: 7200,
    oldPrice: 9500,
    rating: "★★★★★",
    image: "https://m.media-amazon.com/images/I/61ZjlBOp+rL._AC_SL1500_.jpg"
  },
  {
    id: 3,
    name: "Laptop Stand Adjustable",
    price: 2800,
    oldPrice: 3500,
    rating: "★★★★☆",
    image: "https://m.media-amazon.com/images/I/71Zf9uUp+GL._AC_SL1500_.jpg"
  },
  {
    id: 4,
    name: "USB-C Fast Charging Cable",
    price: 950,
    oldPrice: 1400,
    rating: "★★★★☆",
    image: "https://m.media-amazon.com/images/I/61aJc8wQX4L._AC_SL1500_.jpg"
  },
  {
    id: 5,
    name: "Gaming Mouse RGB",
    price: 2500,
    oldPrice: 3300,
    rating: "★★★★☆",
    image: "https://m.media-amazon.com/images/I/61mpMH5TzkL._AC_SL1500_.jpg"
  },
  {
    id: 6,
    name: "Power Bank 10000mAh",
    price: 5200,
    oldPrice: 6500,
    rating: "★★★★★",
    image: "https://m.media-amazon.com/images/I/61Qe0euJJZL._AC_SL1500_.jpg"
  },
  {
    id: 7,
    name: "Wireless Keyboard Compact",
    price: 3400,
    oldPrice: 4200,
    rating: "★★★★☆",
    image: "https://m.media-amazon.com/images/I/61pUul1oDlL._AC_SL1500_.jpg"
  },
  {
    id: 8,
    name: "LED Desk Lamp",
    price: 3900,
    oldPrice: 5200,
    rating: "★★★★☆",
    image: "https://m.media-amazon.com/images/I/61kU+O4Q8QL._AC_SL1500_.jpg"
  }
];

const productList = document.getElementById("productList");

if (productList) {
  products.forEach(product => {
    productList.innerHTML += `
      <div class="product-card">
        <div class="discount">Deal</div>

        <div class="product-img">
          <img src="${product.image}" alt="${product.name}">
        </div>

        <h3>${product.name}</h3>
        <p class="rating">${product.rating}</p>

        <div class="price">
          Rs. ${product.price}
          <small>Rs. ${product.oldPrice}</small>
        </div>

        <button onclick="addToCart(${product.id})">Add to Cart</button>
      </div>
    `;
  });
}

function addToCart(id) {
  const product = products.find(item => item.id === id);
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  cart.push(product);
  localStorage.setItem("cart", JSON.stringify(cart));

  document.getElementById("cartCount").textContent = cart.length;
  alert("Added to cart");
}