import { AlarmTypes } from "@prisma/client";
import { Context } from "../src/context";
import { sendMessageToDevice } from "./AppPushMessage";
import { deleteString, getSet, getString } from "./redis/ctrl";

type CreateAlarmData = {
  title: string;
  content: string;
  sentTime: Date;
  type: AlarmTypes;
};

export const AppPushAndCreateAlarm = async (
  createAlarmData: CreateAlarmData,
  id: number,
  context: Context
) => {
  const token = await getString(`user:${id}:deviceToken`);
  await context.prisma.alarm.create({
    data: {
      ...createAlarmData,
      user: {
        connect: {
          id,
        },
      },
    },
  });
  if (token) {
    try {
      await sendMessageToDevice(
        token,
        createAlarmData.title,
        createAlarmData.content
      );
    } catch (error) {
      await deleteString(`user:${id}:deviceToken`);
    }
  }
};
