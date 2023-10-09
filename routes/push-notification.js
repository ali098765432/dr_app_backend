// var admin=require("firebase-admin");
// var fcm=require("fcm-notification");
// var express = require('express');
// var router = express.Router();
// var serviceAccount=require("../config/push-notification-key.json")

// const certPath=admin.credential.cert(serviceAccount);
// var FCM=new fcm(certPath);

// router.post("/push-notification",(req,res)=>{


//     try {

//        let message={

//         notification:{
//             title:"hello notify",
//             body:"first notification message"
//         },
//         data:{
//             orderId:"1234",
//             orderDate:"20-12-2023"
//         },
//         token:req.body.fcm_token,
//        }
//        FCM.send(message,function(res,error){
//         if(error){
//         return res.status(500).send({

//             message:error
//         })}
//         else{
//             return res.status(200).send({
//                 message:"Notification Send",
//             })
//         }
//        })
        
//     } catch (error) {
//         throw error;
//     }
// })
const admin = require("firebase-admin");
const express = require('express');
const router = express.Router();

// Initialize Firebase Admin SDK with your service account credentials
const serviceAccount = require("../config/push-notification-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
  // No need for databaseURL in this case
});

router.post("/push-notification", (req, res) => {
  try {
    const registrationToken = req.body.fcm_token;
    const title=req.body.title;
    const body=req.body.body;
    

    const message = {
      
      notification: {
        title: title,
        body:body
      },
      token: registrationToken
    };

    // Send the message to the device corresponding to the provided registration token
    admin.messaging().send(message)
      .then((response) => {
        console.log("Successfully sent message:", response);
        return res.status(200).send({
          message: "Notification Sent",
        });
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        return res.status(500).send({
          message: "Error sending notification"
        });
      });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      message: "Internal Server Error"
    });
  }
});

module.exports = router;