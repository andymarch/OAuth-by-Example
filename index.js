require('dotenv').config()
const express = require('express')
const hbs  = require('express-handlebars')
const session = require('express-session')
var auth = require('./auth')

const PORT = process.env.PORT || 3000;

app = express();

app.engine('hbs',  hbs( { 
    extname: 'hbs', 
    defaultLayout: 'main', 
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/',
    helpers: {
        json: function(json){
            return JSON.stringify(json, undefined, '\t');
          },
          jwt: function (token){
              var atob = require('atob');
              if (token != null) {
                  var base64Url = token.split('.')[1];
                  var base64 = base64Url.replace('-', '+').replace('_', '/');
                  return JSON.stringify(JSON.parse(atob(base64)), undefined, '\t');
              } else {
                  return "Invalid or empty token was parsed"
              }
          }
    }
 }));

app.set('view engine', 'hbs');
app.use('/static', express.static('static'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  cookie: { httpOnly: true },
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: true
}));


var auth = new auth();
app.use(auth.setContext)

var indexRouter = require('./routes/index')(auth)
var acRouter = require('./routes/ac')(auth)
var ccRouter = require('./routes/cc')(auth)
var verifyRouter = require('./routes/verify')(auth)

app.use('/', indexRouter)
app.use('/authorization-code', acRouter)
app.use('/client-credentials', ccRouter)
app.use('/verify',verifyRouter)

app.listen(PORT, () => console.log('App started on '+PORT));