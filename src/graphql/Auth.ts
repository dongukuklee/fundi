import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { send_gmail } from "../utils/auth";
import { getString, setString } from "../utils/redis/ctrl";
import { Context } from "../context";

const APP_SECRET = process.env.APP_SECRET!;

const isEmailExist = async (email: string, context: Context) => {
  const auth = await getAuthByEmail(context.prisma, email);
  if (auth) {
    return true;
  }
  return false;
};

const getAuthIdByUserId = async (context: Context) => {
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

const getAuthByEmail = async (prisma: any, email: string) => {
  {
    return await prisma.auth.findUnique({
      where: {
        email,
      },
    });
  }
};

export const Auth = objectType({
  name: "Auth",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.field("user", {
      type: "User",
      resolve(parent, args, context, info) {
        return context.prisma.auth
          .findUnique({ where: { id: parent.id } })
          .user();
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
        const authId = await getAuthIdByUserId(context);
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
      },
      async resolve(parent, args, context, info) {
        const { email } = args;
        const password = await bcrypt.hash(args.password, 10);
        const user = await context.prisma.user.create({
          data: {
            email,
            auth: {
              create: {
                email,
                password,
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
        password: nonNull(stringArg()),
      },
      async resolve(parent, args, context, info) {
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
        }
        const valid = await bcrypt.compare(args.password, auth.password);
        if (!valid) {
          throw new Error("Invalid password");
        }
        const token = jwt.sign(
          {
            userId: auth.user?.id,
            userRole: auth.user?.role,
          },
          APP_SECRET
        );
        return {
          token,
          user: auth.user!,
        };
      },
    });
    t.field("emailAuthentication", {
      type: "Boolean",
      args: {
        email: nonNull(stringArg()),
      },
      async resolve(parent, { email }, context, info) {
        const EmailExist = await isEmailExist(email, context);
        if (EmailExist) {
          return false;
        }
        const verificationCode = String(Math.floor(Math.random() * 1000000));
        try {
          send_gmail({ email, verificationCode });
        } catch (error) {
          console.log(error);
          throw new Error("sending email failed");
        }
        await setString(email, verificationCode, 300);
        return true;
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
        previousPincode: nonNull(stringArg()),
        followingPincode: nonNull(stringArg()),
      },
      async resolve(
        parent,
        { previousPincode, followingPincode },
        context,
        info
      ) {
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
              update: {},
            },
          },
        });
        const authId = await getAuthIdByUserId(context);
        const pincodeValidation = await context.prisma.auth.findFirst({
          where: {
            AND: {
              id: authId,
              pincode: previousPincode,
            },
          },
        });

        if (!pincodeValidation) {
          throw new Error("pincode does not matching");
        }

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
  },
});
