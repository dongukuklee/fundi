import { inputObjectType } from "nexus";

export const FundingDescriptionInputTypes = inputObjectType({
  name: "FundingDescriptionInputTypes",
  definition(t) {
    t.nonNull.string("title");
    t.nonNull.string("content");
  },
});
