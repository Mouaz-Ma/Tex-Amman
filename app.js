if (process.env.NODE_ENV !== "production") {
  require('dotenv').config({path: __dirname + '/.env'});
}

var createError = require('http-errors');
var express = require('express');
var path = require('path');
require('dotenv').config({path: __dirname + '/.env'});
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var qr = require("qrcode");
var nodeMailer = require('nodemailer');

const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const fs = require('fs');
// canvas setup
const { createCanvas, loadImage } = require('canvas')


const passport = require('passport');
const localStrategy = require('passport-local');
const University = require('./models/users');


var moment = require('moment');

var indexRouter = require('./routes/index');
//var usersRouter = require('./routes/users');
var registerRoutes = require('./routes/register')
var mongoose=require('mongoose');

const User = require ('./models/users');
const Degree = require('./models/degree');
const { isLoggedIn } = require('./middleware');

//mongoose.connect('mongodb://127.0.0.1:27017/k3ki', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false , useCreateIndex: true});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const store = new MongoStore({
  mongoUrl: process.env.DB_URL,
  secret: process.env.SESSION_SECRET,
   touchAfter: 24 * 3600
})

store.on("error", function(e){
  console.log("SESSION STORE ERROR", e)
})

const sessionOptions = { 
  store,
  secret: process.env.SESSION_SECRET , 
  resave: false, 
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(University.authenticate()));

passport.serializeUser(University.serializeUser());
passport.deserializeUser(University.deserializeUser());
app.use(flash());
app.use(methodOverride('_method'))

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})



app.use('/', registerRoutes);
app.use('/', indexRouter);
//app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// POST request listener to convert the user id to qr code and mail it to the user
app.post("/scan", async (req, res) => {
  console.log(req.body);
    let newVisitor = new Visitor(req.body);
    await newVisitor.save();

  const url =  "http://amman.marifetedu.com/visitor/" + newVisitor._id.toString();

  // If the input is null return "Empty Data" error
  if (newVisitor.length === 0) res.send("Empty Data!");
  
  // Let us convert the input stored in the url and return it as a representation of the QR Code image contained in the Data URI(Uniform Resource Identifier)
  // It shall be returned as a png image format
  // In case of an error, it will save the error inside the "err" variable and display it
  //checking if there is an email

  if (req.body.email == ''){
    qr.toDataURL(url, (err, src) => {
      if (err) res.send("Error occured")

      res.set('src', src);
      res.render("/visitor", { src });
    })
  } else {
    qr.toDataURL(url, (err, src) => {
      if (err) res.send("Error occured")

      res.set('src', src);

      res.render("/visitor", { src });

      let transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, //use ssl
        auth: {
            user: 'tex@marifetedu.com',
            pass: procces.env.MAIL_PASSWORD
        }
    });
    let mailOptions = {
        from: 'tex@marifetedu.com', // sender address
        to: req.body.email, // list of receivers
        subject: 'بطاقة معرض TEX', // Subject line
        text: 'Marifet', // plain text body
        html: '<h1> شكرا </h1> <p> لقد تم حجز مقعد لك في المعرض يرجى الاحتفاظ برمز ال QR من خلال صورة أو على بريدك الالكتروني</p> <br> <img src="' + src + '"> <br> <a href="'+ url +'">اضغط هنا لمشاهدت معلوماتك</a> ', // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log("Message sent: %s", info.messageId);

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    });
  });
  }
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

// Setting up the port for listening requests
const port = process.env.PORT || 5000;
app.listen(port, () => console.log("Server at 5000"));

//testing token


