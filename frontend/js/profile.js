  const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "login.html";
}

document.getElementById("userName").textContent =
    user.name || "EliteStore User";

document.getElementById("userEmail").textContent =
    user.email || "No Email";

function logout() {

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    showToast("Logged out successfully");

    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);

}