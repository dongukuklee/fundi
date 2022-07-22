import { inputObjectType, objectType } from "nexus";

export const ArtistInvestmentPoint = inputObjectType({
  name: "ArtistInvestmentPoint",
  definition(t) {
    t.nonNull.string("title"), t.nonNull.string("status");
  },
});
