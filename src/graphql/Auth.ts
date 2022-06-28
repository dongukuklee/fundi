import { objectType } from "nexus";
import { User } from "./User";

export const Auth = objectType({
  name: "Auth",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.string("email");
    t.nonNull.string("password");
    t.nonNull.string("name");
    t.nonNull.field("user", { type: User });
    t.nonNull.int("userId");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
  },
});
