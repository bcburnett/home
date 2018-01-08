const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session')
const validator = require('express-validator')
const sqlite3 = require('sqlite3')
const passport = require('passport')
const flash = require('connect-flash')
var LocalStrategy = require("passport-local").Strategy;
const socket = require('socket.io')
const SQLiteStore = require('connect-sqlite3')(session);
const db = new sqlite3.Database(path.join(__dirname,'data','users'));


const index = require('./routes/index');
const users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator())
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  store: new SQLiteStore,
  secret: 'your secret',
  saveUninitialized: true,
  resave: true,
  "cookie": {
    "maxAge": 1000*60*30
  },
}));
app.use(passport.initialize())
app.use(passport.session())
app.use((req,res,next)=>{
  res.locals.isAuthenticated = req.isAuthenticated()
  next()
})
app.use(flash())
app.use('/', index);
app.use('/users', users);

passport.use(
  new LocalStrategy(function(username, password, done) {
    sql = `select * from users where username = "${username}" `;
    db.all(sql, (err, results) => {
      if(err) return done(err)
      if(results.length ===0) return done(null, false)
      const hash = results[0].password
      // bcrypt.compare(password, hash, (err, response)=>{
         if(password === hash)return done(null, {user_id: results[0].id}); 
         return done(null, false)
    })
  })
);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('partials/error');
});






module.exports = app;
