import axios from "axios";
import { config } from "dotenv";
import { Context } from "../src/context";
import { getFormatDate, getLocalDate } from "./Date";
import { incrBy } from "./redis/ctrl";

config();
const merkey = process.env.MERKEY;
const defaultBody = {
  mid: process.env.MID,
};
export const checkAcntNm = async (
  bankCode: string,
  acntNo: string,
  idNo: string,
  acntNm: string
) => {
  const moid = await incrBy("withdrawalAccountMoid");
  const data = Object.assign({}, defaultBody, {
    merkey,
    moid,
    bankCode,
    acntNo,
    idNo,
    acntNm,
  });
  const result = await axios.post(
    `${process.env.INFINISOFT_URL!}/AcctNmReq.acct`,
    data
  );
  console.log("result");
  console.log(result.data);
  return result.data.resultCode === "0000";
};

export const createVirtualAccount = async (amt: string, context: Context) => {
  const userInfo = await context.prisma.iDVerification.findFirst({
    where: { auth: { user: { id: context.userId } } },
    select: { name: true, auth: { select: { id: true } } },
  });
  if (!userInfo) throw new Error("user not found");

  const date = getLocalDate();
  date.setMinutes(date.getDate() + 1);
  const vbankExpDate = getFormatDate(date);
  const moid = await incrBy("virtualAccountMoid");
  const data = Object.assign({}, defaultBody, {
    licenseKey: merkey,
    countryCode: "KR",
    moid: moid.toString(),
    goodsName: "예치금 충전.",
    amt,
    buyerName: userInfo.name,
    vbankBankCode: "004",
    vbankExpDate,
    vbankAccountName: userInfo.name,
  });

  const vBankResult = await axios.post(
    `${process.env.INFINISOFT_VIRTUAL_ACCOUNT_URL!}/vbankApi`,
    data
  );
  vBankResult.data.userId = context.userId;
  if (vBankResult.data.resultCode !== "4100")
    throw new Error("someting went wrong");

  return { data: vBankResult.data, vbankExpDate };
};
