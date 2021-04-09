//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
///////Athentication Requirements////////
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const googleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require('mongoose-findorcreate');
/////////////////////////////////////////////
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
/////////using and initalizing of Authentication required Modeules///////
app.use(session({
  secret:"My secret" ,
  resave: false ,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
///////////////INITIALZING  PASSPORT AND SESSION ONLY///////////////////////

mongoose.connect("mongodb://localhost:27017/UsersDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex" , true)

const UsersSchema = new mongoose.Schema({
  Email: String,
  Password:String,
  googleId:String,
  secret:String
});

/////////////PASSPORT LOCAL MONGOOSE CONNECT TO DB/////////////
UsersSchema.plugin(passportLocalMongoose);
UsersSchema.plugin(findOrCreate);
///////////////////////////////////////////////////////

const User = mongoose.model("User", UsersSchema);
///Using Passport Along with MONGOoSE & DB CREATING COOKIE (AUTHENTICATION)///
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

////////OAUTH METHOD FOR GOOGLE LOGIN ATHENTICATION USING PASSPORT////////
passport.use(new googleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets" ,
    userProfileUrl:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


//////////////////////////GET METHOD////////////////////////////////
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/auth/google" ,
  passport.authenticate("google" , { scope : [ "email" , "profile" ] })
);

app.get( "/auth/google/secrets",
    passport.authenticate( "google", {
        successRedirect: "/secrets",
        failureRedirect: "/login"
}));

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/secrets", function(req, res) {
   User.find({secret : {$ne:null}} , function (err , foundUser) {
       if (err) {
         console.log(err);
       } else {
           if (foundUser) {
 res.render("secrets" , {userWithSecrets:foundUser}) ;
          }
       };
   });
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/submit", function(req, res) {
  if(req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  };});


///////////////////////POST METHOD/////////////////////////////////

app.post("/register", function(req, res) {
   User.register({Email:req.body.username} , req.body.password , function (err , user) {
         if(err) {
           console.log(err);
           res.redirect("/register");
         } else {
           passport.authenticate("local") (req , res , function () {
               res.redirect("/secrets");
           });
         };
   });

});

app.post("/login", function(req, res) {

  const loginuser = new User ({
    Email: req.body.username,
    Password:req.body.password
  });

  req.login(loginuser, function(err) {
    if(err) {
      console.log(err);
    } else {
      passport.authenticate("local") (req, res ,function() {
         res.redirect("/secrets");
      });
    };
  });
});

app.post("/submit" , function (req,res) {
  const submittedSecret = req.body.secret;

  User.findById(req.user.id , function (err , founduser) {
     if (err) {
       console.log(err);
     } else {
        if (founduser) {
           founduser.secret = submittedSecret;
           founduser.save(function(err) {
             if (err) {
               console.log(err);
             } else {
res.redirect("/secrets");
             }
           })
        }
     };
  });
});


app.listen(3000, function() {
  console.log("Server Is Sucessfully Started On Port 3000");
});
