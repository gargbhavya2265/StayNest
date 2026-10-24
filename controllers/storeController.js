const Home = require("../models/home");
const User = require("../models/user");
const Booking = require("../models/booking");

const getIndiaToday = () => {
  return new Date(Date.now() + 330 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
};

const renderReservePage = (res, home, req, error = null, values = {}) => {
  return res.status(error ? 400 : 200).render("store/reserve", {
    home,
    error,
    values,
    pageTitle: "Reserve Home",
    currentPage: "Home",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
    today: getIndiaToday(),
  });
};

exports.getIndex = async (req, res, next) => {
  try {
    const registeredHomes = await Home.find();

    res.render("store/index", {
      registeredHomes,
      pageTitle: "StayNest Home",
      currentPage: "index",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.getHomes = async (req, res, next) => {
  try {
    const registeredHomes = await Home.find();

    res.render("store/home-list", {
      registeredHomes,
      pageTitle: "Homes List",
      currentPage: "Home",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.getBookings = async (req, res, next) => {
  try {
    const userId = req.session.user._id;

    const bookings = await Booking.find({ user: userId })
      .populate("home")
      .sort({ createdAt: -1 });

    res.render("store/bookings", {
      bookings,
      pageTitle: "My Bookings",
      currentPage: "bookings",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      today: getIndiaToday(),
      success: req.query.success === "1",
    });
  } catch (err) {
    next(err);
  }
};

exports.getFavouriteList = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId).populate("favourites");

    if (!user) {
      return res.redirect("/login");
    }

    res.render("store/favourite-list", {
      favouriteHomes: user.favourites,
      pageTitle: "My Favourites",
      currentPage: "favourites",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddToFavourite = async (req, res, next) => {
  try {
    const homeId = req.body.id;
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.redirect("/login");
    }

    if (!user.favourites.some((id) => id.toString() === homeId)) {
      user.favourites.push(homeId);
      await user.save();
    }

    res.redirect("/favourites");
  } catch (err) {
    next(err);
  }
};

exports.postRemoveFromFavourite = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.redirect("/login");
    }

    user.favourites = user.favourites.filter(
      (id) => id.toString() !== homeId
    );

    await user.save();
    res.redirect("/favourites");
  } catch (err) {
    next(err);
  }
};

exports.getHomeDetails = async (req, res, next) => {
  try {
    const home = await Home.findById(req.params.homeId);

    if (!home) {
      return res.redirect("/homes");
    }

    res.render("store/home-detail", {
      home,
      pageTitle: "Home Detail",
      currentPage: "Home",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.getReserve = async (req, res, next) => {
  try {
    const home = await Home.findById(req.params.homeId);

    if (!home) {
      return res.status(404).send("Home not found");
    }

    if (req.session.user.userType !== "guest") {
      return res.status(403).send("Only guests can book a home.");
    }

    return renderReservePage(res, home, req);
  } catch (err) {
    next(err);
  }
};

exports.postCreateBooking = async (req, res, next) => {
  try {
    const home = await Home.findById(req.params.homeId);

    if (!home) {
      return res.status(404).send("Home not found");
    }

    if (req.session.user.userType !== "guest") {
      return res.status(403).send("Only guests can book a home.");
    }

    const { checkIn, checkOut, guests } = req.body;
    const guestCount = Number(guests);

    const values = { checkIn, checkOut, guests };

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(checkIn || "") ||
      !/^\d{4}-\d{2}-\d{2}$/.test(checkOut || "")
    ) {
      return renderReservePage(
        res, home, req, "Please select valid check-in and check-out dates.", values
      );
    }

    const checkInDate = new Date(`${checkIn}T00:00:00.000Z`);
    const checkOutDate = new Date(`${checkOut}T00:00:00.000Z`);

    if (
      Number.isNaN(checkInDate.getTime()) ||
      Number.isNaN(checkOutDate.getTime()) ||
      checkInDate.toISOString().slice(0, 10) !== checkIn ||
      checkOutDate.toISOString().slice(0, 10) !== checkOut
    ) {
      return renderReservePage(
        res, home, req, "Please select valid dates.", values
      );
    }

    if (checkIn < getIndiaToday()) {
      return renderReservePage(
        res, home, req, "Check-in cannot be in the past.", values
      );
    }

    if (checkOut <= checkIn) {
      return renderReservePage(
        res, home, req, "Check-out must be after check-in.", values
      );
    }

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1 ||
      guestCount > 20
    ) {
      return renderReservePage(
        res, home, req, "Guests must be a whole number between 1 and 20.", values
      );
    }

    const existingBooking = await Booking.findOne({
      home: home._id,
      status: "confirmed",
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    if (existingBooking) {
      return renderReservePage(
        res,
        home,
        req,
        "Sorry, this home already has a booking overlapping those dates. Please choose other dates.",
        values
      );
    }

    const nights = Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const totalPrice = nights * home.price;

    await Booking.create({
      home: home._id,
      user: req.session.user._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: guestCount,
      totalPrice,
      status: "confirmed",
    });

    return res.redirect("/bookings?success=1");
  } catch (err) {
    next(err);
  }
};

exports.postCancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.session.user._id,
    });

    if (!booking) {
      return res.status(404).send("Booking not found.");
    }

    if (booking.status === "cancelled") {
      return res.redirect("/bookings");
    }

    booking.status = "cancelled";
    await booking.save();

    return res.redirect("/bookings");
  } catch (err) {
    next(err);
  }
};