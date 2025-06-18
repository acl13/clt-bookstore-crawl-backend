const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

async function connectToMongoDB() {
  try {
    mongoose.connect(
      "mongodb+srv://anneclinebarger:eUqDuVLLH3eUjoGU@cluster0.al86ipn.mongodb.net/"
    );
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}
connectToMongoDB();

const app = express();

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const mainRoutes = require("./routes/main");

app.use(mainRoutes);

app.listen(8000, () => {
  console.log("Node.js listening on port 8000");
});
