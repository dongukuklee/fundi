import { extendType, intArg, nonNull, objectType } from "nexus";

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

export const ArtworkQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("artwork", {
      type: "Artwork",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        return await context.prisma.artwork.findUnique({ where: { id } });
      },
    });
    t.nonNull.list.nonNull.field("artworks", {
      type: "Artwork",
      args: {
        id: nonNull(intArg()),
        //fundId
      },
      async resolve(parent, { id }, context, info) {
        return await context.prisma.funding
          .findUnique({ where: { id } })
          .artworks();
      },
    });
  },
});
