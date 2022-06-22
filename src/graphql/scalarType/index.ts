
import { scalarType } from "nexus";
const {  Kind } = require('graphql');

export const DateScalar = scalarType({
    name: "dateTime",
    asNexusMethod: "dateTime",
    description: "Date custom scalar type",
    parseValue(value:any) {
      const date = new Date(value);
      return date.getTime();
    },
    serialize(value:any) {
      return new Date(value);
    },
    parseLiteral(ast:any) {
      if (ast.kind === Kind.INT) {
        return new Date(ast.value);
      }
      return null;
    },
  });

  