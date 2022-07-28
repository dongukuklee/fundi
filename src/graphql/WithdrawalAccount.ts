import { objectType } from "nexus";

export const WithdrawalAccount = objectType({
  name: "WithdrawalAccount",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.int("bankCode");
    t.nonNull.string("accountNumber");
  },
});
