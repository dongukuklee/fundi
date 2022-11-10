import { Role } from "@prisma/client";
import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import { getUser } from "../../utils/getUserInfo";

export const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("email");
    t.string("nickName");
    t.field("totalCumulativeInvestmentAmount", {
      type: "BigInt",
      async resolve(parent, args, context, info) {
        const accountBonds = await context.prisma.accountBond.findMany({
          where: {
            ownerId: parent.id,
          },
          include: {
            funding: {
              select: {
                bondPrice: true,
              },
            },
          },
        });
        return accountBonds.reduce(
          (acc, cur) => acc + cur.balance * cur.funding!.bondPrice!,
          BigInt(0)
        );
      },
    });
    t.field("totalCumulativeSettlementAmount", {
      type: "BigInt",
      async resolve(parent, args, context, info) {
        const accountBonds = await context.prisma.accountBond.findMany({
          where: {
            ownerId: parent.id,
          },
          include: {
            settlementTransactions: {
              select: {
                settlementAmount: true,
                additionalSettleMentAmount: true,
              },
            },
          },
        });
        return accountBonds.reduce((acc, cur) => {
          const cumulativeSettlementAmount = cur.settlementTransactions.reduce(
            (acc, cur) =>
              acc + cur.additionalSettleMentAmount + cur.settlementAmount,
            BigInt(0)
          );
          return acc + cumulativeSettlementAmount;
        }, BigInt(0));
      },
    });
    t.nonNull.field("role", { type: "Role" });
    t.field("auth", {
      type: "Auth",
      resolve(parent, args, context, info) {
        return context.prisma.user
          .findUnique({ where: { id: parent.id } })
          .auth();
      },
    });
    t.field("accountCash", {
      type: "AccountCash",
      resolve(parent, args, context, info) {
        return context.prisma.user
          .findUnique({ where: { id: parent.id } })
          .accountCash();
      },
    });
    t.nonNull.list.nonNull.field("accountsBond", {
      type: "AccountBond",
      resolve(parent, args, context, info) {
        return context.prisma.user
          .findUnique({ where: { id: parent.id } })
          .accountsBond();
      },
    });
    t.list.field("favoriteFundings", {
      type: "Funding",
      async resolve(parent, args, context, info) {
        const likeFundings = await context.prisma.user
          .findUnique({ where: { id: parent.id } })
          .likeFundings();

        const FundingIds = likeFundings.map((el) => el.fundingId);
        return await Promise.all(
          FundingIds.map(async (id) => {
            return await context.prisma.funding.findFirst({
              where: { id },
            });
          })
        );
      },
    });
    t.list.field("favoriteCreators", {
      type: "Creator",
      async resolve(parent, args, context) {
        const likeCreators = await context.prisma.user
          .findUnique({ where: { id: parent.id } })
          .likedCreator();

        const creatorIds = likeCreators.map((el) => el.creatorId);
        return await Promise.all(
          creatorIds.map(async (id) => {
            return await context.prisma.creator.findFirst({
              where: { id },
            });
          })
        );
      },
    });
    t.list.field("alarm", {
      type: "Alarm",
      resolve(parent, args, context, info) {
        return context.prisma.user
          .findUnique({ where: { id: parent.id } })
          .alarm();
      },
    });
  },
});

export const UserQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("user", {
      type: "User",
      async resolve(parent, args, context, info) {
        const { userRole } = context;
        if (userRole === Role.ADMIN) {
          throw new Error("Only the owner can inquiry user information.");
        }
        return getUser(context);
      },
    });
    t.list.field("users", {
      type: "User",
      async resolve(parent, args, context, info) {
        // if (userRole === Role.ADMIN) {
        //   throw new Error("Only the owner can inquiry user information.");
        // }
        return context.prisma.user.findMany({});
      },
    });
  },
});

export const UserMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("userUpdate", {
      type: "User",
      async resolve(parent, args, context, info) {
        const userId = 3;

        return await context.prisma.user.update({
          where: { id: userId },
          data: {
            nickName: "gkgkgkk",
          },
        });
      },
    });
  },
});
