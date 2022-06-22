import { arg, enumType, extendType, intArg, nonNull, objectType } from "nexus";
import { NexusGenObjects } from "../../nexus-typegen";
import { Role } from "./Role";

export const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.string("name");
    t.nonNull.field("role", {
      type: "Role",
    });
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
  },
});

let usersInMemory: NexusGenObjects["User"][] = [
  {
    id: 1,
    name: "기름왕",
    role: "INVESTOR",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: "철강왕",
    role: "INVESTOR",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    name: "금융왕",
    role: "MANAGER",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const UserQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.list.nonNull.field("users", {
      type: "User",
      resolve(parent, args, context, info) {
        return usersInMemory;
      },
    }),
      t.nonNull.field("user", {
        type: "User",
        args: {
          id: nonNull(intArg()),
        },
        resolve: async (parent, { id }, { prisma }, info) => {
          const user = <NexusGenObjects["User"]>(
            usersInMemory.find((el) => el.id === id)
          );
          return user;
        },
      });
  },
});
