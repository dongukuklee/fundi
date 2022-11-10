import { TradeType } from "@prisma/client";
import { arg, extendType, intArg, nonNull, objectType } from "nexus";
import { each, filter, map, reduce, where } from "underscore";
import { getCreateDateFormat } from "../../utils/Date";
import {
  getUserAccountCash,
  getUserAccoutBond,
  signinCheck,
} from "../../utils/getUserInfo";
import {
  getList,
  listLeftPop,
  listLength,
  listRightPush,
  zAdd,
  zRem,
  zSetRange,
} from "../../utils/redis/ctrl";
import { Context } from "../context";

const tradeTypeCheck = (types: TradeType) => {
  return types === "BUY";
};

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

  const filterIteratorCondition = (
    isBuyType: boolean,
    el: { price: number; quantity: number },
    price: number
  ) => {
    return isBuyType ? el.price <= price : el.price >= price;
  };
  //const keyToDelete: { key: string; price: string }[] = [];
  const tradeTransaction: any[] = [];
  const tradeList: number[] = [];
  const tradeListForRedis: { key: string; quantity: number; price: number }[] =
    [];
  const contraryTypes: TradeType = tradeTypeCheck(types) ? "SELL" : "BUY";
  const list = await getTradingList(
    fundingId,
    contraryTypes,
    tradeTypeCheck(types)
  );
  let quantityCount = 0;
  let amount = 0;
  if (tradeTypeCheck(types)) {
    //SELL 의 리스트를 확인한다.
    //리스트 중 구매하려는 금액보다 낮은 물품이 있는지 확인한다.
    //금액이 작은 순서대로 수량 * 금액 해서 맞춘다.
    //수량을 우선으로 체크
    const filteredList = filter(list, (el) => el.price <= price);
    for (let i = 0; i < filteredList.length; i++) {
      let count;
      if (quantityCount === quantity) break;
      const { price, quantity: saleQuantity } = filteredList[i];
      const redisListKey = `funding:${fundingId}:${price}:${contraryTypes}`;
      const popList = async (quantity: number) => {
        for (let j = 0; j < quantity; j++) {
          const val = await getList(redisListKey, j, j);
          if (!val[0]) return j;

          tradeList.push(Number(val[0]));
        }
        return quantity;
      };
      if (quantityCount + saleQuantity < quantity) {
        count = await popList(saleQuantity);
      } else {
        const tmp = quantity - quantityCount;
        count = await popList(tmp);
      }
      amount = price * count;
      quantityCount = quantityCount + count;
      tradeListForRedis.push({ key: redisListKey, quantity: count, price });
    }
  } else {
    const filteredList = filter(list, (el) => el.price >= price);
    for (let i = 0; i < filteredList.length; i++) {
      let count;
      if (quantityCount === quantity) break;
      const { price, quantity: saleQuantity } = filteredList[i];
      const redisListKey = `funding:${fundingId}:${price}:${contraryTypes}`;
      const popList = async (quantity: number) => {
        for (let j = 0; j < quantity; j++) {
          const val = await getList(redisListKey, j, j);
          if (!val[0]) return j;

          tradeList.push(Number(val[0]));
        }
        return quantity;
      };
      if (quantityCount + saleQuantity < quantity) {
        count = await popList(saleQuantity);
      } else {
        const tmp = quantity - quantityCount;
        count = await popList(tmp);
      }
      amount = price * count;
      quantityCount = quantityCount + count;
      tradeListForRedis.push({ key: redisListKey, quantity: count, price });
    }
  }
  if (tradeList.length) {
    const updateTrade = context.prisma.trade.updateMany({
      where: { id: { in: tradeList } },
      data: { status: "SOLD" },
    });

    tradeTransaction.push(updateTrade);
  }
  for (const tradeId of tradeList) {
    const trade = await context.prisma.trade.findUnique({
      where: { id: tradeId },
      select: {
        userId: true,
        price: true,
        type: true,
      },
    });
    const { price, userId, type } = trade!;
    const userAccountBond = await context.prisma.accountBond.findFirst({
      where: { AND: { fundingId, ownerId: userId } },
    });
    if (!userAccountBond) throw new Error("user account bond not found");
    if (type === "BUY") {
      // 거래자의 accountBond + 1

      const updateUserAccountBond = context.prisma.user.update({
        where: { id: userId },
        data: {
          accountsBond: {
            update: {
              where: { id: userAccountBond.id },
              data: { balance: { increment: +1 } },
            },
          },
        },
      });

      tradeTransaction.push(updateUserAccountBond);
      //구매자의 accountBond + 1
      //accountCash.balance - price
    } else if (type === "SELL") {
      //거래자의 accountBond - 1
      //accountCash + price
      const updateUserAccountBond = context.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          accountCash: { update: { balance: { increment: price } } },
          accountsBond: {
            update: {
              where: { id: userAccountBond.id },
              data: { balance: { decrement: -1 } },
            },
          },
        },
      });

      tradeTransaction.push(updateUserAccountBond);
    }
  }

  return {
    quantityCount,
    amount,
    tradeTransaction,
    //keyToDelete,
    tradeListForRedis,
  };
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

export const SortByTradeType = objectType({
  name: "SortByTradeType",
  definition(t) {
    t.list.field("buy", {
      type: "TradeList",
    });
    t.list.field("sell", {
      type: "TradeList",
    });
  },
});

export const TradeQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("getTradeList", {
      type: "SortByTradeType",
      args: {
        fundingId: nonNull(intArg()),
      },
      async resolve(parent, { fundingId }, context, info) {
        return {
          buy: await getTradingList(fundingId, "BUY", true),
          sell: await getTradingList(fundingId, "SELL", false),
        };
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
        const { userId } = context;
        const userAccountCash = await getUserAccountCash(context);
        const userAccountBond = await getUserAccoutBond(context, fundingId);
        const promiseTransaction = [];
        if (!types) throw new Error("types not found");

        if (types === "BUY" && price * quantity > userAccountCash.balance) {
          throw new Error("Your account does not have sufficient balance.");
        }

        try {
          /**
           * 마켓 리스트 조회 후 조건에 맞는 채권이 있으면 판매/구매를 진행함
           * amount : 판매/구매 완료한 총 금액
           * quantityCount: 판매/구매 완료한 수량.
           * tradeTransaction : 판매/구매자의 accountBond or accountCash update transaction
           * keyToDelete 특정 금액 채권의 판매/구매가 완료됐을 시 zSet 에서 삭제할 리스트
           */
          const {
            amount,
            quantityCount,
            tradeTransaction,
            // keyToDelete,
            tradeListForRedis,
          } = await checkMarketList(fundingId, price, quantity, types, context);

          // const a = context.prisma.$transaction(tradeTransaction);
          // promiseTransaction.push(a);
          if (types === "BUY") {
            // accountBond + quantityCount
            // accountCash - amount
            const updateUserCashAndBond = context.prisma.user.update({
              where: { id: userId },
              data: {
                accountCash: {
                  update: {
                    balance: {
                      decrement: amount,
                    },
                  },
                },
                accountsBond: {
                  update: {
                    where: {
                      id: userAccountBond.id,
                    },
                    data: {
                      balance: {
                        increment: quantityCount,
                      },
                    },
                  },
                },
              },
            });
            tradeTransaction.push(updateUserCashAndBond);
          } else if (types === "SELL") {
            // accountBond - quantityCount
            // accountCash + amount
            const updateUserCashAndBond = context.prisma.user.update({
              where: { id: userId },
              data: {
                accountCash: {
                  update: { balance: { increment: amount } },
                },
                accountsBond: {
                  update: {
                    where: {
                      id: userAccountBond.id,
                    },
                    data: {
                      balance: {
                        decrement: quantityCount,
                      },
                    },
                  },
                },
              },
            });
            tradeTransaction.push(updateUserCashAndBond);
          }

          const redisListKey = `funding:${fundingId}:${price}:${types}`;
          const marketFundingListKey = `funding:${fundingId}:${types}`;
          for (const { key, quantity, price } of tradeListForRedis) {
            const listLen = await listLength(key);
            if (listLen === quantity) {
              const zSetKey = `funding:${fundingId}:${
                types === "BUY" ? "SELL" : "BUY"
              }`;

              promiseTransaction.push(zRem(zSetKey, String(price)));
            }
            for (let i = 0; i < quantity; i++) {
              promiseTransaction.push(listLeftPop(key));
            }
          }
          // for (const { key, price } of keyToDelete) {
          //   console.log(4);
          //   promiseTransaction.push(zRem(key, String(price)));
          //   console.log(5);
          // }

          for (let i = 0; i < quantity - quantityCount; i++) {
            const newTrade = await context.prisma.trade.create({
              data: {
                ...getCreateDateFormat(),
                price,
                fundingId,
                userId: userId!,
                type: types!,
              },
            });
            promiseTransaction.push(listRightPush(redisListKey, newTrade.id));
            promiseTransaction.push(zAdd(marketFundingListKey, 0, `${price}`));
          }
          const prismaTransaction =
            context.prisma.$transaction(tradeTransaction);

          promiseTransaction.push(prismaTransaction);
          Promise.allSettled(promiseTransaction).then((result) => {
            result.forEach((re) => console.log(re.status));
          });

          return true;
        } catch (error) {
          console.log(error);
          return false;
        }
      },
    });
    t.field("updateTrade", {
      type: "Boolean",
      async resolve(parent, args, context, info) {
        await context.prisma.trade.updateMany({
          where: { id: { in: [8, 9, 10] } },
          data: { status: "SELLING" },
        });
        return true;
      },
    });
  },
});
