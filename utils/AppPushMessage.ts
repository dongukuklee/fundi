import admin from "firebase-admin";
require("dotenv").config();

type notification = {
  title: string;
  body: string;
};

type notificationData = {
  notification: notification;
  token: string;
};

admin.initializeApp({
  credential: admin.credential.cert({
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.APP_PUSH_PRIVATE_KEY,
    projectId: process.env.PROJECT_ID,
  }),
});

const message = (data: notificationData) => {
  admin
    .messaging()
    .send(data)
    .then(function (response) {
      console.log("Successfully sent message: : ", response);
    })
    .catch(function (err) {
      console.log("Error Sending message!!! : ", err);
    });
};

export const sendMessageToDevice = async (
  token: string,
  title: string,
  body: string
) => {
  const data = {
    notification: {
      title,
      body,
    },
    token,
  };

  await message(data);
};
