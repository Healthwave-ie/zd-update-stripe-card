const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const appPage = path.resolve(`${__dirname}/client/index.html`);

app.use(cookieParser());
app.use(
    express.json({
        // We need the raw body to verify webhook signatures.
        // Let's compute it only when hitting the Stripe webhook endpoint.
        verify: (req, res, buf) => {
            if (req.originalUrl.startsWith("/webhook")) {
                req.rawBody = buf.toString();
            }
        },
    })
);

// app.use(express.static(`${__dirname}/client/`));

app.get("/", async (req, res) => {
    const queryString = req.originalUrl; // We need to retrieve this to use ZAF server-side
    res.cookie(`zaf_params`, queryString);
    res.redirect(`/app${queryString}`);
});

app.use(express.static(path.join(__dirname, "client")));

app.get("/app", async (req, res) => {
    res.sendFile(appPage);
});

app.get("/public-key", (req, res) => {
    res.send({ publicKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

app.post("/create-setup-intent", async (req, res) => {
    const { stripeId } = req.body;

    res.send(
        await stripe.setupIntents.create({
            customer: stripeId,
        })
    );
});

// Webhook handler for asynchronous events.
app.post("/webhook", async (req, res) => {
    let data;
    let eventType;

    // Check if webhook signing is configured.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
        // Retrieve the event by verifying the signature using the raw body and secret.
        let event;
        let signature = req.headers["stripe-signature"];

        try {
            event = await stripe.webhooks.constructEvent(
                req.rawBody,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
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

    if (eventType === "setup_intent.created") {
        console.log(`🔔  A new SetupIntent is created. ${data.object.id}`);
    }

    if (eventType === "setup_intent.setup_failed") {
        console.log(`🔔  A SetupIntent has failed to set up a PaymentMethod.`);
    }

    if (eventType === "setup_intent.succeeded") {
        console.log(
            `🔔  A SetupIntent has successfully set up a PaymentMethod for future use.`
        );
    }

    if (eventType === "payment_method.attached") {
        console.log(
            `🔔  A PaymentMethod ${data.object.id} has successfully been saved to a Customer ${data.object.customer}.`
        );

        // At this point, associate the ID of the Customer object with your
        // own internal representation of a customer, if you have one.

        // Optional: update the Customer billing information with billing details from the PaymentMethod
        const customer = await stripe.customers.update(
            data.object.customer,
            { email: data.object.billing_details.email },
            () => {
                console.log(`🔔  Customer successfully updated.`);
            }
        );
    }

    res.sendStatus(200);
});

app.listen(4242, () => console.log(`Node server listening on port ${4242}!`));
