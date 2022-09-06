import { inputObjectType } from "nexus";

export const FundingInput = inputObjectType({
  name: "FundingInput",
  definition(t) {
    t.nonNull.field("status", {
      type: "FundingStatus",
      default: "PRE_CAMPAIGN",
    });
    t.nonNull.string("title");
    t.string("intro");
    t.nonNull.boolean("isVisible");
    t.nonNull.string("startDate");
    t.nonNull.string("endDate");
  },
});
