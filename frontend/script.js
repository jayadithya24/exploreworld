const API_BASE = (() => {
  const { hostname, port, protocol } = window.location;

  if ((hostname === "localhost" || hostname === "127.0.0.1") && port !== "5000") {
    return `${protocol}//${hostname}:5000`;
  }

  return "/api";
})();
const AUTH_STORAGE_KEY = "exploreworldLoggedIn";
const DESTINATIONS_CACHE_KEY = "exploreworldDestinationsCache";

const FALLBACK_DESTINATIONS = [
  {
    name: "Paris",
    image_url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80",
    description: "Iconic city views, cafes, art, and timeless travel moments."
  },
  {
    name: "Bali",
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
    description: "A tropical escape with beaches, temples, and lush scenery."
  },
  {
    name: "New York",
    image_url: "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=900&q=80",
    description: "A fast-paced city full of landmarks, food, and nightlife."
  },
  {
    name: "Tokyo",
    image_url: "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=900&q=80",
    description: "Modern energy, neon streets, and unforgettable culture."
  },
  {
    name: "London",
    image_url: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80",
    description: "Classic landmarks, river views, and a lively city atmosphere."
  },
  {
    name: "Dubai",
    image_url: "https://images.unsplash.com/photo-1488747279002-c8523379faaa?auto=format&fit=crop&w=900&q=80",
    description: "Luxury shopping, desert adventures, and skyline views."
  },
  {
    name: "Rome",
    image_url: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=900&q=80",
    description: "Ancient history, beautiful piazzas, and classic Italian charm."
  },
  {
    name: "Singapore",
    image_url: "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=900&q=80",
    description: "Clean streets, gardens, food courts, and futuristic city design."
  },
  {
    name: "Sydney",
    image_url: "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?auto=format&fit=crop&w=900&q=80",
    description: "Harbor views, beaches, and a relaxed coastal city vibe."
  },
  {
    name: "Bangkok",
    image_url: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=900&q=80",
    description: "Street food, temples, markets, and vibrant city life."
  },
  {
    name: "Amsterdam",
    image_url: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=900&q=80",
    description: "Canals, bikes, museums, and a charming city atmosphere."
  },
  {
    name: "Seoul",
    image_url: "https://images.unsplash.com/photo-1528127269029-c440edc5a5e7?auto=format&fit=crop&w=900&q=80",
    description: "Modern neighborhoods, food culture, and colorful nightlife."
  }
];

function getCurrentPage() {
  const page = window.location.pathname.split("/").pop();
  return page ? page.toLowerCase() : "index.html";
}

function isLoggedIn() {
  return localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

function setLoggedIn(value) {
  localStorage.setItem(AUTH_STORAGE_KEY, value ? "true" : "false");
}

function enforceAuthRouting() {
  const page = getCurrentPage();
  const authPages = ["login.html", "register.html"];
  const publicPages = ["login.html", "register.html"];
  const protectedPages = [
    "index.html",
    "destinations.html",
    "contact.html",
    "about.html",
    "packages.html",
    "gallery.html"
  ];

  if (!isLoggedIn() && protectedPages.includes(page)) {
    window.location.replace("login.html");
    return;
  }

  if (isLoggedIn() && authPages.includes(page)) {
    window.location.replace("index.html");
  }
}

function setupLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value.trim();
    const submitButton = form.querySelector('button[type="submit"]');

    if (!email || !password) {
      showPopup("Please enter your email and password.", "error");
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
      }

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showPopup(data.msg || "Login failed. Please check your credentials.", "error");
        return;
      }

      setLoggedIn(true);
      window.location.replace("index.html");
    } catch (error) {
      showPopup("Unable to login right now. Please try again.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

function setupRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("registerName")?.value.trim();
    const email = document.getElementById("registerEmail")?.value.trim();
    const password = document.getElementById("registerPassword")?.value;
    const confirmPassword = document.getElementById("confirmPassword")?.value;
    const submitButton = form.querySelector('button[type="submit"]');

    if (!name || !email || !password || !confirmPassword) {
      showPopup("Please fill in all required fields.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showPopup("Password and confirm password must match.", "error");
      return;
    }

    if (password.length < 6) {
      showPopup("Password must be at least 6 characters.", "error");
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
      }

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showPopup(data.msg || "Registration failed. Please try again.", "error");
        return;
      }

      showPopup("Account created successfully. Please login.", "success");
      window.location.replace("login.html");
    } catch (error) {
      showPopup("Unable to register right now. Please try again.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

function setupLogoutButtons() {
  const logoutButtons = document.querySelectorAll("[data-logout-button]");
  if (!logoutButtons.length) return;

  logoutButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setLoggedIn(false);
      window.location.replace("login.html");
    });
  });
}

enforceAuthRouting();
setupLoginForm();
setupRegisterForm();
setupLogoutButtons();

// ===============================
// CONTACT FORM
// ===============================
function sendMessage(event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !message) {
    showToast("❌ Please fill all fields");
    return;
  }

  fetch(`${API_BASE}/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, message })
  })
    .then(res => res.json())
    .then(data => {
      showToast("✅ Your message has been sent successfully!");
      document.getElementById("contactForm").reset();
    })
    .catch(() => {
      showToast("❌ Server waking up. Try again in 20 seconds");
    });
}

// ===============================
// TOAST
// ===============================
function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  if (!toast || !toastMessage) return;

  toastMessage.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Custom popup function
function showPopup(message, type = "info") {
  let popup = document.getElementById("custom-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "custom-popup";
    popup.style.position = "fixed";
    popup.style.top = "40px";
    popup.style.left = "50%";
    popup.style.transform = "translateX(-50%)";
    popup.style.background = type === "error" ? "#ff4d4f" : type === "success" ? "#52c41a" : "#1890ff";
    popup.style.color = "#fff";
    popup.style.padding = "16px 32px";
    popup.style.borderRadius = "8px";
    popup.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    popup.style.fontSize = "1.1rem";
    popup.style.zIndex = 9999;
    popup.style.opacity = 0;
    popup.style.transition = "opacity 0.3s";
    document.body.appendChild(popup);
  }
  popup.textContent = message;
  popup.style.opacity = 1;
  setTimeout(() => {
    popup.style.opacity = 0;
  }, 2500);
}

function renderDestinationCards(container, destinations) {
  container.innerHTML = "";

  destinations.forEach(function (place) {
    container.innerHTML += `
      <div class="destination-card">
        <img src="${place.image_url}" alt="${place.name}">
        <div class="card-content">
          <h3>${place.name}</h3>
          <p>${place.description}</p>
        </div>
      </div>
    `;
  });
}

function mergeDestinationLists(primaryList, secondaryList) {
  const mergedMap = new Map();

  primaryList.forEach(function (item) {
    mergedMap.set(item.name.toLowerCase(), item);
  });

  secondaryList.forEach(function (item) {
    const key = item.name.toLowerCase();
    if (!mergedMap.has(key)) {
      mergedMap.set(key, item);
    }
  });

  return Array.from(mergedMap.values());
}

// ===============================
// LOAD DESTINATIONS
// ===============================
function loadDestinations() {
  const container = document.getElementById("destinationsContainer");
  if (!container) return;

  const cachedDestinations = localStorage.getItem(DESTINATIONS_CACHE_KEY);

  if (cachedDestinations) {
    try {
      const parsedCache = JSON.parse(cachedDestinations);
      if (Array.isArray(parsedCache) && parsedCache.length > 0) {
        renderDestinationCards(container, mergeDestinationLists(parsedCache, FALLBACK_DESTINATIONS));
      }
    } catch (error) {
      localStorage.removeItem(DESTINATIONS_CACHE_KEY);
    }
  }

  if (!container.children.length) {
    renderDestinationCards(container, FALLBACK_DESTINATIONS);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(function () {
    controller.abort();
  }, 4000);

  fetch(`${API_BASE}/destinations`, { signal: controller.signal })
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        if (!container.children.length) {
          renderDestinationCards(container, FALLBACK_DESTINATIONS);
        }
        return;
      }

      const combinedDestinations = mergeDestinationLists(data, FALLBACK_DESTINATIONS);
      localStorage.setItem(DESTINATIONS_CACHE_KEY, JSON.stringify(combinedDestinations));
      renderDestinationCards(container, combinedDestinations);
    })
    .catch(() => {
      if (!container.children.length) {
        renderDestinationCards(container, FALLBACK_DESTINATIONS);
      }
    })
    .finally(() => {
      clearTimeout(timeoutId);
    });
}

// Run only on destinations page
if (window.location.pathname.includes("destinations")) {
  loadDestinations();
}