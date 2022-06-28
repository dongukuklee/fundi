import { Role } from "@prisma/client";
import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import { NexusGenObjects } from "../../nexus-typegen";
import { AccountCash } from "./AccountCash";
import { AccountFunding } from "./AccountFunding";
import { Auth } from "./Auth";

export const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.field("role", { type: "Role" });
    t.nonNull.field("auth", { type: Auth });
    t.list.field("accountFunding", { type: AccountFunding });
    t.nonNull.field("accountCash", { type: AccountCash });
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
  },
});

type UserType = NexusGenObjects["User"];
type UserArrType = NexusGenObjects["User"][];

export const UserQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.list.nonNull.field("users", {
      type: "User",
      async resolve(parent, args, { prisma }, info): Promise<UserArrType> {
        const users = <UserArrType>await prisma.user.findMany();
        console.log(users);
        return users;
      },
    }),
      t.nonNull.field("user", {
        type: "User",
        args: {
          id: nonNull(intArg()),
        },
        resolve: async (
          parent,
          { id },
          { prisma },
          info
        ): Promise<UserType> => {
          const user = await prisma.user.findUnique({
            where: {
              id,
            },
          });

          return <UserType>user;
        },
      });
  },
});

export const UserMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createUser", {
      type: "User",
      args: {
        name: nonNull(stringArg()),
        role: nonNull(stringArg()),
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      async resolve(
        parent,
        { name, role, email, password },
        { prisma },
        info
      ): Promise<UserType> {
        const convertedRole: Role = <Role>role;
        const user = await prisma.user.create({
          data: { role: convertedRole },
        });
        await prisma.auth.create({
          data: {
            email,
            password,
            name,
            userId: user.id,
          },
        });
        const userResult: UserType = <UserType>{
          id: user.id,
          auth: await prisma.auth.findUnique({
            where: {
              userId: user.id,
            },
          }),
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
        return userResult;
      },
    });
  },
});
