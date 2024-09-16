var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const expresSession = require('express-session');
const flash = require("connect-flash");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const passport = require('passport');
var path = require('path');
var EJS  = require('ejs');

var app = express();

// view engine setup
app.engine('html', EJS.renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(flash());

app.use(expresSession({
  resave:false,
  saveUninitialized:false,
  secret:"hey hey"
}));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser (usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
