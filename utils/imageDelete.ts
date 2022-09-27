import AWS from "aws-sdk";
import { filter, flatten, map } from "underscore";
import { Context } from "../src/context";
const AWS_S3_BUCKET = process.env.BUCKET_NAME;

type TargetInfo = {
  id: number;
  table: string;
};

type ImagePaths = {
  path_origin: string;
  path_sq640: string;
  path_w640: string;
};

const getImageDataByTargetInfo = async (
  context: Context,
  targetInfo: TargetInfo
) => {
  const { id, table } = targetInfo;
  const key = `${table}Id`;
  const result = await context.prisma.image.findMany({
    where: { [key]: id },
    select: { path_origin: true, path_sq640: true, path_w640: true },
  });
  return result;
};

const getImagePaths = (imageDatas: ImagePaths[]) => {
  const keyToBeFiltered = ["path_origin", "path_sq640", "path_w640"];
  return flatten(
    map(imageDatas, (imageData) =>
      filter(imageData, (key) => keyToBeFiltered.includes(key))
    )
  );
};

/**
 * image id값들을 받아 s3에 있는 이미지를 삭제합니다.
 * @param imagePaths
 * @returns boolean
 */
export const deleteImgaeFromS3 = async (imagePaths: string[]) => {
  const s3 = new AWS.S3();
  // delete할 image들을 조회한 string 배열 값을 파라미터 형식에 맞게 변환 후 params에 추가한다.
  try {
    if (Object.keys(imagePaths).length > 0) {
      const Objects = imagePaths.map((imagePath) => {
        return { Key: imagePath };
      });

      const params = {
        Bucket: AWS_S3_BUCKET!,
        Delete: {
          Objects,
        },
      };
      await s3.deleteObjects(params).promise();
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const deleteImage = async (context: Context, targetInfo: TargetInfo) => {
  const imageDatas = await getImageDataByTargetInfo(context, targetInfo);
  const imagePaths = getImagePaths(imageDatas);
  const isSuccess = await deleteImgaeFromS3(imagePaths);

  return isSuccess;
};
