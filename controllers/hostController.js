
const Home = require("../models/home");

exports.getAddHome = (req, res) => {
  res.render("host/edit-home", {
    pageTitle: "Add Home to StayNest",
    currentPage: "addHome",
    editing: false,
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getEditHome = async (req, res) => {
  try {
    const home = await Home.findById(req.params.homeId);

    if (!home) {
      return res.redirect("/host/host-home-list");
    }

    res.render("host/edit-home", {
      home,
      pageTitle: "Edit your Home",
      currentPage: "host-homes",
      editing: req.query.editing === "true",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error finding home:", err);
    res.status(500).send("Could not load home.");
  }
};

exports.getHostHomes = async (req, res) => {
  try {
    const registeredHomes = await Home.find();

    res.render("host/host-home-list", {
      registeredHomes,
      pageTitle: "Host Homes List",
      currentPage: "host-homes",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error loading homes:", err);
    res.status(500).send("Could not load homes.");
  }
};

exports.postAddHome = async (req, res) => {
  try {
    const { houseName, price, location, rating, description } = req.body;

    if (!req.file) {
      return res.status(422).send("Please upload a home image.");
    }

    await Home.create({
      houseName,
      price,
      location,
      rating,
      photo: req.file.path,
      description,
    });

    res.redirect("/host/host-home-list");
  } catch (err) {
    console.error("Error saving home:", err);
    res.status(500).send("Could not save home.");
  }
};

exports.postEditHome = async (req, res) => {
  try {
    const { id, houseName, price, location, rating, description } = req.body;
    const home = await Home.findById(id);

    if (!home) {
      return res.redirect("/host/host-home-list");
    }

    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;
    home.description = description;

    if (req.file) {
      home.photo = req.file.path;
    }

    await home.save();
    res.redirect("/host/host-home-list");
  } catch (err) {
    console.error("Error updating home:", err);
    res.status(500).send("Could not update home.");
  }
};

exports.postDeleteHome = async (req, res) => {
  try {
    await Home.findByIdAndDelete(req.params.homeId);
    res.redirect("/host/host-home-list");
  } catch (err) {
    console.error("Error deleting home:", err);
    res.status(500).send("Could not delete home.");
  }
};
