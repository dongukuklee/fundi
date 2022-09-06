import { AlarmTypes } from "@prisma/client";
import { booleanArg, extendType, intArg, nonNull, objectType } from "nexus";

type UpdateAlarmDataType = {
  title?: string | null;
  content?: string | null;
  isConfirm?: boolean | null;
  isVisible?: boolean | null;
  type?: AlarmTypes | null;
};

type ToReturnUpdateAlarmDataType = {
  title?: string;
  content?: string;
  isConfirm?: boolean;
  isVisible?: boolean;
  type?: AlarmTypes;
};

const makeUpdateAlarmVariables = (updateAlarm: UpdateAlarmDataType) => {
  const { content, isConfirm, isVisible, title, type } = updateAlarm;
  const variables: ToReturnUpdateAlarmDataType = {};
  if (content) variables.content = content;
  if (isConfirm) variables.isConfirm = isConfirm;
  if (isVisible) variables.isVisible = isVisible;
  if (title) variables.title = title;
  if (type) variables.type = type;

  return variables;
};

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

export const AlarmMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("checkAlaram", {
      type: "Alarm",
      args: {
        id: nonNull(intArg()),
        isConfirm: booleanArg(),
        isVisible: booleanArg(),
        updateData: "AlarmInputData",
      },
      resolve(parent, { id, updateData }, context, info) {
        if (!updateData) throw new Error("updateData is not defined");
        const data = makeUpdateAlarmVariables(updateData);
        return context.prisma.alarm.update({
          where: { id },
          data,
        });
      },
    });
  },
});
