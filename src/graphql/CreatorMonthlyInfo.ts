import { extendType, intArg, nonNull, objectType } from "nexus";

export const CreatorMonthlyInfo = objectType({
  name: "CreatorMonthlyInfo",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.dateTime("month");
    t.nonNull.bigInt("subscriber");
    t.nonNull.bigInt("income");
    t.nonNull.bigInt("views");
  },
});

type creatorMonthlyInfoVariables = {
  month?: string | null;
  subscriber?: bigint;
  income?: bigint;
  views?: bigint;
};

type createVariableType = {
  month: Date;
  subscriber: bigint;
  income: bigint;
  views: bigint;
};
const makeCreateVariables = (data: creatorMonthlyInfoVariables) => {
  const { income, month, subscriber, views } = data;
  const variables = <createVariableType>{};

  if (income) variables.income = income;
  if (month) variables.month = new Date(month);
  if (subscriber) variables.subscriber = subscriber;
  if (views) variables.views = views;
  return variables;
};

export const CreatorMonthlyInfoQuery = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createCreatorMonthlyInfos", {
      type: "CreatorMonthlyInfo",
      args: {
        creatorMonthlyInfoInput: nonNull("CreatorMonthlyInfoInpuTypes"),
        creatorId: nonNull(intArg()),
      },
      async resolve(
        parent,
        { creatorMonthlyInfoInput, creatorId },
        context,
        info
      ) {
        const data = makeCreateVariables(creatorMonthlyInfoInput);
        return await context.prisma.creatorMonthlyInfo.create({
          data: {
            ...data,
            creator: {
              connect: {
                id: creatorId,
              },
            },
          },
        });
      },
    });
    t.field("updateCreatorMonthlyInfo", {
      type: "CreatorMonthlyInfo",
      args: {
        id: nonNull(intArg()),
        creatorMonthlyInfoInput: nonNull("CreatorMonthlyInfoInpuTypes"),
      },
      async resolve(
        parent,
        { creatorMonthlyInfoInput: data, id },
        context,
        info
      ) {
        let month;
        if (data.month) month = new Date(data.month);
        return context.prisma.creatorMonthlyInfo.update({
          where: { id },
          data: {
            ...data,
            month,
          },
        });
      },
    });
  },
});
