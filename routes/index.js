if (process.env.NODE_ENV !== "production") {
  require('dotenv').config({path: __dirname + '/.env'});
}
var express = require('express');
var router = express.Router();
var qr = require("qrcode");
require('dotenv').config()
const User = require ('../models/users');
const Degree = require('../models/degree');
const Visitor = require('../models/visitor');
const { isLoggedIn } = require('../middleware');
var nodeMailer = require('nodemailer');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'k3ki' });
});

router.get('/tex', (req, res) => {
  res.redirect('/');
})



// get for showing the sign up form
// post for registering the university 
// get login 
// post for login 
// log out route as well 

router.get('/visitor/:id', async(req, res) => {
  if (String(req.params.id).match(/^[0-9a-fA-F]{24}$/)) {
    // Yes, it's a valid ObjectId, proceed with `findById` call.
    if(!req.isAuthenticated()){
      //if you are not logged in as a university show the qr code and simple message
      const { id } = req.params;
      const foundVisitor = await Visitor.findById(id);
      const time = moment(visitor.dateOfBirth);
      const dob = time.format("DD/MM/YYYY");
      const qrurl = "http://amman.marifetedu.com/visitor/" + id.toString();
      qr.toDataURL(qrurl, (err, src) => {
        if (err) res.send("Error occured")
        res.render('visitor', {visitor , dob, src});
      })
      } else {
      //else check which university saw this student and record that to the database and render the info so the uni can register the degree
      //check if he is admin send him to admin info page where he can add the info for a student and print the image
      if( req.visitor.isAdmin == true){
        const { id } = req.params;
        const visitor = await visitor.findById(id);
        const time = moment(visitor.dateOfBirth);
        const dob = time.format("DD/MM/YYYY");
        const qrurl = "http://amman.marifetedu.com/visitor/" + id.toString();
        const degree = new Degree ();
        degree.author = req.user;
        Degree.create(degree, (err, degreeCreated) =>{
          if(err){
            req.flash('error', err.message);
            res.redirect('/');
          } else {
            foundVisitor.degrees.push(degreeCreated);
            foundVisitor.attended = true;
            foundVisitor.save();
          }
        })
        qr.toDataURL(qrurl, (err, src) => {
          if (err) res.send("Error occured")
          console.log(foundVisitor);
          res.render('adminInfo', {foundVisitor , dob, src});
        })
      } else {
        const { id } = req.params;
        const foundVisitor = await Visitor.findById(id);
        const time = moment(foundVisitor.dateOfBirth);
        const dob = time.format("DD/MM/YYYY");
        const qrurl = "http://amman.marifetedu.com/visitor/" + id.toString();
        const degree = new Degree ();
        degree.author = req.user;
        Degree.create(degree, (err, degreeCreated) =>{
          if(err){
            req.flash('error', err.message);
            res.redirect('/');
          } else {
            foundUser.degrees.push(degreeCreated);
            foundUser.attended = true;
            foundUser.save();
          }
        })
        qr.toDataURL(qrurl, (err, src) => {
          if (err) res.send("Error occured")
          res.render('info', {foundUser , dob, src});
        })
        }
      }
  } else {
    req.flash('error', "the Studen Id isnt a valid ID");
    res.redirect('/');
  }
})


//===============
//degree routes
//===============

router.put("/user/:id", isLoggedIn, async(req, res) =>{
  if( req.user.isAdmin == true){
    console.log(req.body);
    const degree = new Degree ();
    degree.text = req.body.degree;
    degree.author = req.user;
    var newData = {
        Name : req.body.Name,
        dateOfBirth : req.body.dateOfBirth,
        email : req.body.email,
        telephoneNumber : req.body. telephonNumber,
        nationality : req.body.nationality,
    }
    Visitor.findByIdAndUpdate(req.params.id, {$set: newData} ,(err, visitor) =>{
      if(err){
        req.flash('error', err.message);
        res.redirect('/');
      } else {
        Degree.create(degree, (err, degreeCreated) =>{
          if(err){
            req.flash('error', err.message);
            res.redirect('/');
          } else {
            visitor.degrees.push(degreeCreated);
            visitor.attended = true;
            console.log(user);
            req.flash('success', 'The User has been updated');
            res.redirect('/visitor/' + user._id);
          }
        })
      }
    })
  } else {
    const { id } = req.params.id;
    await Visitor.findById(req.params.id, (err, visitor) =>{
      if(err){
        req.flash('error', err.message);
        res.redirect('/');
      } else {
        const degree = new Degree ();
        degree.text = req.body.degree;
        degree.author = req.user;
        console.log(degree);
        Degree.create(degree, (err, degreeCreated) =>{
          if(err){
            req.flash('error', err.message);
            res.redirect('/');
          } else {
            console.log(typeof(degreeCreated));
            visitor.degrees.push(degreeCreated);
            visitor.attended = true;
            visitor.save();
            console.log(visitor);
            req.flash('success', 'The Degree desired has been registered');
            res.redirect('/visitor/' + user._id);
          }
        })
      }
    })
  }
  
})

// ==============
// printing functionality
// ==============

router.get("/user/:id/print", async(req, res) => {
  const { id } = req.params;
  await Visitor.findById(req.params.id, (err, visitor) =>{
    const text = user.Name;
    console.log(typeof(text))
    const canvas = createCanvas(700, 400);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '50px serif';
    context.textAlign = 'center';
    context.fillStyle = '#000000';
    context.fillText(text, 350, 180)
    const qrurl = "http://amman.marifetedu.com/visitor/" + id.toString();
  qr.toDataURL(qrurl, (err, src) => {
    if (err){ res.send("Error occured")}
    else {
      loadImage(src).then(image => {
        context.drawImage(image, 270, 200);
        const buffer = canvas.toBuffer('image/jpeg');
        fs.writeFileSync('image.jpeg', buffer); 
        res.download('image.jpeg');
      })
    }
  })
  })
})

module.exports = router;
