import { Role } from "@prisma/client";
import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";

export const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("email");
    t.string("name");
    t.nonNull.field("role", { type: "Role" });
    t.field("auth", {
      type: "Auth",
      resolve(parent, args, context, info) {
        return context.prisma.user
          .findUnique({ where: { id: parent.id } })
          .auth();
      },
    });
    t.field("accountCash", {
      type: "AccountCash",
      resolve(parent, args, context, info) {
        return context.prisma.user
          .findUnique({ where: { id: parent.id } })
          .accountCash();
      },
    });
    t.nonNull.list.nonNull.field("accountsBond", {
      type: "AccountBond",
      resolve(parent, args, context, info) {
        return context.prisma.user
          .findUnique({ where: { id: parent.id } })
          .accountsBond();
      },
    });
    t.list.field("favoriteArtists", {
      type: "Artist",
      async resolve(parent, args, context, info) {
        const likeArtists = await context.prisma.user
          .findUnique({ where: { id: parent.id } })
          .likeArtists();

        const artistIds = likeArtists.map((el) => el.artistId);
        return await Promise.all(
          artistIds.map(async (id) => {
            return await context.prisma.artist.findFirst({ where: { id } });
          })
        );
      },
    });
    t.list.field("favoriteFundings", {
      type: "Funding",
      async resolve(parent, args, context, info) {
        const likeFundings = await context.prisma.user
          .findUnique({ where: { id: parent.id } })
          .likeFundings();

        const FundingIds = likeFundings.map((el) => el.fundingId);
        return await Promise.all(
          FundingIds.map(async (id) => {
            return await context.prisma.funding.findFirst({
              where: { id },
            });
          })
        );
      },
    });
  },
});

export const UserQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("user", {
      type: "User",
      async resolve(parent, args, context, info) {
        const { userId, userRole } = context;
        if (!userId) {
          throw new Error(
            "Cannot inquiry user information without signing in."
          );
        }
        if (userRole === Role.ADMIN) {
          throw new Error("Only the owner can inquiry user information.");
        }
        return await context.prisma.user.findUnique({
          where: {
            id: userId,
          },
        });
      },
    });
  },
});
