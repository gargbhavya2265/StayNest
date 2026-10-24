
const path = require("path");
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const { default: mongoose } = require("mongoose");
const MongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const DB_PATH = process.env.DB_PATH;

const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");

const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloudinary environment check:", {
  cloudName: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
  apiKey: Boolean(process.env.CLOUDINARY_API_KEY),
  apiSecret: Boolean(process.env.CLOUDINARY_API_SECRET),
});

app.set("view engine", "ejs");
app.set("views", "views");

const store = new MongoDBStore({
  uri: DB_PATH,
  collection: "sessions",
});

store.on("error", (err) => {
  console.error("Session store error:", err);
});

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

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(rootDir, "public")));
app.use("/uploads", express.static(path.join(rootDir, "uploads")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-session-secret",
    resave: false,
    saveUninitialized: false,
    store,
  })
);

app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn;
  next();
});

app.use(authRouter);
app.use(storeRouter);

app.use("/host", (req, res, next) => {
  if (req.isLoggedIn) {
    return next();
  }

  return res.redirect("/login");
});

app.use("/host", (req, res, next) => {
  console.log("HOST REQUEST:", req.method, req.originalUrl);
  next();
});

app.use("/host", hostRouter);

app.use((err, req, res, next) => {
  console.error("STAYNEST ERROR:", err.stack || err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).send("Internal Server Error - check Render logs");
});

app.use(errorsController.pageNotFound);

const PORT = process.env.PORT || 3003;

mongoose
  .connect(DB_PATH)
  .then(() => {
    console.log("Connected to Mongo");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error while connecting to Mongo:", err);
  });
