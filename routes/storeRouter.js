const express = require("express");
const mongoose = require("mongoose");
const storeRouter = express.Router();

const storeController = require("../controllers/storeController");

const requireGuestLogin = (req, res, next) => {
  if (
    !req.session.isLoggedIn ||
    !req.session.user ||
    !mongoose.isValidObjectId(req.session.user._id)
  ) {
    return res.redirect("/login");
  }

  next();
};

storeRouter.get("/", storeController.getIndex);
storeRouter.get("/homes", storeController.getHomes);

storeRouter.get(
  "/bookings",
  requireGuestLogin,
  storeController.getBookings
);

storeRouter.get(
  "/favourites",
  requireGuestLogin,
  storeController.getFavouriteList
);

storeRouter.post(
  "/favourites",
  requireGuestLogin,
  storeController.postAddToFavourite
);

storeRouter.post(
  "/favourites/delete/:homeId",
  requireGuestLogin,
  storeController.postRemoveFromFavourite
);

storeRouter.get(
  "/homes/:homeId/reserve",
  requireGuestLogin,
  storeController.getReserve
);

storeRouter.post(
  "/homes/:homeId/reserve",
  requireGuestLogin,
  storeController.postCreateBooking
);

storeRouter.post(
  "/bookings/:bookingId/cancel",
  requireGuestLogin,
  storeController.postCancelBooking
);

storeRouter.get("/homes/:homeId", storeController.getHomeDetails);

module.exports = storeRouter;