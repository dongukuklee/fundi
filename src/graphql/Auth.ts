import { extendType, nonNull, objectType, stringArg } from "nexus";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { send_gmail } from "../utils/auth";
import { getString, setString } from "../utils/redis/ctrl";

const APP_SECRET = process.env.APP_SECRET!;

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
    t.nonNull.field("emailCheck", {
      type: Auth,
      args: {
        email: nonNull(stringArg()),
      },
      resolve: async (parent, { email }, { prisma }) => {
        const auth = await getAuthByEmail(prisma, email);
        if (!auth) {
          throw new Error("email already exists");
        }
        return auth;
      },
    });
    t.nonNull.field("verificationCode", {
      type: "Boolean",
      args: {
        email: nonNull(stringArg()),
        verificationCode: nonNull(stringArg()),
      },
      resolve: async (parent, { email, verificationCode }, { prisma }) =>
        (await getString(email)) === verificationCode,
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
      type: "String",
      args: {
        email: nonNull(stringArg()),
      },
      async resolve(parent, { email }, context, info) {
        const verificationCode = String(Math.floor(Math.random() * 1000000));
        try {
          send_gmail({ email, verificationCode });
        } catch (error) {
          console.log(error);
        }
        await setString(email, verificationCode, 300);
        return "email sent successfully";
      },
    });
  },
});
