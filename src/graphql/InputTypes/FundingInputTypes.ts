import { inputObjectType } from "nexus";

export const FundingInput = inputObjectType({
  name: "FundingInput",
  definition(t) {
    t.nonNull.field("status", {
      type: "FundingStatus",
      default: "CAMPAIGNING",
    });
    t.nonNull.string("title");
    t.list.nonNull.field("description", {
      type: "FundingDescriptionInputTypes",
    });
    t.nonNull.boolean("isVisible");
    t.nonNull.string("startDate");
    t.nonNull.string("endDate");
  },
});
