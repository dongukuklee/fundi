import { inputObjectType } from "nexus";

export const FundingDescriptionInputTypes = inputObjectType({
  name: "FundingDescriptionInputTypes",
  definition(t) {
    t.int("id");
    t.nonNull.string("title");
    t.nonNull.string("content");
  },
});
