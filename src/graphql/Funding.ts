import { AccountBond, Role } from "@prisma/client";
import { extendType, intArg, nonNull, objectType } from "nexus";
import { TransactionType } from "@prisma/client";
import { TAKE } from "../common/const";

export const Funding = objectType({
  name: "Funding",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.field("status", { type: "FundingStatus" });
    t.nonNull.string("title");
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
    t.nonNull.bigInt("bondsTotalNumber");
    t.nonNull.list.nonNull.field("artworks", {
      type: "Artwork",
      resolve(parent, args, context, info) {
        return context.prisma.funding
          .findUnique({ where: { id: parent.id } })
          .artworks();
      },
    });
    t.nonNull.field("bondsRemaining", {
      type: "BigInt",
      async resolve(parent, args, context, info) {
        const accountManager = (await context.prisma.accountBond.findFirst({
          where: {
            AND: {
              fundingId: parent.id,
              owner: {
                role: Role.MANAGER,
              },
            },
          },
          select: {
            balance: true,
          },
        })) as AccountBond | undefined;
        if (!accountManager) {
          throw new Error("accountManager not found");
        }
        return accountManager.balance;
      },
    });
    t.nonNull.list.nonNull.field("accounstInvestor", {
      type: "AccountBond",
      async resolve(parent, args, context, info) {
        const { userRole } = context;
        if (userRole !== Role.ADMIN && userRole !== Role.MANAGER) {
          throw new Error(
            "Only the manager and administrator can inquiry accounts of fundings."
          );
        }
        return await context.prisma.accountBond.findMany({
          where: {
            AND: {
              fundingId: parent.id,
              owner: {
                role: Role.INVESTOR,
              },
            },
          },
        });
      },
    });
    t.field("accountManager", {
      type: "AccountBond",
      async resolve(parent, args, context, info) {
        const { userRole } = context;
        if (userRole !== Role.ADMIN && userRole !== Role.MANAGER) {
          throw new Error(
            "Only the manager and administrator can inquiry accounts of fundings."
          );
        }
        return await context.prisma.accountBond.findFirst({
          where: {
            AND: {
              fundingId: parent.id,
              owner: {
                role: Role.MANAGER,
              },
            },
          },
        });
      },
    });
  },
});

export const FundingQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("funding", {
      type: "Funding",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        return await context.prisma.funding.findUnique({
          where: {
            id,
          },
        });
      },
    });
    t.nonNull.list.nonNull.field("fundings", {
      type: "Funding",
      args: {
        skip: intArg(),
        take: intArg(),
      },
      async resolve(parent, args, context, info) {
        const funding = await context.prisma.funding.findMany({
          skip: args?.skip as number | undefined,
          take: args?.take ? args.take : TAKE,
        });
        return funding;
      },
    });
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
        return await context.prisma.funding.findMany({
          where: {
            accountsBond: {
              every: {
                ownerId: userId,
              },
            },
          },
        });
      },
    });
  },
});

export const FundingMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("participateFunding", {
      type: "AccountBond",
      args: {
        id: nonNull(intArg()),
        amount: nonNull(intArg()),
      },
      async resolve(parent, args, context, info) {
        const { id, amount } = args;
        const { userId } = context;

        if (!userId) {
          throw new Error(
            "Cannot participate in a funding without signing in."
          );
        }

        //유저 계좌 조회
        let investor = await context.prisma.user.findUnique({
          where: {
            id: userId,
          },
          include: {
            accountCash: {
              select: { id: true, balance: true },
            },
            accountsBond: {
              where: {
                fundingId: id,
              },
              select: {
                id: true,
              },
              include: {
                funding: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        });

        if (
          !investor ||
          !investor.accountCash ||
          investor.accountsBond.length > 1
        ) {
          throw new Error("Invalid user");
        }

        // 펀드 조회
        const funding = await context.prisma.funding.findUnique({
          where: { id },
          select: {
            bondPrice: true,
            accountsBond: {
              where: {
                owner: {
                  role: Role.MANAGER,
                },
              },
              include: {
                owner: {
                  select: {
                    accountCash: true,
                  },
                },
              },
              select: {
                balance: true,
                ownerId: true,
              },
            },
          },
        });

        if (!funding || !funding.accountsBond) {
          throw new Error("Invalid funding");
        }

        const investmentPrice = funding.bondPrice * BigInt(amount);

        if (investmentPrice > investor.accountCash.balance) {
          throw new Error("Your account does not have sufficient balance.");
        }

        if (amount > funding.accountsBond[0].balance) {
          throw new Error("You cannot buy more than the remaining bonds");
        }

        // 해당 채권 계좌가 없는 경우에 채권 계좌 개설
        if (investor.accountsBond.length === 0) {
          investor = await context.prisma.user.update({
            where: {
              id: context.userId,
            },
            data: {
              accountsBond: {
                create: {
                  fundingId: id,
                  balance: 0,
                },
              },
            },
            include: {
              accountCash: {
                select: { id: true, balance: true },
              },
              accountsBond: {
                where: {
                  fundingId: id,
                },
                select: {
                  id: true,
                },
                include: {
                  funding: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          });
        }

        if (investor.accountsBond.length !== 1) {
          throw new Error("Invalid user");
        }

        const accountCashIdInvestor = investor.accountCash?.id;
        const accountBondIdInvestor = investor.accountsBond[0].id;
        const accountCashIdManager =
          funding.accountsBond[0].owner.accountCash?.id;
        const accountBondIdManager = funding.accountsBond[0].id;

        await context.prisma.$transaction([
          context.prisma.accountCash.update({
            where: {
              id: accountCashIdInvestor,
            },
            data: {
              balance: {
                decrement: investmentPrice,
              },
              transactions: {
                create: {
                  amount: investmentPrice,
                  title: "구매",
                  type: TransactionType.WITHDRAW,
                },
              },
            },
          }),
          context.prisma.accountBond.update({
            where: {
              id: accountBondIdManager,
            },
            data: {
              balance: {
                decrement: amount,
              },
              transactions: {
                create: {
                  amount: amount,
                  title: "매도",
                  type: TransactionType.WITHDRAW,
                },
              },
            },
          }),
          context.prisma.accountCash.update({
            where: {
              id: accountCashIdManager,
            },
            data: {
              balance: {
                increment: investmentPrice,
              },
              transactions: {
                create: {
                  amount: investmentPrice,
                  title: "판매",
                  type: TransactionType.DEPOSIT,
                },
              },
            },
          }),
          context.prisma.accountBond.update({
            where: {
              id: accountBondIdInvestor,
            },
            data: {
              balance: {
                increment: amount,
              },
              transactions: {
                create: {
                  amount: amount,
                  title: "매수",
                  type: TransactionType.DEPOSIT,
                },
              },
            },
          }),
        ]);

        return context.prisma.accountBond.findUnique({
          where: {
            id: accountBondIdInvestor,
          },
          include: {
            transactions: {
              skip: 0,
              take: TAKE,
            },
          },
        });
      },
    });
  },
});
