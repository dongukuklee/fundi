import { objectType } from "nexus";

export const IDVerification = objectType({
  name: "IDVerification",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.string("phoneNumber");
  },
});
