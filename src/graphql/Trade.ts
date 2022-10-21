import { arg, extendType, intArg, nonNull, objectType } from "nexus";
import { signinCheck } from "../../utils/getUserInfo";
import { listRightPush } from "../../utils/redis/ctrl";

export const Trade = objectType({
  name: "Trade",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.bigInt("price");
  },
});

export const TradeQuery = extendType({
  type: "Query",
  definition(t) {
    t.list.field("getTradeList", {
      type: "Boolean",
      async resolve(parent, args, context, info) {
        const trade = await context.prisma.trade.groupBy({
          by: ["price"],
          _count: true,
        });
        console.log(trade);
        return [true];
      },
    });
  },
});

export const TradeMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createTrade", {
      type: "Boolean",
      args: {
        fundingId: nonNull(intArg()),
        quantity: nonNull(intArg()),
        price: nonNull(intArg()),
        types: arg({ type: "TradeType" }),
        status: arg({ type: "TradeStatus" }),
      },
      async resolve(
        parent,
        { types, status, fundingId, price, quantity },
        context,
        info
      ) {
        // const { userId } = context;
        // signinCheck(userId);
        const userId = 3;
        const redisListKey = `funding:${fundingId}:price:${price}`;

        for (let i = 0; i < quantity; i++) {
          const newTrade = await context.prisma.trade.create({
            data: {
              price,
              fundingId,
              userId: userId!,
              type: types!,
              status: status!,
            },
          });

          await listRightPush(redisListKey, newTrade.id);
        }
        return true;
      },
    });
  },
});
