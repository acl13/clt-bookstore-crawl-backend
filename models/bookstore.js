const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookstoreSchema = new Schema({
  name: String,
  address: String,
  county: String,
  url: String,
  place_id: String,
  lat: Number,
  long: Number,
});

module.exports = mongoose.model("Bookstore", BookstoreSchema);
