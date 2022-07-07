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
    t.field("funding", {
      type: "Funding",
      resolve(parent, args, context, info) {
        return context.prisma.accountBond
          .findUnique({ where: { id: parent.id } })
          .funding();
      },
    });
  },
});
