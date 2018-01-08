var express = require("express");
var router = express.Router();
var path = require("path");
var passport = require('passport')

/* GET home page. */
router.get("/", checkAuthentication, function(req, res, next) {
  res.render("partials/hm");
  req.session.errors = null;
});

router.get("/anime",checkAuthentication, function(req, res, next) {
  res.render("partials/anime");
});

router.get("/sqlite3",checkAuthentication,function(req,res,next){
    res.render("partials/sqlite3", { results:req.session.results });
});

router.post("/submit", function(req, res, next) {
  req.check("email", "invalid email address").isEmail();
  req
    .check("password", "invalid password")
    .isLength({ min: 4 })
    .equals(req.body.password2);
  var errors = req.validationErrors();
  if (errors) {
    req.session.errors = errors;
    req.session.success = false;
  } else {
    req.session.success = true;
  }
  res.redirect("/");

  console.log(req.body.email);
  console.log(req.body.password);
  console.log(req.body.password2);
});

router.get("/login", function(req,res,next){
  res.render("partials/login")
})

router.get("/home", checkAuthentication, function(req,res,next){
  res.render("partials/hm")
})

router.get('/logout', function(req, res, next) {
  req.logout()
  req.session.destroy()
  res.redirect('/login')
})

// router.post('/login', function(req, res, next) {
//   passport.authenticate('local', function(err, user, info) {
//     console.log(user)
//     if (err) { return next(err); }
//     if (!user) { res.redirect('/login'); }
//     req.logIn(user, function(err) {
//       if (err) { return next(err); }
//     var sqlite3 = require("sqlite3");
//     let db = new sqlite3.Database("data/users");
//     sql = `select * from users where username = "${req.body.username}" `;
//     db.all(sql, (err, results) => {
//       req.session.results = results
//       console.log(req.body.username);
//       console.log(req.body.password);
//       console.log(req.isAuthenticated())
//       res.redirect("/sqlite3");
//     })
//     });
//   })(req, res, next);
// });

router.post('/login',passport.authenticate('local'), function(req,res,next){
  var sqlite3 = require("sqlite3");
  let db = new sqlite3.Database("data/users");
  sql = `select * from users where username = "${req.body.username}" `;
  db.all(sql, (err, results) => {
    console.log(results);
    req.session.results = results
    console.log(req.body.username);
    console.log(req.body.password);
    console.log(req.isAuthenticated())
    res.redirect("/home");
  })

})

// router.post("/login", function(req, res, next) {
//   var sqlite3 = require("sqlite3");
//   let db = new sqlite3.Database("data/users");
//   sql = `select * from users where username = "${req.body.username}" `;
//   db.all(sql, (err, results) => {
//     console.log(results);
//     req.session.results = results
//     console.log(req.body.username);
//     console.log(req.body.password);
//     console.log(req.user)
//     console.log(req.isAuthenticated())
//     if(req.body.password === results[0].password){
//     res.redirect("/sqlite3");
//     }else{
//       res.redirect('/login')
//     }
//   });

// });

passport.serializeUser(function(user_id, done) {
  done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
    done(null, user_id);
});

function checkAuthentication(req,res,next){
  if(req.isAuthenticated()){
      //if user is looged in, req.isAuthenticated() will return true 
      next();
  } else{
      res.redirect("/login");
  }
}

module.exports = router;
