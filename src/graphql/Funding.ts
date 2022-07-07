import { Role } from "@prisma/client";
import { extendType, intArg, nonNull, objectType } from "nexus";

interface BondsBalance {
  balance: bigint;
  owner: {
    id: number;
    role: Role;
  };
}

const getFunding = async (context: any, id: number) => {
  const funding = await context.prisma.funding.findUnique({
    where: { id },
  });

  return funding;
};

const getRemainigBondTotalPrice = async (
  bondPrice: bigint,
  fundingId: number,
  context: any
) => {
  //const investors = accountsBond.filter((el) => el.owner.role === "INVESTOR");
  const accountsBond: BondsBalance[] =
    await context.prisma.accountBond.findMany({
      select: {
        balance: true,
        owner: {
          select: {
            id: true,
            role: true,
          },
        },
      },
      where: {
        fundingId,
      },
    });

  if (!accountsBond) {
    throw new Error("accountsBond not found");
  }

  const [manager] = accountsBond.filter((el) => el.owner.role === "MANAGER");
  const remainigBondTotalPrice = manager.balance;
  const remainigBondNumber = Number(remainigBondTotalPrice / bondPrice);
  return [Number(remainigBondTotalPrice), remainigBondNumber];
};

export const Funding = objectType({
  name: "Funding",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("title");
    t.list.field("remainingBonds", {
      type: "Int",
      async resolve(parent, args, context, info) {
        return getRemainigBondTotalPrice(parent.bondPrice, parent.id, context);
      },
    });
    t.field("artist", {
      type: "Artist",
      resolve(parent, args, context, info) {
        return context.prisma.funding
          .findUnique({ where: { id: parent.id } })
          .artist();
      },
    });
    t.field("contract", {
      type: "Contract",
      resolve(parent, args, context, info) {
        return context.prisma.funding
          .findUnique({ where: { id: parent.id } })
          .contract();
      },
    });
    t.nonNull.bigInt("bondPrice");
    t.nonNull.bigInt("bondTotalNumber");
    t.nonNull.field("status", { type: "FundingStatus" });
    t.field("accountBond", { type: "AccountBond" });
    t.nonNull.list.nonNull.field("artworks", {
      type: "Artwork",
      resolve(parent, args, context, info) {
        return context.prisma.funding
          .findUnique({ where: { id: parent.id } })
          .artworks();
      },
    });
  },
});

export const FundingQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.list.nonNull.field("myFundings", {
      type: "Funding",
      args: {
        skip: intArg(),
        take: intArg(),
      },
      async resolve(parent, args, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error("Cannot inquiry my funding list without signing in.");
        }
        const fundings = await context.prisma.user
          .findUnique({ where: { id: userId } })
          .fundings();
        return fundings;
      },
    });
    t.list.field("fundingList", {
      type: "Funding",
      async resolve(parent, args, context, info) {
        const funding = await context.prisma.funding.findMany({});
        return funding;
      },
    });
  },
});

export const FundingMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("fundParticipation", {
      type: "Funding",
      args: {
        id: nonNull(intArg()),
        balance: nonNull(intArg()),
      },
      async resolve(parent, { id, balance }, context, info) {
        // accountCash 에 balance 만큼 차감.
        const funding = await context.prisma.funding.findUnique({
          select: {
            bondPrice: true,
            bondTotalNumber: true,
            accountsBond: true,
          },
          where: { id },
        });

        if (!funding) {
          throw new Error("funding not found");
        }
        // 펀드 조회

        const { bondPrice, accountsBond } = funding;

        const owner = await context.prisma.user.findUnique({
          where: {
            id: context.userId,
            //id: 1,
          },
          select: {
            accountCash: {
              select: { balance: true },
            },
            accountsBond: {
              where: {
                fundingId: id,
              },
              select: {
                id: true,
                funding: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        });
        if (!owner) {
          throw new Error("user invalid");
        }
        //유저 조회
        const managedAccountBond = await context.prisma.accountBond.findFirst({
          select: { owner: true, id: true },
          where: { AND: [{ owner: { role: "MANAGER" } }, { fundingId: id }] },
        });
        if (!managedAccountBond) {
          throw new Error("manager invalid");
        }

        const userBalance = Number(owner?.accountCash?.balance);
        const userAccountBond = owner?.accountsBond;
        if (userBalance < balance) {
          throw new Error("balance is not enougth");
        }
        //유저 잔액 체크

        const [remainigBondTotalPrice] = await getRemainigBondTotalPrice(
          bondPrice,
          id,
          context
        );
        if (remainigBondTotalPrice < balance) {
          throw new Error("balance is larger than remaining bond price");
        }
        //구매 신청한 채권이 구매 가능한 채권보다 많을 경우

        const bondAmount = balance / Number(bondPrice);
        if (!!userAccountBond.length) {
          await context.prisma.user.update({
            where: {
              id: context.userId,
              //id: 1,
            },
            data: {
              accountsBond: {
                update: {
                  where: {
                    id: userAccountBond[0].id,
                  },
                  data: {
                    balance: {
                      increment: balance,
                    },
                  },
                },
                create: {
                  transactions: {
                    create: {
                      amount: bondAmount,
                      type: "DEPOSIT",
                      title: "거래",
                    },
                  },
                },
              },
              accountCash: {
                update: {
                  balance: {
                    decrement: balance,
                  },
                },
                create: {
                  transactions: {
                    create: {
                      amount: balance,
                      title: "거래",
                      type: "WITHDRAW",
                    },
                  },
                },
              },
            },
          });

          //채권 판매자(MANAGER)
          await context.prisma.user.update({
            select: {
              accountsBond: {
                select: {
                  id: true,
                },
              },
              accountCash: {
                select: {
                  id: true,
                },
              },
            },
            where: {
              id: managedAccountBond.owner.id,
            },
            data: {
              accountCash: {
                update: {
                  balance: {
                    increment: balance,
                  },
                },
                create: {
                  transactions: {
                    create: {
                      amount: balance,
                      title: "거래",
                      type: "DEPOSIT",
                    },
                  },
                },
              },
              accountsBond: {
                update: {
                  where: {
                    id: managedAccountBond.id,
                  },
                  data: {
                    balance: {
                      decrement: balance,
                    },
                  },
                },
                create: {
                  transactions: {
                    create: {
                      amount: bondAmount,
                      title: "거래",
                      type: "WITHDRAW",
                    },
                  },
                },
              },
            },
          });
        } else {
          //해당 펀드에 투자가 처음인 유저
          //채권 구매자(INVESTOR)
          //context.prisma.$transaction([])
          await context.prisma.user.update({
            select: {
              accountsBond: {
                select: {
                  id: true,
                },
              },
              accountCash: {
                select: {
                  id: true,
                },
              },
            },
            where: {
              id: context.userId,
              //id: 1,
            },
            data: {
              accountsBond: {
                create: {
                  fundingId: id,
                  balance,
                  transactions: {
                    create: {
                      amount: bondAmount,
                      type: "DEPOSIT",
                      title: "거래",
                    },
                  },
                },
              },
              accountCash: {
                update: {
                  balance: {
                    decrement: balance,
                  },
                },
                create: {
                  transactions: {
                    create: {
                      amount: balance,
                      title: "거래",
                      type: "WITHDRAW",
                    },
                  },
                },
              },
            },
          });

          //채권 판매자(MANAGER)
          await context.prisma.user.update({
            select: {
              accountsBond: {
                select: {
                  id: true,
                },
              },
              accountCash: {
                select: {
                  id: true,
                },
              },
            },
            where: {
              id: managedAccountBond.owner.id,
            },
            data: {
              accountCash: {
                update: {
                  balance: {
                    increment: balance,
                  },
                },
                create: {
                  transactions: {
                    create: {
                      amount: balance,
                      title: "거래",
                      type: "DEPOSIT",
                    },
                  },
                },
              },
              accountsBond: {
                update: {
                  where: {
                    id: managedAccountBond.id,
                  },
                  data: {
                    balance: {
                      decrement: balance,
                    },
                  },
                },
                create: {
                  transactions: {
                    create: {
                      amount: bondAmount,
                      title: "거래",
                      type: "WITHDRAW",
                    },
                  },
                },
              },
            },
          });
        }

        return await getFunding(context, id);
      },
    });
  },
});
