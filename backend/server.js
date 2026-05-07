require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ===========================
// MongoDB Connection
// ===========================
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/exploreworld";
mongoose.connect(mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ===========================
// Mongoose Schemas & Models
// ===========================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});
const User = mongoose.model("User", userSchema);

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});
const ContactMessage = mongoose.model("ContactMessage", contactSchema);

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String },
  description: { type: String, required: true },
  image_url: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});
const Destination = mongoose.model("Destination", destinationSchema);

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

app.get(["/db-check", "/api/db-check"], async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    return res.json({
      success: true,
      msg: "Database connection successful"
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: "Database connection failed",
      detail: err.message || null
    });
  }
});

// ===========================
// AUTH API
// ===========================
app.post(["/auth/register", "/api/auth/register"], async (req, res) => {
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
  try {
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        msg: "Email already registered"
      });
    }

    const passwordHash = hashPassword(password);
    const user = new User({ name: name.trim(), email: emailLower, password_hash: passwordHash });
    await user.save();
    return res.status(201).json({
      success: true,
      msg: "Account created successfully"
    });
  } catch (err) {
    console.error("Register error:", err.message);
    return res.status(500).json({
      success: false,
      msg: "Database Error"
    });
  }
});

app.post(["/auth/login", "/api/auth/login"], async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      msg: "Email and password are required"
    });
  }

  const emailLower = email.trim().toLowerCase();
  try {
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "Invalid email or password"
      });
    }
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
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({
      success: false,
      msg: "Database Error"
    });
  }
});

// ===========================
// CONTACT FORM API
// ===========================
app.post(["/contact", "/api/contact"], async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      msg: "All fields are required!"
    });
  }

  try {
    const contactMsg = new ContactMessage({ name, email, message });
    await contactMsg.save();
    res.json({
      success: true,
      msg: "Message sent successfully!"
    });
  } catch (err) {
    console.error("Insert Error:", err.message);
    return res.status(500).json({
      success: false,
      msg: "Database Error"
    });
  }
});

// ===========================
// DESTINATIONS API
// ===========================

// Get all destinations
app.get(["/destinations", "/api/destinations"], async (req, res) => {
  try {
    const results = await Destination.find().sort({ created_at: -1 });
    res.json(results);
  } catch (err) {
    console.error("Database Read Error:", err.message);
    return res.status(500).json({
      success: false,
      msg: "Error fetching destinations"
    });
  }
});

// Add new destination
app.post(["/destinations", "/api/destinations"], async (req, res) => {
  const { name, country, description, image_url } = req.body;

  if (!name || !description || !image_url) {
    return res.status(400).json({
      success: false,
      msg: "Name, description, and image URL are required"
    });
  }

  try {
    const dest = new Destination({ name, country, description, image_url });
    await dest.save();
    res.json({
      success: true,
      msg: "Destination added successfully!"
    });
  } catch (err) {
    console.error("Insert Destination Error:", err.message);
    return res.status(500).json({
      success: false,
      msg: "Database Error"
    });
  }
});

// ===========================
// START SERVER
// ===========================
const PORT = process.env.PORT || 5000;
const isServerlessEnvironment = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.FUNCTIONS_EMULATOR
);

if (!isServerlessEnvironment) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;