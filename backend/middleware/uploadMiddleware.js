
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDirectory = path.join(__dirname, "../uploads");

// Create uploads folder if it does not exist
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const uniqueName =
      `visitor-${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`;

    cb(null, uniqueName);
  },
});

// Allowed image formats
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only JPG, PNG and WEBP images are allowed."),
      false
    );
  }
};

// Multer Configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

// Export Middleware
module.exports = upload;
