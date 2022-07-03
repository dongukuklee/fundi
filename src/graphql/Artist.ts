import { objectType } from "nexus";

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
        return context.prisma.artist
          .findUnique({ where: { id: parent.id } })
          .fundings();
      },
    });
  },
});
