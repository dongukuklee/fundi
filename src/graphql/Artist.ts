import {
  arg,
  extendType,
  intArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from "nexus";
import { TAKE } from "../common/const";
import { ArtistInvestmentPoint } from "./ArtistInvestmentPoint";

type updateArtistVariables = {
  name?: string;
  age?: number;
  biography?: string;
};

const makeVariables = ({
  name,
  age,
  biography,
}: {
  name: string | null | undefined;
  age: number | null | undefined;
  biography: string | null | undefined;
}) => {
  const variables: updateArtistVariables = {};
  if (name) {
    variables.name = name;
  }
  if (age) {
    variables.age = age;
  }
  if (biography) {
    variables.biography = biography;
  }
  return variables;
};

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
    t.field("createArtist", {
      type: "Artist",
      args: {
        name: nonNull(stringArg()),
        age: nonNull(intArg()),
        biography: nonNull(stringArg()),
        investmentPoint: list(nonNull(ArtistInvestmentPoint)),
      },
      async resolve(
        parent,
        { name, age, biography, investmentPoint },
        context,
        info
      ) {
        if (context.userRole !== "ADMIN") {
          throw new Error("Only the administrator can create artist.");
        }

        return await context.prisma.artist.create({
          data: {
            name,
            age,
            biography,
            artistInvestmentPoint: {
              createMany: {
                data: investmentPoint!,
              },
            },
          },
        });
      },
    });
    t.field("updateArtist", {
      type: "Artist",
      args: {
        id: nonNull(intArg()),
        name: stringArg(),
        age: intArg(),
        biography: stringArg(),
        investmentPoint: list(nonNull(ArtistInvestmentPoint)),
      },
      async resolve(
        parent,
        { id, investmentPoint, name, age, biography },
        context,
        info
      ) {
        if (context.userRole !== "ADMIN") {
          throw new Error("Only the administrator can update artist.");
        }
        const variables = makeVariables({ name, age, biography });

        return await context.prisma.artist.update({
          where: {
            id,
          },
          data: {
            artistInvestmentPoint: {
              createMany: {
                data: investmentPoint!,
              },
            },
            ...variables,
          },
        });
      },
    });
  },
});
