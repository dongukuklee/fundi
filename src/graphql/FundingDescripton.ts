import { objectType } from "nexus";

export const FundingDescripton = objectType({
  name: "FundingDescripton",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.string("title");
    t.nonNull.string("content");
  },
});
