import { extendType, intArg, list, nonNull, objectType } from "nexus";

export const Banner = objectType({
  name: "Banner",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("sequence");
    t.field("banners", {
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
      resolve(parent, args, context, info) {
        return context.prisma.banner.findMany({
          orderBy: {
            sequence: "desc",
          },
        });
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
            sequence,
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
        const updateBanners = ids.map((el, idx) => {
          return context.prisma.banner.create({
            data: {
              banners: {
                connect: {
                  id: el,
                },
              },
              sequence: idx,
            },
          });
        });

        try {
          await context.prisma.$transaction([
            context.prisma.banner.deleteMany({}),
            ...updateBanners,
          ]);

          return true;
        } catch (error) {
          return false;
        }
      },
    });
  },
});
