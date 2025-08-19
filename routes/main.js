const router = require("express").Router();
const Bookstore = require("../models/bookstore");
const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();
const passport = require("passport");
const jwt = require("jwt-simple");
const User = require("../models/user");

const ExtractJwt = require("passport-jwt").ExtractJwt;
const LocalStrategy = require("passport-local").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;

mongoose.connect(
  "mongodb+srv://anneclinebarger:eUqDuVLLH3eUjoGU@cluster0.al86ipn.mongodb.net/clt-bookstore-crawl"
);

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: "secret",
};

passport.use(
  "jwt",
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.sub);
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  })
);

passport.use(
  "login",
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user || !user.validPassword(password)) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

const tokenForUser = function (user) {
  return jwt.encode(
    {
      sub: user._id.toString(),
      iat: Math.round(Date.now() / 1000),
      exp: Math.round(Date.now() / 1000 + 5 * 60 * 60), // 5 hours
    },
    jwtOptions.secretOrKey
  );
};

router.post("/login", (req, res, next) => {
  passport.authenticate("login", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user)
      return res.status(401).json({ message: info?.message || "Login failed" });

    res.json({
      token: tokenForUser(user),
      user,
    });
  })(req, res, next);
});

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(422)
      .json({ error: "You must provide email and password" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(422).json({ error: "Email is in use" });
    }

    const user = new User({ email });
    user.setPassword(password);
    await user.save();

    res.json({ token: tokenForUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating account" });
  }
});

const requireAuth = passport.authenticate("jwt", { session: false });

router.get("/me", requireAuth, (req, res) => {
  // req.user is populated by JwtStrategy
  res.json({
    id: req.user._id,
    email: req.user.email,
    // include other fields from your model if needed
  });
});

router.get("/bookstores", (req, res) => {
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
