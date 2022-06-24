import { Role } from "@prisma/client";
import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import { NexusGenObjects } from "../../nexus-typegen";

export const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.string("name");
    t.nonNull.field("role", {
      type: "Role",
    });
    t.list.int("accountFunding");
    t.list.int("accountCash");
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
        return await prisma.user.findMany();
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
      },
      async resolve(
        parent,
        { name, role },
        { prisma },
        info
      ): Promise<UserType> {
        const convertedRole: Role = <Role>role;
        return <UserType>await prisma.user.create({
          data: {
            name,
            role: convertedRole,
          },
        });
      },
    });
  },
});
