require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const crypto = require("crypto");

const app = express();

const isVercelRuntime = Boolean(process.env.VERCEL);
const shouldUseSsl = process.env.DB_SSL
  ? process.env.DB_SSL === "true"
  : isVercelRuntime;

// Middlewares
app.use(cors());
app.use(express.json()); // bodyParser not needed

// ===========================
// MySQL Connection Pool (Better for Render)
// ===========================
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
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

// Ensure users table exists for auth features.
db.query(
  `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  (err) => {
    if (err) {
      console.error("Users table creation error:", err.message);
    }
  }
);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
  if (!storedValue || !storedValue.includes(":")) {
    return false;
  }

  const [salt, savedHash] = storedValue.split(":");
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const savedHashBuffer = Buffer.from(savedHash, "hex");

  if (hashBuffer.length !== savedHashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, savedHashBuffer);
}

// ===========================
// Test Route
// ===========================
app.get(["/", "/api"], (req, res) => {
  res.send("Backend is running successfully 🚀");
});

// ===========================
// AUTH API
// ===========================
app.post(["/auth/register", "/api/auth/register"], (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      msg: "Name, email, and password are required"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      msg: "Password must be at least 6 characters"
    });
  }

  const emailLower = email.trim().toLowerCase();

  db.query("SELECT id FROM users WHERE email = ?", [emailLower], (checkErr, users) => {
    if (checkErr) {
      console.error("Register read error:", checkErr.message);
      return res.status(500).json({
        success: false,
        msg: "Database Error",
        code: checkErr.code || "UNKNOWN"
      });
    }

    if (users.length > 0) {
      return res.status(409).json({
        success: false,
        msg: "Email already registered"
      });
    }

    const passwordHash = hashPassword(password);
    const sql = "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)";

    db.query(sql, [name.trim(), emailLower, passwordHash], (insertErr) => {
      if (insertErr) {
        console.error("Register insert error:", insertErr.message);
        return res.status(500).json({
          success: false,
          msg: "Database Error",
          code: insertErr.code || "UNKNOWN"
        });
      }

      return res.status(201).json({
        success: true,
        msg: "Account created successfully"
      });
    });
  });
});

app.post(["/auth/login", "/api/auth/login"], (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      msg: "Email and password are required"
    });
  }

  const emailLower = email.trim().toLowerCase();

  db.query(
    "SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1",
    [emailLower],
    (err, users) => {
      if (err) {
        console.error("Login read error:", err.message);
        return res.status(500).json({
          success: false,
          msg: "Database Error",
          code: err.code || "UNKNOWN"
        });
      }

      if (!users.length) {
        return res.status(401).json({
          success: false,
          msg: "Invalid email or password"
        });
      }

      const user = users[0];
      const isValid = verifyPassword(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          msg: "Invalid email or password"
        });
      }

      return res.json({
        success: true,
        msg: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    }
  );
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