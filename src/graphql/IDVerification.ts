import { objectType } from "nexus";

export const IDVerification = objectType({
  name: "IDVerification",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.dateTime("expiration");
    t.nonNull.dateTime("birthDay");
    t.nonNull.int("gender");
    t.nonNull.string("name");
    t.nonNull.string("phoneNumber");
    t.nonNull.string("certificationCode");
  },
});
