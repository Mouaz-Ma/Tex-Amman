if (process.env.NODE_ENV !== "production") {
  require('dotenv').config({path: __dirname + '/.env'});
}
require('dotenv').config()
const express = require('express'),
      router = express.Router(),
      qr = require("qrcode"),
      User = require ('../models/users'),
      Degree = require('../models/degree'),
      Visitor = require('../models/visitor'),
      { isLoggedIn } = require('../middleware'),
      nodeMailer = require('nodemailer'),
      moment = require('moment');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'k3ki' });
});

router.get('/tex', (req, res) => {
  res.redirect('/');
})

// POST request listener to convert the user id to qr code and mail it to the user
router.post("/scan", async (req, res) => {
  const pass = process.env.MAIL_PASSWORD;
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
      res.render("visitor", { src });
    })
  } else {
    qr.toDataURL(url, (err, src) => {
      if (err) res.send("Error occured")

      res.set('src', src);

      res.render("visitor", { src });

      let transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, //use ssl
        auth: {
            user: 'tex@marifetedu.com',
            pass: pass
        }
    });
    let mailOptions = {
        from: 'tex@marifetedu.com', // sender address
        to: req.body.email, // list of receivers
        subject: 'بطاقة معرض TEX', // Subject line
        text: 'Marifet', // plain text body
        html: '<h1> شكرا </h1> <p> لقد تم حجز مقعد لك في المعرض يرجى الاحتفاظ بالرمز من خلال صورة أو على بريدك الالكتروني</p> <br> <img src="' + src + '"> <br> <a href="'+ url +'">اضغط هنا لمشاهدت معلوماتك</a> ', // html body
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

// ============
// this route handles the event when the URL of a Visitor was hit
// ============

router.get('/visitor/:id', async(req, res) => {
  if (String(req.params.id).match(/^[0-9a-fA-F]{24}$/)) {
    // Yes, it's a valid ObjectId, proceed with `findById` call.
    if(!req.isAuthenticated()){
      //if you are not logged in as a university show the qr code and simple message
      const { id } = req.params;
      const foundVisitor = await Visitor.findById(id);
      const time = moment(foundVisitor.dateOfBirth);
      const dob = time.format("DD/MM/YYYY");
      const qrurl = "http://amman.marifetedu.com/visitor/" + id.toString();
      qr.toDataURL(qrurl, (err, src) => {
        if (err) res.send("Error occured")
        res.render('visitor', {foundVisitor , dob, src});
      })
      } else {
      //check if he is admin send him to admin info page where he can add the info for a student and print the image
      if( req.user.isAdmin == true){
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
            foundVisitor.degrees.push(degreeCreated);
            foundVisitor.attended = true;
            foundVisitor.save();
          }
        })
        qr.toDataURL(qrurl, (err, src) => {
          if (err) res.send("Error occured")
          res.render('adminInfo', {foundVisitor , dob, src});
        })
      } else {
        //check which university saw this student and record that to the database and render the info so the uni can register the degree
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
            foundVisitor.degrees.push(degreeCreated);
            foundVisitor.attended = true;
            foundVisitor.save();
          }
        })
        qr.toDataURL(qrurl, (err, src) => {
          if (err) res.send("Error occured")
          res.render('info', {foundVisitor , dob, src});
        })
        }
      }
  } else {
    req.flash('error', "the Studen Id isnt a valid ID");
    res.redirect('/');
  }
})


//===============
// update degree routes
//===============

router.put("/user/:id", isLoggedIn, async(req, res) =>{
  // is it admin?
  if( req.user.isAdmin == true){
    const degree = new Degree ();
    degree.text = req.body.degree;
    degree.author = req.user;
    console.log(req.body);
    var newData = {
        Name : req.body.Name,
        email : req.body.email,
        telephoneNumber : req.body.telephonNumber
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
            req.flash('success', 'The User has been updated');
            res.redirect('/visitor/' + visitor._id);
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
        Degree.create(degree, (err, degreeCreated) =>{
          if(err){
            req.flash('error', err.message);
            res.redirect('/');
          } else {
            visitor.degrees.push(degreeCreated);
            visitor.attended = true;
            visitor.save();
            console.log(visitor);
            req.flash('success', 'The Degree desired has been registered');
            res.redirect('/visitor/' + visitor._id);
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
    const text = visitor.Name;
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
