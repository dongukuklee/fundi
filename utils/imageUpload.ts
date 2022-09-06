import multer from "multer";
import AWS from "aws-sdk";
import sharp from "sharp";
import path from "path";
import { Context, prisma } from "../src/context";
import { Request, Response } from "express";

require("dotenv").config();

type Next = () => void | Promise<void>;

type ResultType = {
  [index: string]: string;
  filename: string;
  path_origin: string;
  path_sq640: string;
  path_w640: string;
};

type CreateImageInput = ResultType & {
  height: number;
  width: number;
};

const UPLOAD_MAX_COUNTS = parseInt(process.env.UPLOAD_MAX_COUNTS || "10");
const UPLOAD_LOCATION = process.env.UPLOAD_LOCATION || "uploads";
const AWS_ACCESS_ID = process.env.ACCESS_ID;
const AWS_ACCESS_KEY = process.env.ACCESS_KEY;
const AWS_S3_BUCKET = process.env.BUCKET_NAME;

const IMAGE_RESIZES = [
  { title: "path_w640", path: `${UPLOAD_LOCATION}/w640/`, width: 640 },
];
const IMAGE_RESIZES_SQUARE = [
  { title: "path_sq640", path: `${UPLOAD_LOCATION}/sq640/`, width: 640 },
];

AWS.config.update({
  credentials: {
    accessKeyId: AWS_ACCESS_ID!,
    secretAccessKey: AWS_ACCESS_KEY!,
  },
});
const s3 = new AWS.S3();

const storage = multer.memoryStorage();
const uploads = multer({ storage: storage }).array("images", UPLOAD_MAX_COUNTS);

const upload = (req: Request, res: Response, next: Next) => {
  uploads(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.send("Too many files to upload.");
      }
    } else if (err) {
      return res.send(err);
    }
    next();
  });
};

const resize = async (req: any, res: any, next: Next) => {
  if (!req.files) return next();

  const resultArray: CreateImageInput[] = Array(req.files.length);

  for (const [index, file] of req.files.entries()) {
    // console.log(file);
    const originalExt = `${path.extname(file.originalname)}`;
    const filename = `${Date.now()}`;
    const createImageInput = <CreateImageInput>{};

    resultArray[index] = createImageInput;
    const result: CreateImageInput = resultArray[index];
    const metadata = await sharp(file.buffer).metadata();
    result.height = metadata.height!;
    result.width = metadata.width!;
    const params = {
      Bucket: AWS_S3_BUCKET!,
      ACL: "public-read",
      Body: file.buffer,
      Key: `${UPLOAD_LOCATION}/origin/${filename}${originalExt}`,
    };
    const response = await s3.upload(params).promise();
    // console.log(response);
    result.path_origin = `${UPLOAD_LOCATION}/origin/${filename}${originalExt}`;
    result.filename = `${filename}.jpg`;

    for (const resolution of IMAGE_RESIZES) {
      const { path, title, width } = resolution;

      const buffer = await sharp(file.buffer)
        .resize({
          width,
          fit: "inside",
        })
        .sharpen()
        .withMetadata()
        .toFormat("jpg")
        .toBuffer();
      const params = {
        Bucket: AWS_S3_BUCKET!,
        ACL: "public-read",
        Body: buffer,
        Key: `${path}${filename}.jpg`,
      };
      await s3.upload(params).promise();
      result[title] = `${path}${filename}.jpg`;
    }

    for (const resolution of IMAGE_RESIZES_SQUARE) {
      const buffer = await sharp(file.buffer)
        .resize({
          width: resolution.width,
          height: resolution.width,
        })
        .sharpen()
        .withMetadata()
        .toFormat("jpg")
        .toBuffer();
      const params = {
        Bucket: AWS_S3_BUCKET!,
        ACL: "public-read",
        Body: buffer,
        Key: `${resolution.path}${filename}.jpg`,
      };
      await s3.upload(params).promise();
      result[resolution.title] = `${resolution.path}${filename}.jpg`;
    }
  }

  console.log(resultArray);
  req.body.results = resultArray;

  next();
};

const result = async (req: Request, res: Response) => {
  if (req.body.results.length <= 0) {
    return res.send(`You must select at least 1 image.`);
  }
  for (const CreateImageData of req.body.results) {
    await prisma.image.create({
      data: { ...CreateImageData },
    });
  }

  return res.send(req.body.results);
};
export default {
  upload,
  resize,
  result,
};
