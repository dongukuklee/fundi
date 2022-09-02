import { extendType, nonNull, objectType, stringArg } from "nexus";

export const Alarm = objectType({
  name: "Alarm",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("title");
    t.nonNull.string("content");
    t.nonNull.dateTime("sentTime");
    t.nonNull.field("type", {
      type: "AlarmTypes",
    });
    t.nonNull.boolean("isConfirm");
    t.nonNull.boolean("isVisible");
  },
});

// export const AlarmMutation = extendType({
//     type:"Mutation",
//     definition(t) {
//         t.field('createAlarm',{
//             type:"Alarm",
//             args:{
//                 title:nonNull(stringArg()),
//                 content:nonNull(stringArg()),
//             }
//         })
//     },
// })
