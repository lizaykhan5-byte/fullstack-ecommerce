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
const API_URL = "http://localhost:5000/api/users";

async function registerUser(event) {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Registration failed");
      return;
    }

    showToast("Account created successfully");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);

  } catch (error) {
    showToast("Backend connection failed");
  }
}

async function loginUser(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Login failed");
      return;
    }

    localStorage.setItem("token", data.token || "");
    localStorage.setItem("user", JSON.stringify(data.user || { email }));

    showToast("Login successful");


setTimeout(() => {
  if (data.user.role === "admin") {
    window.location.href = "admin/dashboard.html";
  } else {
    window.location.href = "index.html";
  }
}, 1000);
    
  } catch (error) {
    showToast("Backend connection failed");
  }
}
function checkPasswordStrength() {
  const password = document.getElementById("registerPassword").value;
  const bar = document.getElementById("strengthBar");
  const text = document.getElementById("strengthText");

  let strength = 0;

  if (password.length >= 6) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (password.length === 0) {
    bar.style.width = "0%";
    text.textContent = "";
  } else if (strength <= 1) {
    bar.style.width = "30%";
    bar.style.background = "#dc2626";
    text.textContent = "Weak password";
  } else if (strength === 2 || strength === 3) {
    bar.style.width = "65%";
    bar.style.background = "#f59e0b";
    text.textContent = "Medium password";
  } else {
    bar.style.width = "100%";
    bar.style.background = "#16a34a";
    text.textContent = "Strong password";
  }
}