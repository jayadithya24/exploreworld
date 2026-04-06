require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // bodyParser not needed

// ===========================
// MySQL Connection Pool (Better for Render)
// ===========================
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, // ⭐ ADD THIS LINE
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test DB connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
  } else {
    console.log("✅ MySQL Connected Successfully!");
    connection.release();
  }
});

// ===========================
// Test Route
// ===========================
app.get(["/", "/api"], (req, res) => {
  res.send("Backend is running successfully 🚀");
});

// ===========================
// CONTACT FORM API
// ===========================
app.post(["/contact", "/api/contact"], (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      msg: "All fields are required!"
    });
  }

  const sql = `
    INSERT INTO contact_messages (name, email, message)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [name, email, message], (err) => {
    if (err) {
      console.error("Insert Error:", err.message);
      return res.status(500).json({
        success: false,
        msg: "Database Error"
      });
    }

    res.json({
      success: true,
      msg: "Message sent successfully!"
    });
  });
});

// ===========================
// DESTINATIONS API
// ===========================

// Get all destinations
app.get(["/destinations", "/api/destinations"], (req, res) => {
  const sql = "SELECT * FROM destinations ORDER BY id DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database Read Error:", err.message);
      return res.status(500).json({
        success: false,
        msg: "Error fetching destinations"
      });
    }

    res.json(results);
  });
});

// Add new destination
app.post(["/destinations", "/api/destinations"], (req, res) => {
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

  db.query(sql, [name, country || null, description, image_url], (err) => {
    if (err) {
      console.error("Insert Destination Error:", err.message);
      return res.status(500).json({
        success: false,
        msg: "Database Error"
      });
    }

    res.json({
      success: true,
      msg: "Destination added successfully!"
    });
  });
});

// ===========================
// START SERVER
// ===========================
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;