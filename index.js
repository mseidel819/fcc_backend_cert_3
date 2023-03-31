require("dotenv").config({ path: "./sample.env" });
const express = require("express");
const cors = require("cors");
const app = express();
const shortid = require("shortid");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// Basic Configuration
const port = process.env.PORT || 3000;

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
  })
  .then(() => console.log("DB connection successful!"));

const urlScheme = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

const URL = mongoose.model("URL", urlScheme);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async (req, res) => {
  const shorty = shortid.generate();

  const validator =
    /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;

  try {
    if (!validator.test(req.body.url)) {
      return res.json({
        error: "invalid url",
      });
    }

    let findOne = await URL.findOne({ original_url: req.body.url });
    if (!findOne) {
      findOne = new URL({
        original_url: req.body.url,
        short_url: shorty,
      });
      await findOne.save();
    }

    res.json({
      original_url: findOne.original_url,
      short_url: findOne.short_url,
    });
    // res.json({
    //   original_url: req.body.url,
    //   short_url: shorty,
    // });
  } catch (err) {
    res.json({
      status: "fail",
      message: "something went wrong...",
    });
  }
});

app.get("/api/shorturl/:shortURL", async (req, res) => {
  try {
    const URLparams = await URL.findOne({
      short_url: req.params.shortURL,
    });

    if (!URLparams) throw new Error("invalid URL OOPS");

    return res.redirect(URLparams.original_url);
  } catch (err) {
    res.json({
      status: "fail",
      message: "something went wrong...",
    });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
