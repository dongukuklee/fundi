import { extendType, nonNull, objectType, stringArg } from "nexus";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

const APP_SECRET = process.env.APP_SECRET!;

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

export const AuthMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("signup", {
      type: "AuthPayload",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
        name: nonNull(stringArg()),
      },
      async resolve(parent, args, context, info) {
        const { email, name } = args;
        const password = await bcrypt.hash(args.password, 10);
        const user = await context.prisma.user.create({
          data: {
            name,
            email,
            auth: {
              create: {
                name,
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
          { userId: user.id, userName: user.name, userRole: user.role },
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
            userName: auth.user?.name,
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
  },
});
