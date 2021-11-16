const express = require("express")
const { json } = require("express")
const stripe = require("stripe")('sk_test_51JplglSDy2OlrEImzLZjAjDA8KLHvAY4H40FItTFZUrVk22qOpTw1qHHryEKA4rRWgNR4Ui88xZBSwYsZM5Gkddu00WszV6DTq')
const ejs = require('ejs')
const crypto = require("crypto")
const app = express()

const firebaseConfig = {
  apiKey: "AIzaSyDi7z2hYRV1DDs2snF0GxBNXESXFScQjSA",
  authDomain: "codalya.firebaseapp.com",
  projectId: "codalya",
  storageBucket: "codalya.appspot.com",
  messagingSenderId: "587660274507",
  appId: "1:587660274507:web:4a36bf6139e9e8e771d6ce",
  measurementId: "G-JZXCJJWDYH"
}
const firebase = require("firebase/app").initializeApp(firebaseConfig)
const firebaseAuth = require("firebase/auth")
const { addDoc, collection, where } = require("@firebase/firestore")
const firebaseDB = require("firebase/firestore")
const firestore = firebaseDB.getFirestore()

app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.set('views', './public/views')

// Libraries

app.get("/css", (req, res) => {
    const apiKey = req.query.apiKey 

    if(apiKey === "test") {
        res.sendFile(__dirname + "/lib.css")
    } else {
        res.statusMessage = "Key does not exist or you haven't subscribed"
        res.status(403).end()
    }
})

//#region Checkout and Payment

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
    let data
    let eventType
    // Check if webhook signing is configured.
    const webhookSecret = 'whsec_GUf6fQy6f7lPSHHgAkb2d8UusJZl5kpk'
  
    if (webhookSecret) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event
      let signature = req.headers['stripe-signature']
  
      try {
        event = stripe.webhooks.constructEvent(
          req['rawBody'],
          signature,
          webhookSecret
        )
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`)
        return res.sendStatus(400)
      }
      // Extract the object from the event.
      data = event.data
      eventType = event.type
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = req.body.data
      eventType = req.body.type
    }
  
    switch (eventType) {
      case 'checkout.session.completed':
        console.log(data)
        break
      case 'invoice.paid':
        console.log(data)
        break
      case 'invoice.payment_failed':
        console.log(data)
        break
      default:
      // Unhandled event type
    }
  
    res.sendStatus(200)
})

//#endregion

//#region Main Website Routes 

app.listen(process.env.PORT || 8080)

app.get('/', function (req, res) {res.render('pages/index')})
app.get('/index', function (req, res) {res.render('pages/index')})
app.get('/home', function (req, res) {res.render('pages/index')})
app.get('/login', function (req, res) {res.render('pages/login')})
app.get('/signin', function (req, res) {res.render('pages/login')})
app.get('/signup', function (req, res) {res.render('pages/signup')})
app.get('/browse', function (req, res) {res.render('pages/browse')})
app.get('/subscribe', function (req, res) {res.render('pages/subscribe')})
app.get('/premium', function (req, res) {res.render('pages/subscribe')})
app.get('/paymentF', function (req, res) {res.render('pages/payment_fail')})
app.get('/paymentS', function (req, res) {res.render('pages/payment_success')})
app.get('/settings', function (req, res) {res.render('pages/settings')})
app.get('/profile', function (req, res) {res.render('pages/settings')})
app.get('/account', function (req, res) {res.render('pages/settings')})
app.get('/verify-email', function (req, res) {res.render("pages/verify-email")})

app.get('/main.css', function (req, res) {res.sendFile(__dirname + "/public/css/main.css")})

//#endregion

//#region Authentication
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
  .then( async (userCredential) => {
    response["feedback"].push("Authenticated")
    try {
      const docRef = await addDoc(collection(firestore, "users"), {
        currently_premium: false,
        remaining_months: 0,
        subscription_end: firebaseDB.serverTimestamp() ,
        user_email: email,
        createdAt: firebaseDB.serverTimestamp(),
        verified: false,
        aid: userCredential.user.uid
      })

      firebaseAuth.sendEmailVerification(firebaseAuth.getAuth().currentUser).then(() => {
        console.log("EMAIL")
      })
    } catch (e) {
      response["errors"].push(e)
    }
  })
  .catch((error) => {
    response["errors"].push(error.code) 
  })

  console.log("Response: ", response)
  res.send(JSON.stringify(response))
})

// Sign In
app.post("/signIn", async (req, res) => {
  var email = req.body.email
  var password = req.body.password

  var response = {}
  response["errors"] = []
  response["feedback"] = []

  // Authenticate User

  await firebaseAuth.signInWithEmailAndPassword(firebaseAuth.getAuth(), email, password) .then(async (userCredential) => {
    const user = userCredential.user
    if (user.emailVerified) {
      // Get Doc
      const q = firebaseDB.query(firebaseDB.collection(firestore, "users"), where("user_email", "==", email));
      const querySnapshot = await firebaseDB.getDocs(q)
      
      querySnapshot.forEach(async(doc) => {
        console.log(doc.id)

        const userRef = firebaseDB.doc(firestore, "users", doc.id)
        await firebaseDB.updateDoc(userRef, {
          verified: true
        })
      })

      // Update Field
      

      response["feedback"].push("Authenticated")  
      response["feedback"].push(`tokenAuth_${crypto.randomBytes(32).toString("hex")}${user.uid}${crypto.randomBytes(32).toString("hex")}`)
    } else {
      response["errors"].push("Not Verified Email")
    }
  })
  .catch((error) => { 
    console.log(error.code)
    console.log(error.message)
    response["errors"].push(error.code) 
  })

  console.log(response)
  res.send(JSON.stringify(response))
})

// Verify Email
app.post("/verifyEmail", async (req, res) => {
  var response = {}
  response["errors"] = []
  response["feedback"] = []

  await firebaseAuth.sendEmailVerification(firebaseAuth.getAuth().currentUser).then(() => {
    response["feedback"] = "Sent Email"
  })
  .catch((error) => {
    console.log(error)
    response["errors"].push(error)
  })

  res.send(JSON.stringify(response))
})

app.post("/getSettings", async (req, res) => {
  var response = {}
  response["errors"] = []
  response["feedback"] = []

  var aid = (req.body.aid)
  aid = aid.substring(74, aid.length - 64)

  const q = firebaseDB.query(firebaseDB.collection(firestore, "users"), where("aid", "==", aid  ));
  const querySnapshot = await firebaseDB.getDocs(q)

  querySnapshot.forEach(async(doc) => {
    response["feedback"].push(doc.get("user_email"))
    response["feedback"].push("*".repeat(Math.round(Math.random() * 10+6)))
    
    var createdAt = doc.get("createdAt").toDate()
    createdAt = createdAt.toString().split(' ')
    createdAt = `${createdAt[1]} ${createdAt[2]} ${createdAt[3]} @ ${createdAt[4]} ${createdAt[5]}`
    response["feedback"].push(createdAt)
    
    response["feedback"].push(doc.get("currently_premium"))

    var sub_end = doc.get("subscription_end").toDate()
    sub_end = sub_end.toString().split(' ')
    sub_end = `${sub_end[1]} ${sub_end[2]} ${sub_end[3]} @ ${sub_end[4]} ${sub_end[5]}`
    response["feedback"].push(sub_end)

    
  })
  res.send(JSON.stringify(response))
})

// get Accounts Page

//#endregion