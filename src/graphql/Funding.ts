import { objectType } from "nexus";

export const Funding = objectType({
  name: "Funding",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.string("title");
    //t.nonNull.field("artist",{type:Artist});
    //t.nonNull.int("artistId");
    //t.nonNull.field("contract",{type:Contract});
    //t.nonNull.int("contractId");
    t.nonNull.int("bondPrice");
    t.nonNull.int("bondTotalNumber");
    //t.nonNull.field("fundingStatus",{type:FundingStatus});
    //t.nonNull.list.field("accountFundings",{type:AccountFunding});
    //t.nonNull.list.field("artworks",{type:Artwork});
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
  },
});
