import { objectType } from "nexus";

export const Biography = objectType({
  name: "Biography",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.int("year");
    t.nonNull.string("description");
  },
});
