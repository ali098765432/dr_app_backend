const express = require("express");
const bodyParser = require("body-parser");
const authRouter = require('./routes/auth');
const drUsersRouter = require('./routes/dr_users');
const paUsersRouter = require('./routes/pa_users');
const ratingReviewsRouter = require('./routes/rating_reviews');
const notificationsRouter = require('./routes/notifications');
const pushnotificationsRouter = require('./routes/push-notification');
const visitsRouter = require('./routes/visits');
const earningsRouter = require('./routes/earnings');
const availabilityRouter = require('./routes/availability');
const adminLogin =require('./routes/admin');
const logogenerate =require('./routes/logo-generate');
const multer = require('multer'); // Import the multer library
const fs=require("fs");
const db  = require('./config/db');
const app = express();
const path = require('path');
const FCM = require('fcm-node');

// Middleware
app.use(bodyParser.json());

app.use('/auth', authRouter);
app.use('/drUsers', drUsersRouter);
app.use('/paUsers', paUsersRouter);
app.use('/reviews', ratingReviewsRouter);
app.use('/notifications', notificationsRouter);
app.use('/visits', visitsRouter);
app.use('/earnings', earningsRouter);
app.use('/availability', availabilityRouter);
app.use('/admin', adminLogin);
app.use('/notify', pushnotificationsRouter);
app.use('/logo', logogenerate);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


// Serve static files from the "uploads" folder
app.use('/uploads', express.static('uploads'));





// PORT
const port = process.env.PORT || 3000;

// define a root route
app.get('/', (req, res) => {
    res.send("Hello Welcome to Doctor Booking App Backend");
  });

// Starting a server
app.listen(port, () => {
  console.log(`app is running at ${port}`);
});