import { AlarmTypes } from "@prisma/client";
import { booleanArg, extendType, intArg, nonNull, objectType } from "nexus";
import { signinCheck } from "../../utils/getUserInfo";
import { sortOptionCreator } from "../../utils/sortOptionCreator";
import { TAKE } from "../common/const";

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

export const AlarmQuery = extendType({
  type: "Query",
  definition(t) {
    t.list.field("alarms", {
      type: "Alarm",
      args: {
        skip: intArg(),
        take: intArg(),
      },
      async resolve(parent, args, context, info) {
        if (!context.userId) throw new Error("user not found");
        return await context.prisma.alarm.findMany({
          skip: args?.skip as number | undefined,
          take: args?.take ? args.take : TAKE,
          orderBy: {
            createdAt: "desc",
          },
          where: {
            userId: context.userId,
          },
          //where: { isVisible: true },
        });
      },
    });
    t.field("alarmCount", {
      type: "Int",
      async resolve(parent, args, context, info) {
        const { userId } = context;
        signinCheck(userId);
        return await context.prisma.alarm.count({
          where: {
            isConfirm: false,
            userId: userId,
          },
        });
      },
    });
  },
});

export const AlarmMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("checkAlarm", {
      type: "Boolean",
      async resolve(parent, args, context, info) {
        if (!context.userId) throw new Error("user not found");
        //const data = makeUpdateAlarmVariables(updateData);
        try {
          await context.prisma.alarm.updateMany({
            where: { userId: context.userId },
            data: {
              isConfirm: true,
            },
          });
          return true;
        } catch (error) {
          console.log(error);
          return false;
        }
      },
    });
  },
});
