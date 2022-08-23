import { inputObjectType, objectType } from "nexus";

export const CreatorInvestmentPoint = inputObjectType({
  name: "CreatorInvestmentPoint",
  definition(t) {
    t.nonNull.string("title"), t.nonNull.string("status");
  },
});
