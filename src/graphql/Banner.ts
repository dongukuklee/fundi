import { extendType, intArg, list, nonNull, objectType } from "nexus";

export const Banner = objectType({
  name: "Banner",
  definition(t) {
    t.nonNull.int("id");
    t.field("banner", {
      type: "BannerModule",
      resolve(parent, args, context, info) {
        return context.prisma.banner
          .findUnique({ where: { id: parent.id } })
          .banners();
      },
    });
  },
});

export const BannerQuery = extendType({
  type: "Query",
  definition(t) {
    t.list.field("banners", {
      type: "Banner",
      async resolve(parent, args, context, info) {
        return context.prisma.banner.findMany({});
      },
    });
  },
});

export const BannerMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createBanner", {
      type: "Banner",
      args: {
        id: nonNull(intArg()),
        sequence: nonNull(intArg()),
      },
      resolve(parent, { id, sequence }, context, info) {
        return context.prisma.banner.create({
          data: {
            banners: {
              connect: {
                id,
              },
            },
          },
        });
      },
    });
    t.field("alterSequence", {
      type: "Boolean",
      args: {
        ids: nonNull(list(nonNull(intArg()))),
      },
      async resolve(parent, { ids }, context, info) {
        const beforeBanner = await context.prisma.banner.findMany({
          select: {
            id: true,
          },
        });
        const beforeBannerIds = beforeBanner.map((el) => el.id);
        const disconnectBannerModules = beforeBannerIds.map((el) => {
          return context.prisma.banner.update({
            where: {
              id: el,
            },
            data: {
              banners: {
                disconnect: true,
              },
            },
          });
        });
        const updateBanners = ids.map((el, idx) => {
          return context.prisma.banner.create({
            data: {
              banners: {
                connect: {
                  id: el,
                },
              },
            },
          });
        });
        const deleteBeforeBanner = beforeBannerIds.map((el) => {
          return context.prisma.banner.delete({
            where: {
              id: el,
            },
          });
        });

        try {
          await context.prisma.$transaction([
            ...disconnectBannerModules,
            ...updateBanners,
            ...deleteBeforeBanner,
          ]);
          return true;
        } catch (error) {
          console.log(error);
          return false;
        }
      },
    });
  },
});
