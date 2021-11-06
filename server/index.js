const express = require("express")
const stripe = require("stripe")('sk_test_51JplglSDy2OlrEImzLZjAjDA8KLHvAY4H40FItTFZUrVk22qOpTw1qHHryEKA4rRWgNR4Ui88xZBSwYsZM5Gkddu00WszV6DTq');
const ejs = require('ejs');
const app = express()

const firebaseConfig = {
  apiKey: "AIzaSyDi7z2hYRV1DDs2snF0GxBNXESXFScQjSA",
  authDomain: "codalya.firebaseapp.com",
  projectId: "codalya",
  storageBucket: "codalya.appspot.com",
  messagingSenderId: "587660274507",
  appId: "1:587660274507:web:4a36bf6139e9e8e771d6ce",
  measurementId: "G-JZXCJJWDYH"
};
const firebase = require("firebase/app").initializeApp(firebaseConfig)
const firebaseAuth = require("firebase/auth");
const { errorPrefix } = require("@firebase/util");
const { json } = require("express");

app.use(express.static("public"))
app.use(express.urlencoded());
app.set('view engine', 'ejs');
app.set('views', './public/views');

// Libraries

app.get("/css", (req, res) => {
    const apiKey = req.query.apiKey; 

    if(apiKey === "test") {
        res.sendFile(__dirname + "/lib.css")
    } else {
        res.statusMessage = "Key does not exist or you haven't subscribed";
        res.status(403).end();
    }
})

// Checkout and Payment

app.post("/checkout-monthly", async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
            {
                price: 'price_1JqZM0SDy2OlrEImd7y8LmBc',
                quantity: 1
            }
        ],
        success_url:"http://localhost:8080/paymentS",
        cancel_url:"http://localhost:8080/paymentF"
    })

    res.redirect(303, session.url)
})

app.post("/checkout-yearly", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
          {
              price: 'price_1JqbEGSDy2OlrEImpqOE2fIZ',
              quantity: 1
          }
      ],
      success_url:"http://localhost:8080/paymentS",
      cancel_url:"http://localhost:8080/paymentF"
  })

  res.redirect(303, session.url)
})  

app.post('/webhook', async (req, res) => {
    let data;
    let eventType;
    // Check if webhook signing is configured.
    const webhookSecret = 'whsec_GUf6fQy6f7lPSHHgAkb2d8UusJZl5kpk';
  
    if (webhookSecret) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      let signature = req.headers['stripe-signature'];
  
      try {
        event = stripe.webhooks.constructEvent(
          req['rawBody'],
          signature,
          webhookSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`);
        return res.sendStatus(400);
      }
      // Extract the object from the event.
      data = event.data;
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = req.body.data;
      eventType = req.body.type;
    }
  
    switch (eventType) {
      case 'checkout.session.completed':
        console.log(data)
        break;
      case 'invoice.paid':
        break;
      case 'invoice.payment_failed':
        break;
      default:
      // Unhandled event type
    }
  
    res.sendStatus(200);
  });


// Main Website Routes 


app.listen(process.env.PORT || 8080)

app.get('/', function (req, res) {res.render('pages/index')});
app.get('/index', function (req, res) {res.render('pages/index')});
app.get('/home', function (req, res) {res.render('pages/index')});
app.get('/login', function (req, res) {res.render('pages/login')});
app.get('/signin', function (req, res) {res.render('pages/login')});
app.get('/signup', function (req, res) {res.render('pages/signup')});
app.get('/browse', function (req, res) {res.render('pages/browse')});
app.get('/subscribe', function (req, res) {res.render('pages/subscribe')});
app.get('/premium', function (req, res) {res.render('pages/subscribe')});
app.get('/paymentF', function (req, res) {res.render('pages/payment_fail')});
app.get('/paymentS', function (req, res) {res.render('pages/payment_success')});

app.get('/main.css', function (req, res) {res.sendFile(__dirname + "/public/css/main.css")});

// Login System..


// Sign Up
app.post("/signUp", async (req, res) => {

  var email = req.body.email
  var password = req.body.password
  var confirmP = req.body.confirmP

  let response = {}
  response["errors"] = []
  response["feedback"] = []

  // Check Password
  if (password !== confirmP) {
    response["errors"].push("Confirm Password and Password do not match")
  }

  // Create user
  await firebaseAuth.createUserWithEmailAndPassword(firebaseAuth.getAuth(), email, password )
  .then((userCredential) => {
    var user = userCredential.user;
    response["feedback"].push("Authenticated")
  })
  .catch((error) => {
    response["errors"].push(error.code) 
  });

  console.log("Response: ", response)
  res.send(JSON.stringify(response))
})

// Sign IN

app.post("/signIn", async (req, res) => {
  var email = req.body.email
  var password = req.body.password

  var response = {}
  response["errors"] = []
  response["feedback"] = []

  // Authenticate User

  await firebaseAuth.signInWithEmailAndPassword(firebaseAuth.getAuth(), email, password) .then((userCredential) => {
    const user = userCredential.user;
    response["feedback"].push("Authenticated")  
  })
  .catch((error) => { 
    console.log(error.code)
    response["errors"].push(error.code) 
  });

  console.log(response)
  res.send(JSON.stringify(response))
})