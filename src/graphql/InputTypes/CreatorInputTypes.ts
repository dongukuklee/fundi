import { inputObjectType } from "nexus";

export const CreatorInput = inputObjectType({
  name: "CreatorInput",
  definition(t) {
    t.nonNull.string("name");
    t.nonNull.int("birthYear");
    t.nonNull.string("channelTitle");
    t.nonNull.string("channelUrl");
    t.nonNull.boolean("isVisible");
  },
});
