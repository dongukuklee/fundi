import { objectType } from "nexus";

export const AccountBond = objectType({
  name: "AccountBond",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.bigInt("balance");
    t.nonNull.int("ownerId");
    t.nonNull.int("fundingId");
    t.field("owner", {
      type: "User",
      resolve(parent, args, context, info) {
        return context.prisma.accountBond
          .findUnique({ where: { id: parent.id } })
          .owner();
      },
    });
    t.nonNull.list.nonNull.field("transactions", {
      type: "TransactionBond",
      resolve(parent, args, context, info) {
        return context.prisma.accountBond
          .findUnique({ where: { id: parent.id } })
          .transactions();
      },
    });
    t.nonNull.list.nonNull.field("transactionSettlement", {
      type: "TransactionSettlement",
      resolve(parent, args, context, info) {
        return context.prisma.accountBond
          .findUnique({
            where: { id: parent.id },
          })
          .settlementTransactions();
      },
    });
    t.field("funding", {
      type: "Funding",
      resolve(parent, args, context, info) {
        return context.prisma.funding.findUnique({
          where: { id: parent.fundingId },
        });
      },
    });
    t.list.field("settlementAmount", {
      type: "BigInt",
      async resolve(parent, args, context, info) {
        const settlementTransactions = await context.prisma.accountBond
          .findUnique({
            where: { id: parent.id },
          })
          .settlementTransactions();
        const defaultAmount = [BigInt(0), BigInt(0), BigInt(0)];
        if (!settlementTransactions.length) {
          return defaultAmount;
        }
        return settlementTransactions.reduce((acc, cur) => {
          const { settlementAmount, additionalSettleMentAmount } = cur;
          return [
            acc[0] + settlementAmount,
            acc[1] + additionalSettleMentAmount,
            acc[2] + settlementAmount + additionalSettleMentAmount,
          ];
        }, defaultAmount);
      },
    });
    t.field("investmentAmount", {
      type: "BigInt",
      async resolve(parent, args, context, info) {
        const funding = await context.prisma.accountBond
          .findFirst({ where: { id: parent.id } })
          .funding();
        const bondPrice = funding?.bondPrice;
        return bondPrice! * parent.balance;
      },
    });
  },
});
