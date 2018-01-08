#!/usr/bin/env node

/**
 * Module dependencies.
 */

// var app = require('../app');
var debug = require('debug')('01-express:server');
var http = require('http');
const socket = require('socket.io')
const sqlite3 = require('sqlite3')
const path = require('path')
const request = require('request')
const express = require('express');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session')
const validator = require('express-validator')
const passport = require('passport')
const flash = require('connect-flash')
var LocalStrategy = require("passport-local").Strategy;
const SQLiteStore = require('connect-sqlite3')(session);
const db = new sqlite3.Database(path.join('data','users'));
var app = express();



let wdold = ''
/**
 * Get port from environment and store in Express.
 */

var port = 3000;
app.set('port', port);


/**
 * Create HTTP server.
 */

var server = http.createServer(app);
const io = socket(server)
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}


const index = require('./routes/index');
const users = require('./routes/users');


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
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
  "expires": false,
  resave: false,
  "cookie": {
    "maxage": 1000*60*60
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




io.on('connection', socket => {



  socket.on('wbUpdate', data => {
       socket.broadcast.emit('wbUpdate', data)
  }) 
  
  socket.on('wbDraw', data => {
      console.log(data)
      socket.broadcast.emit('wbDraw', data)
  })   


  socket.on('wbClear', data => {
      console.log(data)
      io.sockets.emit('wbClear', data)
  })


  socket.on('EditorSend', data => {
      console.log(data)
      io.sockets.emit('EditorSend', data)
  })

  socket.on('chat', data => {
      io.sockets.emit('chat', data)
  })

  socket.on('todoadd', data => {
    const db = new sqlite3.Database(path.join('data','todo.sqlite'));
      sql = `insert into todo values(null,'${data.todo}','${data.duedate}',null)`
      db.all(sql, (err, results) => {
          sql = 'select * from todo'
          db.all(sql, (err, results) => {
              io.sockets.emit('todoget', {
                  message: results
              })
          })
      })
  })

  socket.on('todoget', data => {
    const db = new sqlite3.Database(path.join('data','todo.sqlite'));
      sql = 'select * from todo'
      db.all(sql, (err, results) => {
          io.sockets.emit('todoget', {
              message: results
          })
      })
  })

  socket.on('tododel', data => {
    const db = new sqlite3.Database(path.join('data','todo.sqlite'));
      let sql = `delete from todo where id='${data.id}'`
      db.all(sql, (err, results) => {
          sql = 'select * from todo'
          db.all(sql, (err, results) => {
              io.sockets.emit('todoget', {
                  message: results
              })
          })
      })
  })

  socket.on('tododone', data => {
    const db = new sqlite3.Database(path.join('data','todo.sqlite'));
      let done
      if (data.done === 'checked') {
          done = ''
      } else {
          done = 'checked'
      }
      let sql = `update todo set done='${done}' where id='${data.id}'`
      db.all(sql, (err, results) => {
          sql = 'select * from todo'
          db.all(sql, (err, results) => {
              socket.broadcast.emit('todoget', {
                  message: results
              })
          })
      })
  })

  socket.on('RecipeSearch', data => {
      console.log(data)
      var url = `http://food2fork.com/api/search?key=3ce944466e75fa8252ea9b665ef3c4f3&q=${data.search}`
      request({
          url: url,
          json: true
      }, function (error, response, body) {
          if (!error && response.statusCode === 200) {
              const htdata = body
                  socket.emit('RecipeSearch', {htdata})
          } else{console.dir(error)}
      })
  })

  socket.on('WikiSearch', data => {
      console.log(data)
      var url = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&utf8=1&srsearch=${data.search.replace(' ', '%20')}`
      request({
          url: url,
          json: true
      }, function (error, response, htdata) {
          if (!error && response.statusCode === 200) {
                  socket.emit('WikiSearch', {htdata:htdata.query.search})
          }
      })
  })

  socket.on('recipeget', data => {
    const db = new sqlite3.Database(path.join('data','todo.sqlite'));
      sql = 'select * from recipe'
      db.all(sql, (err, results) => {
          io.sockets.emit('recipeget', {
              results: results
          })
      })
  })

  socket.on('recipeadd', data => {
    const db = new sqlite3.Database(path.join('data','todo.sqlite'));
      sql = `insert into recipe values(null,'${data.title}','${data.ingredients}','${data.directions}')`
      db.all(sql, (err, results) => {
          console.log(err)
          sql = 'select * from recipe'
          db.all(sql, (err, results) => {
              io.sockets.emit('recipeget', {
                  results: results
              })
          })
      })
  })

})
