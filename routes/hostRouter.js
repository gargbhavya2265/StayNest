
const express = require("express");
const hostRouter = express.Router();

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const hostController = require("../controllers/hostController");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "staynest",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  return cb(new Error("Only image files are allowed."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

hostRouter.get("/add-home", hostController.getAddHome);

hostRouter.post(
  "/add-home",
  upload.single("photo"),
  hostController.postAddHome
);

hostRouter.get("/host-home-list", hostController.getHostHomes);

hostRouter.get("/edit-home/:homeId", hostController.getEditHome);

hostRouter.post(
  "/edit-home",
  upload.single("photo"),
  hostController.postEditHome
);

hostRouter.post(
  "/delete-home/:homeId",
  hostController.postDeleteHome
);

module.exports = hostRouter;
