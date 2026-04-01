const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const session = require("express-session");
require("dotenv").config();

const contactRoutes = require("./routes/contact");
const adminRoutes = require("./routes/admin");
const apiAdminRoutes = require("./routes/api-admin");

const app = express();
const PORT = process.env.PORT || 3005;

const PUBLIC_DIR = path.join(__dirname, "public");
const STORAGE_DIR = path.join(__dirname, "storage");
const CLIENT_GALLERIES_DIR = path.join(STORAGE_DIR, "client-galleries");
const SHARE_LINKS_FILE = path.join(STORAGE_DIR, "share-links.json");

app.set("trust proxy", 1);

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
app.use(express.static(PUBLIC_DIR));

// Serve uploaded files
app.use("/uploads", express.static(STORAGE_DIR));

// API routes
app.use("/api/contact", contactRoutes);
app.use("/api/admin", apiAdminRoutes);
app.use("/admin", adminRoutes);

// Helpers
function ensureShareLinksFile() {
  if (!fs.existsSync(SHARE_LINKS_FILE)) {
    fs.writeFileSync(SHARE_LINKS_FILE, JSON.stringify({}, null, 2), "utf8");
  }
}

function readShareLinks() {
  ensureShareLinksFile();
  const raw = fs.readFileSync(SHARE_LINKS_FILE, "utf8");
  return JSON.parse(raw || "{}");
}

function writeShareLinks(data) {
  fs.writeFileSync(SHARE_LINKS_FILE, JSON.stringify(data, null, 2), "utf8");
}

function generateToken() {
  return crypto.randomBytes(16).toString("hex");
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized.",
  });
}

// Client gallery page
app.get("/client", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "client.html"));
});

// Create or get share link for a gallery
app.post("/api/admin/share-link", requireAdmin, async (req, res) => {
  try {
    const clientName = String(req.body.clientName || "").trim();

    if (!clientName) {
      return res.status(400).json({
        success: false,
        message: "Gallery name is required.",
      });
    }

    const galleryPath = path.join(CLIENT_GALLERIES_DIR, clientName);

    if (!fs.existsSync(galleryPath)) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found.",
      });
    }

    const shareLinks = readShareLinks();

    let existingToken = null;

    for (const [token, value] of Object.entries(shareLinks)) {
      if (value.gallery === clientName) {
        existingToken = token;
        break;
      }
    }

    const token = existingToken || generateToken();

    if (!existingToken) {
      shareLinks[token] = {
        gallery: clientName,
        createdAt: new Date().toISOString(),
      };

      writeShareLinks(shareLinks);
    }

    const shareUrl = `${req.protocol}://${req.get("host")}/client?token=${token}`;

    return res.json({
      success: true,
      token,
      shareUrl,
    });
  } catch (error) {
    console.error("Create share link error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create share link.",
    });
  }
});

// Public client gallery API using token
app.get("/api/client/gallery", async (req, res) => {
  try {
    const token = String(req.query.token || "").trim();

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Share token is required.",
      });
    }

    const shareLinks = readShareLinks();
    const entry = shareLinks[token];

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired link.",
      });
    }

    const clientName = entry.gallery;
    const galleryPath = path.join(CLIENT_GALLERIES_DIR, clientName);

    if (!fs.existsSync(galleryPath)) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found.",
      });
    }

    const files = await fs.promises.readdir(galleryPath);

    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|webp)$/i.test(file),
    );

    const images = imageFiles.map((filename) => ({
      filename,
      url: `/uploads/client-galleries/${encodeURIComponent(clientName)}/${encodeURIComponent(filename)}`,
    }));

    return res.json({
      success: true,
      gallery: clientName,
      images,
    });
  } catch (error) {
    console.error("Client gallery error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load gallery.",
    });
  }
});

// Test route
app.get("/health", (req, res) => {
  res.send("Radiant Aura server is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
