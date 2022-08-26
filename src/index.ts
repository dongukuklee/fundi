//import { ApolloServer } from "apollo-server";
import { context } from "./context";
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginDrainHttpServer,
} from "apollo-server-core";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { ApolloServer } from "apollo-server-express";
import { schema } from "./schema";
import http from "http";
import initRoutes from "../routes";
const app = express();
// Security middleware
app.use(
  helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false })
);
// CORS middleware
app.use(
  cors({
    origin: "*",
  })
);

app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(
  express.urlencoded({
    limit: "50mb",
    extended: false,
  })
);

initRoutes(app);

const httpServer = http.createServer(app);

export const server = new ApolloServer({
  schema,
  context,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
});
const port = 8080;
(async () => {
  await server.start();
  await server.applyMiddleware({ app, path: "/" });

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  console.log(`🚀 Server ready at http://localhost:${port}`);
})();
