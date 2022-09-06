import { inputObjectType } from "nexus";

export const ImageInput = inputObjectType({
  name: "ImageInput",
  definition(t) {
    t.nonNull.string("filename");
    t.nonNull.string("path_origin");
    t.nonNull.string("path_sq640");
    t.nonNull.string("path_w640");
    t.nonNull.int("height");
    t.nonNull.int("width");
  },
});
