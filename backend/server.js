require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error("MySQL connection failed:", err);
  } else {
    console.log("MySQL Connected Successfully!");
  }
});

// Test Route
app.get("/", (req, res) => {
  res.send("Backend + MySQL connected successfully!");
});


// ===========================
// CONTACT FORM API
// ===========================
app.post("/contact", (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, msg: "All fields are required!" });
  }

  const sql = "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)";
  db.query(sql, [name, email, message], (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ success: false, msg: "Database Error" });
    }
    res.json({ success: true, msg: "Message saved successfully!" });
  });
});


// ===========================
// DESTINATIONS API
// ===========================

// 1️⃣ Get all destinations
app.get("/destinations", (req, res) => {
  const sql = "SELECT * FROM destinations ORDER BY id DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database Read Error:", err);
      return res.status(500).json({ success: false, msg: "Error fetching destinations" });
    }
    res.json(results);
  });
});

// 2️⃣ Insert new destination (backend only, for admin/testing)
app.post("/destinations", (req, res) => {
  const { name, country, description, image_url } = req.body;

  if (!name || !description || !image_url) {
    return res.status(400).json({
      success: false,
      msg: "Name, description, and image URL are required"
    });
  }

  const sql = `
    INSERT INTO destinations (name, country, description, image_url)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, country, description, image_url], (err, result) => {
    if (err) {
      console.error("Insert Destination Error:", err);
      return res.status(500).json({ success: false, msg: "Database Error" });
    }

    res.json({ success: true, msg: "Destination added successfully!" });
  });
});


// ===========================
// START SERVER
// ===========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
