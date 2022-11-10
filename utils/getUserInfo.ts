import axios from "axios";
import { Context } from "../src/context";

// 아임포트 api
/////////////////////////
const fetchIdToken = async () => {
  try {
    const getTokenResult = await axios({
      url: "https://api.iamport.kr/users/getToken",
      method: "post", // POST method
      headers: { "Content-Type": "application/json" }, // "Content-Type": "application/json"
      data: {
        imp_key: "7959179441644319", // REST API키
        imp_secret:
          "c66d85a08b183b37c7d096fa82da9494edf9603957de0338d79589005d2dbd218c6a0e1290cd6f2b", // REST API Secret
      },
    });
    const { access_token } = getTokenResult.data.response;
    return access_token;
  } catch (error) {
    console.log(error);
    throw new Error("someting went wrong");
  }
};

const fetchUserInfo = async (imp_uid: string, access_token: string) => {
  return await axios({
    url: `https://api.iamport.kr/certifications/${imp_uid}`, // imp_uid 전달
    method: "get", // GET method
    headers: { Authorization: access_token }, // 인증 토큰 Authorization header에 추가
  });
};

export const getUserInfo = async (imp_uid: string) => {
  try {
    const access_token = <string>await fetchIdToken();
    const getCertifications = await fetchUserInfo(imp_uid, access_token);
    return getCertifications.data.response;
  } catch (error) {
    console.log(error);
    throw new Error("someting went wrong");
  }
};
/////////////////////////////////

//펀디 user info
const signinCheck = (userId: number | undefined) => {
  if (!userId) throw new Error("Cannot inquery user info without signing in");
};

const getUser = async (context: Context) => {
  const { userId } = context;
  signinCheck(userId);
  const user = await context.prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!user) throw new Error("user not found");
  return user;
};

const getUserIDVerificationData = async (context: Context) => {
  const { userId } = context;
  signinCheck(userId);
  const userIDVerificationData = await context.prisma.iDVerification.findFirst({
    where: { auth: { user: { id: userId } } },
  });
  if (!userIDVerificationData) throw new Error("user info not found");
  return userIDVerificationData;
};

const getUserAccountCash = async (context: Context) => {
  const { userId } = context;

  signinCheck(userId);
  const userAccountCash = await context.prisma.accountCash.findFirst({
    where: { ownerId: userId },
  });
  if (!userAccountCash) throw new Error("user account cash not found");
  return userAccountCash;
};

const getUserAccoutBond = async (context: Context, fundingId: number) => {
  const { userId } = context;

  signinCheck(userId);
  const userAccountBond = await context.prisma.accountBond.findFirst({
    where: { ownerId: userId, fundingId },
  });
  if (!userAccountBond) throw new Error("user account bond not found");
  return userAccountBond;
};

const getAuthIdByuserId = async (context: Context) => {
  const user = await getUser(context);
  return user.authId;
};

export {
  signinCheck,
  getUserIDVerificationData,
  getUserAccountCash,
  getAuthIdByuserId,
  getUser,
  getUserAccoutBond,
};
