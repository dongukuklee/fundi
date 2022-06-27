import { objectType } from "nexus";
import { User } from "./User";

export const AccountCash = objectType({
  name: "AccountCash",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("ownerId");
    t.nonNull.field("owner", { type: User });
    t.nonNull.int("balance");
    //t.list.field("transactionsSent", { type: Transaction });
    //t.list.field("transactionsRcvd", { type: Transaction });
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
  },
});
