import { TradeType } from "@prisma/client";
import { arg, extendType, intArg, list, nonNull, objectType } from "nexus";
import { filter, map } from "underscore";
import { getCreateDateFormat } from "../../utils/Date";
import { getUserAccountCash, getUserAccoutBond } from "../../utils/getUserInfo";
import {
  getList,
  listLeftPop,
  listLength,
  listRightPush,
  zAdd,
  zRem,
  zSetRange,
  removeElementFromList,
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
        type: types,
      };
    })
  );

  return filter(tradingList, (el) => {
    const { price, quantity } = el;
    if (quantity === 0) {
      zRem(`funding:${fundingId}:${types}`, String(price));
      return false;
    }
    return true;
  });
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

  const tradeTransaction: any[] = [];
  const tradeList: number[] = [];
  const tradeListForRedis: { key: string; quantity: number; price: number }[] =
    [];
  const userUpdateList: { userId: number; amount: bigint; quantity: number }[] =
    [];
  const contraryTypes: TradeType = tradeTypeCheck(types) ? "SELL" : "BUY";
  const list = await getTradingList(
    fundingId,
    contraryTypes,
    tradeTypeCheck(types)
  );

  /**
   *
   * @param isBuyType
   * trade type이 buy 인지 아닌지 확인한다.
   * @param el
   * 거래되는 금액과 수량을 담고있는 객체이다.
   * @param price
   * 거래 하고자 하는 금액이다.
   * @returns
   * filter함수 내부의 iter함수의 조건문을 반환한다.
   */
  const filterIteratorCondition = (
    isBuyType: boolean,
    el: { price: number; quantity: number },
    price: number
  ) => {
    return isBuyType ? el.price <= price : el.price >= price;
  };

  /** */
  const popList = async (quantity: number, redisListKey: string) => {
    for (let j = 0; j < quantity; j++) {
      const val = await getList(redisListKey, j, j);
      if (!val[0]) return j;
      tradeList.push(Number(val[0]));
    }
    return quantity;
  };
  const filteredList = filter(list, (el) =>
    filterIteratorCondition(tradeTypeCheck(types), el, price)
  );
  let quantityCount = 0;
  let amount = 0;

  for (let i = 0; i < filteredList.length; i++) {
    let count;
    if (quantityCount === quantity) break;
    const { price, quantity: saleQuantity } = filteredList[i];
    const redisListKey = `funding:${fundingId}:${price}:${contraryTypes}`;

    if (quantityCount + saleQuantity < quantity) {
      count = await popList(saleQuantity, redisListKey);
    } else {
      const tmp = quantity - quantityCount;
      count = await popList(tmp, redisListKey);
    }
    amount = price * count;
    quantityCount = quantityCount + count;
    tradeListForRedis.push({ key: redisListKey, quantity: count, price });
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
    const { price, userId } = trade!;
    const idx = userUpdateList.findIndex((el) => el.userId === userId);
    if (idx === -1) {
      userUpdateList.push({ userId, quantity: 1, amount: price });
    } else {
      const updatedUser = userUpdateList[idx];
      updatedUser.amount = updatedUser.amount + price;
      updatedUser.quantity = updatedUser.quantity + 1;
    }
  }

  for (const usersToUpdate of userUpdateList) {
    const { amount, quantity, userId } = usersToUpdate;

    let updateUserAccountBond;
    let userAccountBond;
    const userAccountCash = await context.prisma.accountCash.findUnique({
      where: { ownerId: userId },
    });
    try {
      userAccountBond = await context.prisma.accountBond.findFirst({
        where: { AND: { fundingId, ownerId: userId } },
      });
    } catch (error) {
      userAccountBond = await context.prisma.accountBond.create({
        data: {
          ...getCreateDateFormat(),
          fundingId,
          ownerId: userId,
        },
      });
    }

    if (!userAccountBond) throw new Error("user account bond not found");
    if (!userAccountCash) throw new Error("user account cash not found");

    if (contraryTypes === "BUY") {
      console.log("update user account Bond");
      console.log("userId : ", userId);

      //구매자의 accountBond + 1
      //accountCash.balance - price
      updateUserAccountBond = context.prisma.user.update({
        where: { id: userId },
        data: {
          accountsBond: {
            update: {
              where: { id: userAccountBond.id },
              data: {
                balance: { increment: quantity },
                transactions: {
                  create: {
                    ...getCreateDateFormat(),
                    amount: quantity,
                    title: "구매",
                    type: "DEPOSIT",
                  },
                },
              },
            },
          },
        },
      });

      tradeTransaction.push(updateUserAccountBond);
    } else if (contraryTypes === "SELL") {
      //거래자의 accountBond - 1
      //accountCash + price
      console.log("user update");
      updateUserAccountBond = context.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          accountCash: {
            update: {
              balance: { increment: amount },
              transactions: {
                create: {
                  ...getCreateDateFormat(),
                  amount,
                  title: "판매",
                  type: "DEPOSIT",
                  accumulatedCash: userAccountCash.balance - BigInt(amount),
                },
              },
            },
          },
          accountsBond: {
            update: {
              where: { id: userAccountBond.id },
              data: {
                balance: { decrement: quantity },
                transactions: {
                  create: {
                    ...getCreateDateFormat(),
                    amount: quantity,
                    title: "판매",
                    type: "WITHDRAW",
                  },
                },
              },
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
    t.field("type", { type: "TradeType" });
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
          buy: await getTradingList(fundingId, "BUY", false),
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

        let userAccountCash = await getUserAccountCash(context);
        let userAccountBond;
        try {
          userAccountBond = await getUserAccoutBond(context, fundingId);
          console.log("userAccountBond :", userAccountBond);
        } catch (error) {
          userAccountBond = await context.prisma.accountBond.create({
            data: {
              ...getCreateDateFormat(),
              fundingId: fundingId,
              ownerId: userId!,
            },
          });
        }

        const promiseTransaction = [];
        if (!types) throw new Error("types not found");

        if (
          types === "BUY" &&
          BigInt(price * quantity) > userAccountCash.balance
        ) {
          console.log("price * quantity :", price * quantity);
          console.log("userAccountCash.balance :", userAccountCash.balance);

          throw new Error("Your account does not have sufficient balance.");
        }

        if (types === "SELL" && quantity > userAccountBond.balance) {
          console.log("quantity:", quantity);
          console.log("userAccountBond.balance:", userAccountBond.balance);
          throw new Error(
            "your account bond does not have sufficient balance."
          );
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
          console.log("amount:", amount, "quantityCount:", quantityCount);
          // const a = context.prisma.$transaction(tradeTransaction);
          // promiseTransaction.push(a);
          if (!!amount && !!quantityCount) {
            console.log("ha");
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
                      transactions: {
                        create: {
                          ...getCreateDateFormat(),
                          amount,
                          title: "구매",
                          type: "WITHDRAW",
                          accumulatedCash:
                            userAccountCash.balance - BigInt(amount),
                        },
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
                        transactions: {
                          create: {
                            ...getCreateDateFormat(),
                            amount: quantityCount,
                            title: "구매",
                            type: "DEPOSIT",
                          },
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
                    update: {
                      balance: { increment: amount },
                      transactions: {
                        create: {
                          ...getCreateDateFormat(),
                          amount,
                          title: "판매",
                          type: "DEPOSIT",
                          accumulatedCash:
                            userAccountCash.balance + BigInt(amount),
                        },
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
                          decrement: quantityCount,
                        },
                        transactions: !!quantityCount
                          ? {
                              create: {
                                ...getCreateDateFormat(),
                                amount: quantityCount,
                                title: "판매",
                                type: "WITHDRAW",
                              },
                            }
                          : undefined,
                      },
                    },
                  },
                },
              });
              tradeTransaction.push(updateUserCashAndBond);
            }
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
          const remainingQuantity = quantity - quantityCount;
          for (let i = 0; i < remainingQuantity; i++) {
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
          if (types === "BUY") {
            const updateAccountCash = context.prisma.accountCash.update({
              where: {
                ownerId: userId,
              },
              data: {
                balance: {
                  decrement: price * remainingQuantity,
                },
                transactions: {
                  create: {
                    amount: price * remainingQuantity,
                    title: "구매",
                    type: "WITHDRAW",
                    accumulatedCash:
                      userAccountCash.balance -
                      BigInt(amount) -
                      BigInt(price * remainingQuantity),
                  },
                },
              },
            });
            tradeTransaction.push(updateAccountCash);
          }

          const prismaTransaction =
            context.prisma.$transaction(tradeTransaction);

          promiseTransaction.push(prismaTransaction);
          await Promise.all(promiseTransaction);

          return true;
        } catch (error) {
          console.log(error);
          return false;
        }
      },
    });
    t.field("cancellationOfTrade", {
      type: "Boolean",
      args: {
        ids: nonNull(list(nonNull(intArg()))),
      },
      async resolve(parent, { ids }, context, info) {
        const tradeUpdateTransaction = [];
        const promiseTransaction = [];
        const toCancellationTrade = await context.prisma.trade.findMany({
          where: {
            id: {
              in: ids,
            },
            status: "SELLING",
          },
        });
        try {
          for (const { id, fundingId, price, type } of toCancellationTrade) {
            const updateTrade = context.prisma.trade.update({
              where: {
                id,
              },
              data: {
                status: "CANCELLATION",
              },
            });
            const redisKey = `funding:${fundingId}:${price}:${type}`;
            tradeUpdateTransaction.push(updateTrade);
            promiseTransaction.push(
              removeElementFromList(redisKey, String(id))
            );
          }
          promiseTransaction.push(
            context.prisma.$transaction(tradeUpdateTransaction)
          );

          await Promise.all(promiseTransaction);
          return true;
        } catch (error) {
          console.log(error);
          console.log("--------cancellation trade error--------");
          return false;
        }
      },
    });
  },
});
