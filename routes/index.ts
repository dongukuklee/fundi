import { Router, Request, Response, NextFunction, Express } from "express";
import imageUpload from "../utils/imageUpload";
import {
  addToSet,
  getSet,
  getString,
  isInSet,
  removeFromSet,
  setString,
} from "../utils/redis/ctrl";
import { prisma } from "../src/context";
import { each, filter, map } from "underscore";
import { sendMessageToMultiDevice } from "../utils/AppPushMessage";
const router = Router();

const routes = (app: any) => {
  router.get("/_api_/imageUpload", (req, res) => {
    res.send("hello");
  });
  router.post(
    "/_api_/imageUpload",
    imageUpload.upload,
    imageUpload.resize,
    imageUpload.result
  );

  router.post("/_api_/checkDeviceToken", async (req, res) => {
    const { deviceToken } = req.body;
    try {
      const isInset = await isInSet("deviceTokens", deviceToken);
      if (isInset) {
      } else {
        const findTokenData = await prisma.deviceToken.findFirst({
          where: { Token: deviceToken },
        });
        let tmp = findTokenData
          ? findTokenData
          : await prisma.deviceToken.create({
              data: {
                Token: deviceToken,
              },
            });
        await setString(
          `deviceToken:${tmp.id}`,
          deviceToken,
          5187600
          //60일
        );
        await addToSet("deviceTokens", `deviceToken:${tmp.id}`);
      }
      res.status(200).json({ payload: "success" });
    } catch (error) {
      res.status(400).json({ payload: "fail", error });
    }
  });

  router.post("/_api_/appPush", async (req, res) => {
    const { title, content } = req.body;
    const deviceTokens = await getSet("deviceTokens");
    const emptyKeys: string[] = [];
    const tokens = await Promise.all(
      map(deviceTokens, async (key) => {
        const token = await getString(key);
        if (!token) emptyKeys.push(key);
        return token;
      })
    );
    const filtered = <string[]>filter(tokens, (token) => !!token);
    sendMessageToMultiDevice(filtered, title, content);
    each(emptyKeys, async (key) => {
      await removeFromSet("deviceTokens", key);
      await prisma.deviceToken.deleteMany({
        where: {
          Token: {
            in: emptyKeys,
          },
        },
      });
    });
  });
  return app.use("/", router);
};

export default routes;
