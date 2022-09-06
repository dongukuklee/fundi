import { enumType } from "nexus";

export const ImageTypes = enumType({
  name: "ImageTypes",
  members: {
    CREATOR: "creator",
    FUNDING: "funding",
    NOTICE: "notice",
    QNA: "qna",
  },
  description: "Define ImageTypes",
});
