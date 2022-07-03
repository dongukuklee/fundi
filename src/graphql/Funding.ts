import { objectType } from "nexus";

export const Funding = objectType({
  name: "Funding",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
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
