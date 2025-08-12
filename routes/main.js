const router = require("express").Router();
const Bookstore = require("../models/bookstore");
const bookstoreData = require("../../bookstores.json");
const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();

mongoose.connect(
  "mongodb+srv://anneclinebarger:eUqDuVLLH3eUjoGU@cluster0.al86ipn.mongodb.net/clt-bookstore-crawl"
);

router.get("/bookstores", (req, res) => {
  // TODO: write logic to GET bookstore information
  Bookstore.find()
    .exec()
    .then((bookstores) => {
      res.send(bookstores);
    })
    .catch((error) => {
      return console.error(error);
    });
});

const apiKey = process.env.API_KEY;

const getRoute = async (initialLocation, waypoints) => {
  const url = "https://routes.googleapis.com/directions/v2:computeRoutes";

  const body = {
    origin: {
      placeId: initialLocation.place_id,
    },
    destination: {
      placeId: initialLocation.place_id,
    },
    intermediates: waypoints.map((waypoint) => ({
      placeId: waypoint.place_id,
    })),
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    optimizeWaypointOrder: true,
    computeAlternativeRoutes: false,
    routeModifiers: {
      avoidTolls: false,
      avoidHighways: false,
      avoidFerries: false,
    },
    languageCode: "en-US",
    units: "METRIC",
  };

  const config = {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey, // use environment variable
      "X-Goog-FieldMask": "routes",
    },
  };

  try {
    const response = await axios.post(url, body, config);
    return response.data;
  } catch (error) {
    console.error(
      "Error getting route:",
      error.response?.data || error.message
    );
    throw error;
  }
};

router.post("/routes", async (req, res) => {
  console.log("Received request body:", req.body);
  const { initialLocation, waypoints } = req.body;

  if (
    !initialLocation ||
    !initialLocation.place_id ||
    !Array.isArray(waypoints)
  ) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const routeData = await getRoute(initialLocation, waypoints);
    console.log(routeData);
    res.json(routeData);
  } catch (error) {
    res.status(500).json({ error: "Failed to compute route" });
  }
});

module.exports = router;
