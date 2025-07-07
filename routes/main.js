const router = require("express").Router();
const Bookstore = require("../models/bookstore");
const bookstoreData = require("../../bookstores.json");
const mongoose = require("mongoose");

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

// TODO: Add routes for authentication
// TODO: Write tests for all routes

module.exports = router;
