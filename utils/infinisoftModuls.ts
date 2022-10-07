import axios from "axios";
import { config } from "dotenv";
config();

const defaultBody = {
  mid: process.env.MID,
  merkey: process.env.MERKEY,
  moid: "1",
};
export const checkAcntNm = async (
  bankCode: string,
  acntNo: string,
  idNo: string,
  acntNm: string
) => {
  const data = Object.assign({}, defaultBody, {
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
