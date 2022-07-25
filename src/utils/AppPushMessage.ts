import admin from "firebase-admin";
import { DataMessagePayload } from "firebase-admin/lib/messaging/messaging-api";

const message = async (tokens: string[], data: DataMessagePayload) => {
  await admin.messaging().sendToDevice(tokens, data, {
    // Required for background/quit data-only messages on iOS
    contentAvailable: true,
    // Required for background/quit data-only messages on Android
    priority: "high",
  });
};
