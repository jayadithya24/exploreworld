const API_BASE = "https://exploreworld-nj6x.onrender.com";

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

// ===============================
// LOAD DESTINATIONS
// ===============================
function loadDestinations() {
  const container = document.getElementById("destinationsContainer");
  if (!container) return;

  container.innerHTML = "<p>Loading destinations...</p>";

  fetch(`${API_BASE}/destinations`)
    .then(res => res.json())
    .then(data => {
      container.innerHTML = "";

      if (!data || data.length === 0) {
        container.innerHTML = "<p>No destinations found</p>";
        return;
      }

      data.forEach(place => {
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
    })
    .catch(() => {
      container.innerHTML = "<p style='color:red;'>Server is waking up. Please refresh in 20 seconds.</p>";
    });
}

// Run only on destinations page
if (window.location.pathname.includes("destinations")) {
  loadDestinations();
}