import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import * as jwt from "jsonwebtoken";
import {
  addToSet,
  deleteString,
  getString,
  setString,
} from "../../utils/redis/ctrl";
import { Context } from "../context";
import { User } from "@prisma/client";
import {
  getAuthIdByuserId,
  getUserInfo,
  signinCheck,
} from "../../utils/getUserInfo";
import { getCreateDateFormat } from "../../utils/Date";
import { send_gmail } from "../../utils/auth";

const APP_SECRET = process.env.APP_SECRET!;

const parseGenderToInt = (birthDay: string, gender: string) => {
  const year = Number(birthDay.substring(0, 4));
  let parseGender;
  if (year < 2000) {
    parseGender = gender === "male" ? 1 : 2;
  } else {
    parseGender = gender === "male" ? 3 : 4;
  }
  return parseGender;
};

type userInfo = {
  birthday: string;
  gender: string;
  name: string;
  unique_key: string;
};

const getTokenAndUser = (user: User) => {
  const token = jwt.sign(
    { userId: user.id, userRole: user.role, userName: user.nickName },
    APP_SECRET
  );
  return { token, user };
};

export const Auth = objectType({
  name: "Auth",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("email");
    t.string("nickName");
    t.string("pincode");
    t.nonNull.boolean("isVerified");
    t.field("user", {
      type: "User",
      resolve(parent, args, context, info) {
        return context.prisma.auth
          .findUnique({ where: { id: parent.id } })
          .user();
      },
    });
    t.field("IDVerification", {
      type: "IDVerification",
      resolve(parent, args, context, info) {
        return context.prisma.auth
          .findUnique({ where: { id: parent.id } })
          .IDVerification();
      },
    });
    t.field("withdrawalAccount", {
      type: "WithdrawalAccount",
      resolve(parent, args, context, info) {
        return context.prisma.auth
          .findUnique({ where: { id: parent.id } })
          .withdrawalAccount();
      },
    });
  },
});

export const AuthPayload = objectType({
  name: "AuthPayload",
  definition(t) {
    t.nonNull.string("token");
    t.nonNull.field("user", {
      type: "User",
    });
  },
});

export const AuthQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.field("verificationCode", {
      type: "Boolean",
      args: {
        email: nonNull(stringArg()),
        verificationCode: nonNull(stringArg()),
      },
      resolve: async (parent, { email, verificationCode }, { prisma }) => {
        return (await getString(email)) === verificationCode;
      },
    });
    t.field("checkPincode", {
      type: "Boolean",
      args: {
        pincode: nonNull(stringArg()),
      },
      async resolve(parent, { pincode }, context, info) {
        const { userId } = context;
        signinCheck(userId);
        const authId = await getAuthIdByuserId(context);
        const auth = await context.prisma.auth.findUnique({
          where: {
            id: authId,
          },
        });
        return pincode === auth?.pincode;
      },
    });
  },
});

export const AuthMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("signup", {
      type: "AuthPayload",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
        nickName: stringArg(),
      },
      async resolve(parent, args, context, info) {
        const { email, nickName, password } = args;
        const user = await context.prisma.user.create({
          data: {
            ...getCreateDateFormat(),
            email,
            auth: {
              create: {
                email,
                password,
                nickName,
                ...getCreateDateFormat(),
              },
            },
            accountCash: {
              create: {},
            },
          },
        });

        return getTokenAndUser(user);
      },
    });
    t.nonNull.field("signin", {
      type: "AuthPayload",
      args: {
        email: nonNull(stringArg()),
        deviceToken: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      async resolve(parent, { deviceToken, email, password }, context, info) {
        const auth = await context.prisma.auth.findFirst({
          where: {
            email,
            password,
          },
          include: {
            user: {},
          },
        });

        if (!auth) {
          throw new Error("No such user found");
        } else {
          const user = auth.user!;
          await setString(`user:${user.id}:deviceToken`, deviceToken);
          return getTokenAndUser(user!);
        }
      },
    });
    t.field("OAuthLogin", {
      type: "AuthPayload",
      args: {
        email: nonNull(stringArg()),
        deviceToken: nonNull(stringArg()),
        nickName: stringArg(),
        type: stringArg(),
      },
      async resolve(
        parent,
        { email, nickName, type, deviceToken },
        context,
        info
      ) {
        let user;
        const parsedEmail = `${email}:${type}`;
        const auth = await context.prisma.auth.findUnique({
          where: {
            email: parsedEmail,
          },
          include: {
            user: {},
          },
        });
        if (!auth) {
          user = await context.prisma.user.create({
            data: {
              ...getCreateDateFormat(),
              email: parsedEmail,
              nickName,
              auth: {
                create: {
                  ...getCreateDateFormat(),
                  email: parsedEmail,
                  nickName,
                },
              },
              accountCash: {
                create: {},
              },
            },
          });
          return getTokenAndUser(user);
        }
        user = auth.user!;
        await setString(`user:${user.id}:deviceToken`, deviceToken);
        return getTokenAndUser(user);
      },
    });
    t.field("signOut", {
      type: "Boolean",
      async resolve(parent, args, context, info) {
        if (!context.userId) throw new Error("user not found");
        await deleteString(`user:${context.userId}:deviceToken`);
        return true;
      },
    });
    t.field("createPincode", {
      type: "String",
      args: {
        pincode: nonNull(stringArg()),
        imp_uid: nonNull(stringArg()),
        phoneNumber: nonNull(stringArg()),
      },
      async resolve(parent, { pincode, imp_uid, phoneNumber }, context, info) {
        const { userId } = context;
        signinCheck(userId);
        if (!imp_uid) throw new Error("imp_uid not found");
        const userInfo = await getUserInfo(imp_uid);
        let { birthday, gender, name, unique_key } = <userInfo>userInfo;
        const id = await context.prisma.iDVerification.findFirst({
          where: { certificationCode: unique_key },
        });
        if (id) throw new Error("id already exist");
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        expirationDate.setDate(expirationDate.getDate() - 1);
        await context.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            auth: {
              update: {
                isVerified: true,
                IDVerification: {
                  create: {
                    expiration: expirationDate,
                    birthDay: new Date(birthday),
                    certificationCode: unique_key,
                    name,
                    phoneNumber,
                    gender: parseGenderToInt(birthday, gender),
                  },
                },
                pincode,
              },
            },
          },
        });

        return "success";
      },
    });
    t.field("updatePincode", {
      type: "String",
      args: {
        followingPincode: nonNull(stringArg()),
      },
      async resolve(parent, { followingPincode }, context, info) {
        const authId = await getAuthIdByuserId(context);
        await context.prisma.auth.update({
          where: {
            id: authId,
          },
          data: {
            pincode: followingPincode,
          },
        });

        return "pincode has been changed successfully";
      },
    });
    t.field("checkEmail", {
      type: "Boolean",
      args: {
        email: nonNull(stringArg()),
      },
      async resolve(parent, { email }, context, info) {
        const isExist = await context.prisma.auth.findFirst({
          where: { email },
        });
        return !!isExist;
      },
    });
    t.field("emailVerification", {
      type: "Boolean",
      args: {
        email: nonNull(stringArg()),
        verificationCode: nonNull(stringArg()),
      },
      async resolve(parent, { email, verificationCode }, context, info) {
        try {
          send_gmail({ email, verificationCode });
          return true;
        } catch (error) {
          console.log(error);
          return false;
        }
      },
    });
    t.field("updatePassword", {
      type: "Boolean",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      async resolve(parent, { email, password }, context, info) {
        await context.prisma.auth.update({
          where: { email },
          data: { password },
        });
        return true;
      },
    });
  },
});
