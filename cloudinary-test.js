
require("dotenv").config();

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  debug: true,
});

async function testCloudinary() {
  try {
    console.log("Cloud:", cloudinary.config().cloud_name);

    await cloudinary.api.ping();
    console.log("Authentication: SUCCESS");

    const testImage =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=";

    const result = await cloudinary.uploader.upload(testImage, {
      folder: "staynest",
      resource_type: "image",
    });

    console.log("UPLOAD SUCCESS:", result.secure_url);
  } catch (err) {
    console.error("UPLOAD FAILED");
    console.dir(err, { depth: 8 });

    for (const key of Object.getOwnPropertyNames(err)) {
      if (key !== "config" && key !== "request") {
        console.log(`Error property [${key}]:`, err[key]);
      }
    }
  }
}

testCloudinary();
