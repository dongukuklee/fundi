import { enumType, extendType, objectType } from "nexus";
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
  },
});

let usersInMemory: NexusGenObjects["User"][] = [
  {
    id: 1,
    name: "기름왕",
    role: "INVESTOR",
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
    });
  },
});
