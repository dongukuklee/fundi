import { Router, Request, Response, NextFunction, Express } from "express";
import imageUpload from "../utils/imageUpload";
import {
  addToSet,
  getSet,
  getString,
  isInSet,
  setString,
} from "../utils/redis/ctrl";
import { prisma } from "../src/context";
import { filter, map } from "underscore";
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
      if (await isInSet("deviceTokens", deviceToken)) return;
      else {
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
          1296000
          //15일
        );
        await addToSet("deviceTokens", deviceToken);
      }

      res.status(200).json({ payload: "success" });
    } catch (error) {
      res.status(400).json({ payload: "fail", error });
    }
  });

  router.post("/_api_/sendAlarm", async (req, res) => {
    const deviceTokens = await getSet("deviceTokens");
    const tokens = filter(
      map(deviceTokens, async (key) => await getString(key)),
      (token) => !!token
    );
  });
  return app.use("/", router);
};

export default routes;
