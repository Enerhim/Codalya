const express = require("express")
const stripe = require("stripe")('sk_test_51JplglSDy2OlrEImzLZjAjDA8KLHvAY4H40FItTFZUrVk22qOpTw1qHHryEKA4rRWgNR4Ui88xZBSwYsZM5Gkddu00WszV6DTq');
const app = express()

// Main Website

app.use(express.static("public"))

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

// Checkout

app.post("/checkout", async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
            {
                price: 'price_1JqZM0SDy2OlrEImd7y8LmBc',
                quantity: 1
            }
        ],
        success_url:"https://www.youtube.com/watch?v=MbqSMgMAzxU&t=33s",
        cancel_url:"https://www.youtube.com/watch?v=MbqSMgMAzxU&t=33s"
    })

    res.send(session)
})

app.listen(process.env.PORT || 8080)