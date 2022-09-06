import { inputObjectType } from "nexus";

export const AlarmInputData = inputObjectType({
  name: "AlarmInputData",
  definition(t) {
    t.string("title");
    t.string("content");
    t.boolean("isConfirm");
    t.boolean("isVisible");
    t.field("type", { type: "AlarmTypes" });
  },
});
