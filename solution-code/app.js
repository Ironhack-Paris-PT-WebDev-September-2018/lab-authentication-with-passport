const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const hbs = require('hbs');

// Routes
const index = require('./routes/index');
const users = require('./routes/users');

const app = express();

// Controllers
const passportRouter = require("./routes/passportRouter");

// Mongoose configuration
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/passport-local", {
  useMongoClient: true,
});

// passportJS
const session = require("express-session"); // Creates a session middleware with the given options
const bcrypt = require("bcrypt"); // bcrypt is a password hashing function
const passport = require("passport"); // express-compatible authentication middleware for Node.js.
const LocalStrategy = require("passport-local").Strategy; // Module that lets you authenticate using a username and password in your Node.js applications.
const ensureLogin = require("connect-ensure-login"); // Middleware to ensure that a user is logged in
const flash = require("connect-flash"); // Using flash messages
const User = require("./models/user"); // User Model


//enable sessions
app.use(session({
  secret: "passport-local-strategy",
  resave: true,
  saveUninitialized: true
}));
// initialize a session
app.use(passport.initialize());
app.use(passport.session());



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

app.use('/', passportRouter);
app.use('/', index);
app.use('/', users);

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
  User.findOne({
    "_id": id
  }, (err, user) => {
    if (err) {
      return cb(err);
    }
    cb(null, user);
  });
});


// Vérification de l'utilisateur en utilisant passport
passport.use(new LocalStrategy({
  passReqToCallback: true
}, (req, username, password, next) => {
  User.findOne({
    username
  }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(null, false, {
        message: "Incorrect username"
      });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return next(null, false, {
        message: "Incorrect password"
      });
    }
    return next(null, user);
  });
}));



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;