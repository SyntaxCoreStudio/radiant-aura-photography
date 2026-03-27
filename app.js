const express = require("express");
const path = require("path");
const session = require("express-session");
require("dotenv").config();

const contactRoutes = require("./routes/contact");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
    },
  }),
);

// Serve public files
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/contact", contactRoutes);
app.use("/admin", adminRoutes);

// Test route
app.get("/health", (req, res) => {
  res.send("Radiant Aura server is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
