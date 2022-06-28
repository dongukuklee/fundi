import { objectType } from "nexus";
import { Funding } from "./Funding";
import { User } from "./User";

export const AccountFunding = objectType({
  name: "AccountFunding",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.field("owner", { type: User });
    t.nonNull.int("ownerId");
    t.nonNull.int("balance");
    t.nonNull.field("funding", { type: Funding });
    t.nonNull.int("fundingId");
    //t.nonNull.field("tradesSent",{type:Trade})
    //t.nonNull.field("tradesRcvd",{type:Trade})
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
  },
});
