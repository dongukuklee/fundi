import { objectType } from "nexus";

export const AccountBond = objectType({
  name: "AccountBond",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.bigInt("balance");
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
        return context.prisma.accountBond
          .findUnique({ where: { id: parent.id } })
          .funding();
      },
    });
    t.field("settlementAmount", {
      type: "BigInt",
      async resolve(parent, args, context, info) {
        const settlementTransactions = await context.prisma.accountBond
          .findUnique({
            where: { id: parent.id },
          })
          .settlementTransactions();
        return settlementTransactions.reduce(
          (acc, cur) => {
            const { settlementAmount, additionalSettleMentAmount } = cur;
            return [
              acc[0] + settlementAmount,
              acc[1] + additionalSettleMentAmount,
              acc[2] + settlementAmount + additionalSettleMentAmount,
            ];
          },
          [BigInt(0), BigInt(0), BigInt(0)]
        );
      },
    });
    t.field("investmentAmount", {
      type: "BigInt",
      async resolve(parent, args, context, info) {
        const funding = await context.prisma.accountBond
          .findFirst({
            where: { id: parent.id },
          })
          .funding();
        const bondPrice = funding?.bondPrice;
        return bondPrice! * parent.balance;
      },
    });
  },
});
