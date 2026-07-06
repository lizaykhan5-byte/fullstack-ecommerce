const wishlistGrid = document.getElementById("wishlistGrid");

let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

function loadWishlist() {

    if (wishlist.length === 0) {

        wishlistGrid.innerHTML = `
            <div class="empty-wishlist">
                <h2>Your wishlist is empty ❤️</h2>
                <p>Save your favorite products to see them here.</p>
            </div>
        `;

        return;
    }

    wishlistGrid.innerHTML = "";

    wishlist.forEach((product, index) => {

        wishlistGrid.innerHTML += `

            <div class="wishlist-card">

                <div class="wishlist-img">
                    <img src="${product.image}" alt="${product.name}">
                </div>

                <h3>${product.name}</h3>

                <p>Rs. ${product.price}</p>

                <button onclick="removeWishlist(${index})">
                    Remove
                </button>

            </div>

        `;

    });

}

function removeWishlist(index) {

    wishlist.splice(index, 1);

    localStorage.setItem("wishlist", JSON.stringify(wishlist));

    loadWishlist();

    showToast("Removed from wishlist");

}

loadWishlist();