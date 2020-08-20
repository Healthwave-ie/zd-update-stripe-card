# README :notebook:

This a Zendesk Application build with NodeJs consisting of a back-end serving static files as well as the Stripe API client and a Zendesk-App folder being the files uploaded to Zendesk as a wrapper.

---

## Dev :nerd_face:

### Node (back-end)

To launch the app locally, you can start up the Node application

```
$ cd node-stripe
$ node -r dotenv/config index.js
```

Note that here, you need to include the dotenv config in order to utlize Stripe as the .env file contains the `STRIPE_SECRET_KEY` needed for the client to be created.

You can also use Docker :whale2:

```
$ cd node-stripe
$ docker build -t zd-update-stripe-card . // this is only needed once
$ docker container run -it -p 4242:4242 --env-file=.env zd-update-stripe-card
```

This should spin up a server on port `4242`
Note that if you wish to change that port, you will need to update it as well in the _`manifest.json`_ file in `zendesk-app`.

The choice to Dockerize the app makes it easier to deploy to AWS using ECR and easier to implement a solid build/deploy pipeline too.

### Zendesk (client)

To lauch the Ruby server that allows to locally test a Zendesk app, you must install Ruby and ZAT. More info on [Installing and using the Zendesk apps tools](https://develop.zendesk.com/hc/en-us/articles/360001075048-Installing-and-using-the-Zendesk-apps-tools)

Once all is installed you can do

```
$ cd zendesk-app
$ zat server
```

Then you can open zendesk in your browser, navigate to a user profile (the app is configured to display only in the `user_sidebar` since it's utilizing data only available there) and append your url with <span style="color:lime;">_?zat=true_</span>

```
https://mydomain.zendesk.com/...../?zat=true
```
