const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const router = express.Router();

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  return res.redirect("/admin/login");
}

// Login page
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin-login.html"));
});

// Login handler
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      process.env.ADMIN_PASSWORD_HASH,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    req.session.isAdmin = true;
    req.session.adminEmail = email;

    return res.json({
      success: true,
      message: "Login successful.",
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during login.",
    });
  }
});

// Protected dashboard page
router.get("/dashboard", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin-dashboard.html"));
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Logout failed.",
      });
    }

    res.clearCookie("connect.sid");

    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  });
});

module.exports = router;
