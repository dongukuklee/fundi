import { objectType } from "nexus";

export const Artwork = objectType({
  name: "Artwork",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("title");
    t.field("funding", {
      type: "Funding",
      resolve(parent, args, context, info) {
        return context.prisma.artwork
          .findUnique({ where: { id: parent.id } })
          .funding();
      },
    });
    t.nonNull.bigInt("initialPrice");
    t.nonNull.bigInt("sellingPrice");
    t.nonNull.boolean("isSold");
  },
});
