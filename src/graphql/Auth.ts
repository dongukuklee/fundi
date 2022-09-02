import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import * as jwt from "jsonwebtoken";
import { getString, setString } from "../../utils/redis/ctrl";
import { Context } from "../context";
import { User } from "@prisma/client";

const APP_SECRET = process.env.APP_SECRET!;

const getTokenAndUser = (user: User) => {
  const token = jwt.sign(
    { userId: user.id, userRole: user.role, userName: user.name },
    APP_SECRET
  );
  return { token, user };
};
const getAuthIdByuserId = async (context: Context) => {
  const user = await context.prisma.user.findUnique({
    select: {
      authId: true,
    },
    where: {
      id: context.userId,
    },
  });

  return user?.authId;
};

export const Auth = objectType({
  name: "Auth",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("email");
    t.string("name");
    t.string("pincode");
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
        if (!userId) {
          throw new Error(
            "Cannot inquiry the transactions of the account without signing in."
          );
        }
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
        nickName: stringArg(),
      },
      async resolve(parent, args, context, info) {
        const { email, nickName } = args;
        const user = await context.prisma.user.create({
          data: {
            email,
            auth: {
              create: {
                email,
                name: nickName,
              },
            },
            accountCash: {
              create: {},
            },
          },
        });

        const token = jwt.sign(
          { userId: user.id, userRole: user.role },
          APP_SECRET
        );
        return { token, user };
      },
    });
    t.nonNull.field("signin", {
      type: "AuthPayload",
      args: {
        email: nonNull(stringArg()),
      },
      async resolve(parent, args, context, info) {
        let token;
        const auth = await context.prisma.auth.findUnique({
          where: {
            email: args.email,
          },
          include: {
            user: {},
          },
        });

        if (!auth) {
          throw new Error("No such user found");
        } else {
          token = jwt.sign(
            {
              userId: auth.user?.id,
              userRole: auth.user?.role,
            },
            APP_SECRET
          );
        }

        return {
          token,
          user: auth.user!,
        };
      },
    });
    t.field("OAuthLogin", {
      type: "AuthPayload",
      args: {
        email: nonNull(stringArg()),
        nickName: stringArg(),
        type: stringArg(),
      },
      async resolve(parent, { email, nickName, type }, context, info) {
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
              email: parsedEmail,
              name: nickName,
              auth: {
                create: {
                  email: parsedEmail,
                  name: nickName,
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
        return getTokenAndUser(user);
      },
    });
    t.field("createPincode", {
      type: "String",
      args: {
        pincode: nonNull(stringArg()),
      },
      async resolve(parent, { pincode }, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error(
            "Cannot inquiry the transactions of the account without signing in."
          );
        }
        await context.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            auth: {
              update: {
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
        const { userId } = context;
        if (!userId) {
          throw new Error(
            "Cannot inquiry the transactions of the account without signing in."
          );
        }
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
    t.field("registerWithdrawalAccount", {
      type: "Auth",
      args: {
        bankCode: nonNull(intArg()),
        accountNumber: nonNull(stringArg()),
      },
      async resolve(parent, { bankCode, accountNumber }, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error(
            "Cannot register withdrawal account without signing in."
          );
        }
        const auth = await context.prisma.auth.findFirst({
          where: { user: { id: userId } },
        });
        if (!auth) {
          throw new Error("No such user found");
        }

        return await context.prisma.auth.update({
          where: {
            id: auth.id,
          },
          data: {
            withdrawalAccount: {
              create: {
                bankCode,
                accountNumber,
              },
            },
          },
        });
      },
    });
    t.field("IDVerification", {
      type: "Auth",
      args: {
        phoneNumber: nonNull(stringArg()),
      },
      async resolve(parent, { phoneNumber }, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error(
            "Cannot identity verification account without signing in."
          );
        }
        const auth = await context.prisma.auth.findFirst({
          where: { user: { id: userId } },
        });
        if (!auth) {
          throw new Error("No such user found");
        }

        return await context.prisma.auth.update({
          where: {
            id: auth.id,
          },
          data: {
            IDVerification: {
              create: {
                phoneNumber,
              },
            },
          },
        });
      },
    });
  },
});
