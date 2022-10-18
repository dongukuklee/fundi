import axios from "axios";
import { config } from "dotenv";
import { Context } from "../src/context";
import { getFormatDate, getLocalDate } from "./Date";
import { incrBy } from "./redis/ctrl";

config();
const merkey = process.env.MERKEY;
const depAcntNo = process.env.DEPACNTNO;
const depAcntNm = process.env.DEPACNTNM;
const defaultBody = {
  mid: process.env.MID,
};
export const checkAcntNm = async (
  bankCode: string,
  acntNo: string,
  idNo: string,
  acntNm: string
) => {
  const moid = await incrBy("checkAccountNameMoid");
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
  return result.data.resultCode === "0000";
};

export const createVirtualAccount = async (amt: string, context: Context) => {
  const userInfo = await context.prisma.iDVerification.findFirst({
    where: { auth: { user: { id: context.userId } } },
    select: { name: true, auth: { select: { id: true } } },
  });
  if (!userInfo) throw new Error("user not found");

  const date = getLocalDate();
  date.setDate(date.getDate() + 1);
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

export const makingMoneyTransfers = async (
  bankCode: string,
  acntNo: string,
  acntNm: string,
  amt: string
) => {
  const moid = await incrBy("makingMoneyTransferMoid");
  const data = Object.assign({}, defaultBody, {
    merkey,
    moid,
    bankCode,
    acntNo,
    acntNm,
    amt,
    depAcntNo,
    depAcntNm,
  });
  const d = await axios.post(
    `${process.env.INFINISOFT_URL!}/AcctOutTransReq.acct`,
    data
  );
  console.log(d);
};
