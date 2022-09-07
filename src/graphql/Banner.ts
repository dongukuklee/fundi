import { extendType, objectType } from "nexus";

export const Banner = objectType({
  name: "Banner",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.list.field("images", {
      type: "Image",
      resolve(parent, args, context, info) {
        return context.prisma.banner
          .findUnique({ where: { id: parent.id } })
          .images();
      },
    });
    t.field("type", { type: "BannerTypes" });
    t.int("targetId");
  },
});

export const BannerQuery = extendType({
  type: "Query",
  definition(t) {
    t.list.field("banners", {
      type: "Banner",
      resolve(parent, args, context, info) {
        return context.prisma.banner.findMany({});
      },
    });
  },
});
