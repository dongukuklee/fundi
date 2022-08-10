import { Router, Request, Response, NextFunction, Express } from "express";
import imageUpload from "../utils/imageUpload";

const router = Router();

const routes = (app: any) => {
  router.post(
    "/_api_/imageUpload",
    imageUpload.upload,
    imageUpload.resize,
    imageUpload.result
  );
  return app.use("/", router);
};

export default routes;