import { objectType } from "nexus";

export const FundingSettlement = objectType({
  name: "FundingSettlement",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.int("round");
    t.nonNull.bigInt("monthlySettlementAmount");
  },
});
