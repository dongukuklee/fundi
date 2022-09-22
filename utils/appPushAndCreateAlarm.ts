import { AlarmTypes } from "@prisma/client";
import { Context } from "../src/context";
import { sendMessageToDevice } from "./appPushMessage";

type CreateAlarmData = {
  title: string;
  content: string;
  sentTime: Date;
  type: AlarmTypes;
};

export const AppPushAndCreateAlarm = async (
  token: string,
  createAlarmData: CreateAlarmData,
  context?: Context
) => {
  await sendMessageToDevice(
    token,
    createAlarmData.title,
    createAlarmData.content
  );
  console.log(context);
  if (!!context?.userId)
    await context.prisma.alarm.create({
      data: {
        ...createAlarmData,
        user: {
          connect: {
            id: context.userId,
          },
        },
      },
    });
};
