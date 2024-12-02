const path = require("path");
const multer = require("multer");
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath); 
  },

  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.filename || file.originalname}`); 
  }
});

const upload = multer({ storage: storage });

module.exports = upload;