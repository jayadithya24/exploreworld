// Handle contact form submission
function sendMessage(event) {
  event.preventDefault(); // Prevent page refresh

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !message) {
    showErrorPopup("Please fill all fields!");
    return;
  }

  // Send POST request to backend
  fetch("http://localhost:5000/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, message })
  })
    .then(res => res.json())
    .then(data => {
      showSuccessPopup(data.msg);  // Show success popup
      document.getElementById("contactForm").reset();
    })
    .catch(error => {
      console.error("Error:", error);
      showErrorPopup("Something went wrong. Please try again.");
    });
}

function showSuccessPopup(message) {
  const popup = document.getElementById("successPopup");
  popup.querySelector("p").innerText = message;
  popup.style.display = "flex";
}

function showErrorPopup(message) {
  const popup = document.getElementById("errorPopup");
  popup.querySelector("p").innerText = message;
  popup.style.display = "flex";
}

function closePopup(id) {
  document.getElementById(id).style.display = "none";
}

// Load destinations dynamically from backend
function loadDestinations() {
  fetch("http://localhost:5000/destinations")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("destinationsContainer");
      container.innerHTML = ""; // Clear loading text

      if (data.length === 0) {
        container.innerHTML = "<p>No destinations available.</p>";
        return;
      }

      data.forEach(place => {
        container.innerHTML += `
          <div class="destination-item">
            <img src="${place.image_url}" alt="${place.name}" />
            <div>
              <h2>${place.name}</h2>
              <p>${place.description}</p>
            </div>
          </div>
        `;
      });
    })
    .catch(err => {
      console.error("Error loading destinations:", err);
      document.getElementById("destinationsContainer").innerHTML =
        "<p style='color:red;'>Failed to load destinations.</p>";
    });
}

// Load only on destinations page
if (window.location.pathname.includes("destinations.html")) {
  loadDestinations();
}
