const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

const STORAGE_ROOT = path.join(__dirname, "..", "storage", "client-galleries");

fs.mkdirSync(STORAGE_ROOT, { recursive: true });

function sanitizeFolderName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_ ]/g, "")
    .replace(/\s+/g, "-");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const clientName = sanitizeFolderName(req.body.clientName || "");

    if (!clientName) {
      return cb(new Error("Client name is required"));
    }

    const clientFolder = path.join(STORAGE_ROOT, clientName);
    fs.mkdirSync(clientFolder, { recursive: true });
    cb(null, clientFolder);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP files are allowed"));
    }

    cb(null, true);
  },
});

router.use(requireAdmin);

// Create gallery
router.post("/galleries", (req, res) => {
  try {
    const rawName = req.body.clientName || "";
    const clientName = sanitizeFolderName(rawName);

    if (!clientName) {
      return res.status(400).json({
        success: false,
        message: "Client name is required",
      });
    }

    const galleryPath = path.join(STORAGE_ROOT, clientName);

    if (fs.existsSync(galleryPath)) {
      return res.status(400).json({
        success: false,
        message: "Gallery already exists",
      });
    }

    fs.mkdirSync(galleryPath, { recursive: true });

    res.json({
      success: true,
      message: "Gallery created successfully",
      gallery: clientName,
    });
  } catch (error) {
    console.error("Create gallery error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create gallery",
    });
  }
});

// List galleries
router.get("/galleries", (req, res) => {
  try {
    const folders = fs
      .readdirSync(STORAGE_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    const galleries = folders.map((folder) => {
      const folderPath = path.join(STORAGE_ROOT, folder);
      const files = fs
        .readdirSync(folderPath)
        .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

      return {
        name: folder,
        imageCount: files.length,
        images: files.map((file) => ({
          filename: file,
          url: `/uploads/client-galleries/${folder}/${file}`,
        })),
      };
    });

    res.json({
      success: true,
      galleries,
    });
  } catch (error) {
    console.error("List galleries error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load galleries",
    });
  }
});

// Upload images
router.post("/upload", upload.array("images", 30), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    res.json({
      success: true,
      message: "Images uploaded successfully",
      files: req.files.map((file) => ({
        filename: file.filename,
      })),
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
});

// Delete image
router.delete("/images", (req, res) => {
  try {
    const clientName = sanitizeFolderName(req.body.clientName || "");
    const filename = req.body.filename;

    if (!clientName || !filename) {
      return res.status(400).json({
        success: false,
        message: "Client name and filename are required",
      });
    }

    const imagePath = path.join(STORAGE_ROOT, clientName, filename);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    fs.unlinkSync(imagePath);

    res.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete image",
    });
  }
});

module.exports = router;
