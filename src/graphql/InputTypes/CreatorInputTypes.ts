import { inputObjectType } from "nexus";

export const CreatorInput = inputObjectType({
  name: "CreatorInput",
  definition(t) {
    t.string("name");
    t.int("birthYear");
    t.string("channelTitle");
    t.string("channelUrl");
    t.boolean("isVisible");
    t.string("description");
  },
});
