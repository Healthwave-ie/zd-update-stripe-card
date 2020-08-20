const client = ZAFClient.init();
let userInStripe = false;
const app = document.getElementById("app");
const submitBtn = document.getElementById("submit");

const initApp = () => {
    client
        .get([
            "user.customField:stripe_id",
            "user.name",
            "user.phone",
            "user.email",
        ])
        .then((data) => {
            const stripeId = data["user.customField:stripe_id"];
            const userName = data["user.name"];
            const userPhone = data["user.phone"];
            const userEmail = data["user.email"];
            if (stripeId === null || stripeId === "") {
                console.log(
                    `no Stripe Id for ${userName}, phone: ${userPhone}, email: ${userEmail}`
                );

                submitBtn.innerText = `Create Customer in Stripe`;
                submitBtn.style.backgroundColor = "#008cdd";
            } else {
                userInStripe = true;
                document.getElementById("email").value = stripeId;
                document.getElementById("details").innerText = `Stripe ID`;
                document.getElementById(
                    "button-text"
                ).innerText = `Add card to ${userName}'s profile`;
            }
        });
};

client.on("user.stripe_id.changed", () => {
    client.invoke("notify", "Please reload the app to use the new value");
});

const stripeElements = (publicKey, setupIntent) => {
    const stripe = Stripe(publicKey);
    const elements = stripe.elements();

    // Element styles
    const style = {
        base: {
            fontSize: "16px",
            color: "#32325d",
            fontFamily:
                "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
            fontSmoothing: "antialiased",
            "::placeholder": {
                color: "rgba(0,0,0,0.4)",
            },
        },
    };

    const card = elements.create("card", { style: style });

    card.mount("#card-element");

    // Element focus ring
    card.on("focus", () => {
        const el = document.getElementById("card-element");
        el.classList.add("focused");
    });

    card.on("blur", () => {
        const el = document.getElementById("card-element");
        el.classList.remove("focused");
    });

    const button = document.getElementById("submit");
    button.addEventListener("click", (event) => {
        event.preventDefault();
        changeLoadingState(true);
        const stripeId = document.getElementById("email").value;

        stripe
            .confirmCardSetup(setupIntent.client_secret, {
                payment_method: {
                    card: card,
                    billing_details: { email: email },
                },
            })
            .then((result) => {
                if (result.error) {
                    changeLoadingState(false);
                    const displayError = document.getElementById("card-errors");
                    displayError.textContent = result.error.message;
                } else {
                    // The PaymentMethod was successfully set up
                    orderComplete(stripe, setupIntent.client_secret);
                }
            });
    });
};

const getSetupIntent = (publicKey, stripeId = "") => {
    return fetch("/create-setup-intent", {
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(stripeId !== "" ? { stripeId } : {}),
    })
        .then((response) => {
            return response.json();
        })
        .then((setupIntent) => {
            stripeElements(publicKey, setupIntent);
        });
};

const createNewCustomer = (name, email, phone) => {
    return fetch("/create-customer", {
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone }),
    })
        .then((response) => {
            return response.json();
        })
        .then(() => {});
};

const getPublicKey = () => {
    return fetch("/public-key", {
        method: "get",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            return response.json();
        })
        .then((response) => {
            client.get("user.customField:stripe_id").then((data) => {
                const stripeId = data["user.customField:stripe_id"];
                getSetupIntent(response.publicKey, stripeId);
            });
        });
};

// Show a spinner on payment submission
const changeLoadingState = (isLoading) => {
    if (isLoading) {
        document.querySelector("button").disabled = true;
        document.querySelector("#spinner").classList.remove("hidden");
        document.querySelector("#button-text").classList.add("hidden");
    } else {
        document.querySelector("button").disabled = false;
        document.querySelector("#spinner").classList.add("hidden");
        document.querySelector("#button-text").classList.remove("hidden");
    }
};

/* Shows a success / error message when the payment is complete */
const orderComplete = (stripe, clientSecret) => {
    stripe.retrieveSetupIntent(clientSecret).then((result) => {
        client.invoke("notify", "Card added to Stripe!");
        const setupIntent = result.setupIntent;
        const setupIntentJson = JSON.stringify(setupIntent, null, 2);

        document.querySelector(".sr-payment-form").classList.add("hidden");
        document.querySelector(".sr-result").classList.remove("hidden");
        document.querySelector("pre").textContent = setupIntentJson;
        setTimeout(() => {
            document.querySelector(".sr-result").classList.add("expand");
        }, 200);

        changeLoadingState(false);
    });
};

initApp();
