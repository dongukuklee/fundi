import { TradeType } from "@prisma/client";
import { arg, extendType, intArg, nonNull, objectType } from "nexus";
import { each, filter, map, reduce, where } from "underscore";
import { getUserAccountCash, signinCheck } from "../../utils/getUserInfo";
import {
  listLeftPop,
  listLength,
  listRightPush,
  zAdd,
  zSetRange,
} from "../../utils/redis/ctrl";
import { Context } from "../context";

const getTradingList = async (
  fundingId: number,
  types: TradeType,
  isSort: Boolean
) => {
  const marketFundingListKey = `funding:${fundingId}:${types}`;
  let list = await getTradingPriceList(marketFundingListKey, isSort);

  const tradingList = await Promise.all(
    map(list, async (price) => {
      return {
        price: Number(price),
        quantity: await listLength(`funding:${fundingId}:${price}:${types}`),
      };
    })
  );
  return tradingList;
};

/**
 * @param redidListKey
 * zSet Key 가 들어간다.
 * @param isSort
 * true일때 asc 정렬, false일때 desc 정렬
 */
const getTradingPriceList = async (redidListKey: string, isSort: Boolean) => {
  let list;
  if (isSort) {
    //asc
    list = await zSetRange(redidListKey, false);
  } else {
    //desc
    list = await zSetRange(redidListKey, true);
  }

  return list;
};

const checkMarketList = async (
  fundingId: number,
  price: number,
  quantity: number,
  types: TradeType,
  context: Context
) => {
  if (!types) throw new Error("types not found");
  const contraryTypes: TradeType = types === "BUY" ? "SELL" : "BUY";
  const list = await getTradingList(fundingId, contraryTypes, true);
  if (types === "BUY") {
    //SELL 의 리스트를 확인한다.
    //리스트 중 구매하려는 금액보다 낮은 물품이 있는지 확인한다.
    //금액이 작은 순서대로 수량 * 금액 해서 맞춘다.
    //수량을 우선으로 체크
    const filteredList = filter(list, (el) => el.price <= price);
    const soldList: number[] = [];
    let quantityCount = 0;
    let amount = 0;
    for (let i = 0; i < filteredList.length; i++) {
      if (quantityCount === quantity) break;
      const { price, quantity: saleQuantity } = filteredList[i];
      const redisListKey = `funding:${fundingId}:${price}:${contraryTypes}`;
      const popList = async (quantity: number) => {
        for (let j = 0; j < quantity; j++) {
          const pop = await listLeftPop(redisListKey);
          if (!pop) return j;

          soldList.push(Number(pop));
        }
        return quantity;
      };
      if (quantityCount + saleQuantity < quantity) {
        const count = await popList(saleQuantity);
        amount = price * count;
        quantityCount = quantityCount + count;
      } else {
        const tmp = quantity - quantityCount;
        const count = await popList(tmp);
        quantityCount = quantityCount + count;
        amount = price * count;
      }
    }

    await context.prisma.trade.updateMany({
      where: { id: { in: soldList } },
      data: { status: "SOLD" },
    });
    return quantity - soldList.length;
  } else if (types === "SELL") {
  }
};

export const Trade = objectType({
  name: "Trade",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.bigInt("price");
  },
});

export const TradeList = objectType({
  name: "TradeList",
  definition(t) {
    t.nonNull.int("price");
    t.nonNull.int("quantity");
  },
});

export const TradeQuery = extendType({
  type: "Query",
  definition(t) {
    t.list.field("getTradeList", {
      type: "TradeList",
      args: {
        fundingId: nonNull(intArg()),
        types: arg({ type: "TradeType" }),
      },
      async resolve(parent, { fundingId, types }, context, info) {
        const isSort = types === "BUY" ? true : false;
        return await getTradingList(fundingId, types!, isSort);
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
      },
      async resolve(
        parent,
        { types, fundingId, price, quantity },
        context,
        info
      ) {
        // const { userId } = context;
        const userId = 3;
        const userAccountCash = await getUserAccountCash(context);
        if (types === "BUY" && price * quantity < userAccountCash.balance) {
          throw new Error("Your account does not have sufficient balance.");
        }

        const redisListKey = `funding:${fundingId}:${price}:${types}`;
        const marketFundingListKey = `funding:${fundingId}:${types}`;
        zAdd(marketFundingListKey, 0, `${price}`);
        for (let i = 0; i < quantity; i++) {
          const newTrade = await context.prisma.trade.create({
            data: {
              price,
              fundingId,
              userId: userId!,
              type: types!,
            },
          });

          await listRightPush(redisListKey, newTrade.id);
        }
        return true;
      },
    });
  },
});
