import { extendType, intArg, nonNull, objectType } from "nexus";
import { TAKE } from "../common/const";

export const Artist = objectType({
  name: "Artist",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("name");
    t.int("age");
    t.nonNull.list.nonNull.field("fundings", {
      type: "Funding",
      resolve(parent, args, context, info) {
        return context.prisma.funding.findMany({
          where: {
            artist: {
              every: {
                artistId: parent.id,
              },
            },
          },
        });
      },
    });
    t.list.field("likedUser", {
      type: "User",
      async resolve(parent, args, context, info) {
        const likedUsers = await context.prisma.artist
          .findUnique({
            where: {
              id: parent.id,
            },
          })
          .likedUser()
          .then((el) => {
            return el.map((data) => data.UserId);
          });
        return await context.prisma.user.findMany({
          where: {
            id: {
              in: likedUsers,
            },
          },
        });
      },
    });
  },
});

export const ArtistQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("artist", {
      type: "Artist",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        return await context.prisma.artist.findUnique({ where: { id } });
      },
    });
    t.nonNull.list.nonNull.field("artists", {
      type: "Artist",
      args: {
        skip: intArg(),
        take: intArg(),
      },
      async resolve(parent, args, context, info) {
        return await context.prisma.artist.findMany({
          skip: args?.skip as number | undefined,
          take: args?.take ? args.take : TAKE,
        });
      },
    });
  },
});

export const AritstMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("likeArtist", {
      type: "Artist",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        if (!context.userId) {
          throw new Error("Cannot liked Artist without signing in.");
        }
        return await context.prisma.artist.update({
          where: {
            id,
          },
          data: {
            likedUser: {
              create: {
                UserId: context.userId,
              },
            },
          },
        });
      },
    });
  },
});
