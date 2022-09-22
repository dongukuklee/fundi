import { objectType } from "nexus";

export const FundingDescripton = objectType({
  name: "FundingDescripton",
  definition(t) {
    t.int("id");
    t.nonNull.string("title");
    t.nonNull.string("content");
  },
});
