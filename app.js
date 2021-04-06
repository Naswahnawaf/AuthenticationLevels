//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
const bcrypt = require('bcrypt');

const app = express();
const saltRounds = 10;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/UsersDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const UsersSchema = new mongoose.Schema({
  Email: {
    type: String,
    required: true
  },
  Password: {
    type: String,
    required: true
  }
});

///////////ENCRYPT PART AUTHENTICATION /////////////
// UsersSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["Password"]
// });
/////////////////////////////////////////////

const Users = mongoose.model("User", UsersSchema);


app.get("/", function(req, res) {
  res.render("home");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/logout", function(req, res) {
  res.redirect("/");
});



app.post("/register", function(req, res) {

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

    const newUser = new Users({
      Email: req.body.username,
      Password: hash
    });

    newUser.save(function(err) {
      if (err) {
        console.log(err);
      } else {
        res.render("secrets");
      }
    });
  });
});

app.post("/login", function(req, res) {

  Users.findOne({
      Email: req.body.username
    }, function(err, founduseremail) {
      if (err) {
        console.log(err);
      } else {
        if (founduseremail) {
          // if (founduseremail.Password === password) {
          bcrypt.compare(req.body.password, founduseremail.Password, function(err, result) {
            if (result === true) {
              res.render("secrets");
        } else {
          res.send("<h1> The Password You Entered Is Incorrect");
        };
      });
      } else {
        res.send("<h1> The Username You Entered Is Wrong");
      };
    };
  });

});


app.listen(3000, function() {
  console.log("Server Is Sucessfulyy Started On Port 3000");
});
