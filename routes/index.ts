import { Router } from "express";
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
import axios from "axios";
const router = Router();

const routes = (app: any) => {
  router.get("/_api_/imageUpload", async (req, res) => {
    const a = await axios.get(
      "http://172.30.1.1:8080/_api_/getBackupScheduleData"
    );
    console.log(a.data);
    res.send("hello");
  });

  router.post("/_api_/imageUploads", (req, res) => {
    console.log(req.body);
    res.status(200).json({ a: "1" });
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

  router.post("/_api_/depositResult", async (req, res) => {
    const data = req.body;
    const {
      tid,
      shopCode,
      moid,
      goodsName,
      goodsAmt,
      buyerName,
      buyerCode,
      buyerPhoneNo,
      buyerEmail,
      pgName,
      payMethodName,
      pgMid,
      status,
      statusName,
      cashReceiptType,
      cashReceiptSupplyAmt,
      cashReceiptVat,
      pgAppDate,
      pgAppTime,
      pgTid,
      vacctNo,
      vbankBankCd,
      vbankAcctNm,
      vbankRefundAcctNo,
      vbankRefundBankCd,
      vbankRefundAcctNm,
    } = data;

    if (status === "25") {
      const virtualAccount = await prisma.virtualAccount.findFirst({
        where: { tid },
      });
      if (!virtualAccount) throw new Error("virtual account not found");

      const { amt, userId: ownerId } = virtualAccount;
      const balance = Number(amt);
      const accountCash = await prisma.accountCash.findFirst({
        where: {
          ownerId,
        },
        select: {
          balance: true,
        },
      });
      const updateAccountCash = prisma.accountCash.update({
        where: { ownerId },
        data: {
          balance: { increment: BigInt(balance) },
          transactions: {
            create: {
              amount: BigInt(balance),
              type: "DEPOSIT",
              title: `예치금 충전`,
              accumulatedCash: accountCash?.balance! + BigInt(balance),
            },
          },
        },
      });
      const deleteVirtualAccount = prisma.virtualAccount.delete({
        where: { id: virtualAccount.id },
      });
      await prisma.$transaction([updateAccountCash, deleteVirtualAccount]);
      res.status(200).send("0000");
    } else {
      res.status(200).send("0000");
    }
  });

  //1. 펀딩 상태 변경 및 스케줄러 백업 지우는 API

  //2. 서버 재시작 시 스케줄러 백업 정보 가져오는 API
  router.post("/_api_/updateFunding", (req, res) => {
    const { fundingId, backupScheduleId } = req.body;
    prisma.funding.update({
      where: { id: fundingId },
      data: { status: "POST_CAMPAIGN" },
    });
    prisma.schedulerBackUp.delete({ where: { id: backupScheduleId } });
    res.status(200);
  });

  router.get("/_api_/getBackupScheduleData", async (_, res) => {
    const backupSchedules = await prisma.schedulerBackUp.findMany({});
    console.log(backupSchedules);
    res.status(200).json({ backupSchedules });
  });
  return app.use("/", router);
};

export default routes;
