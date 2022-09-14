import AWS from "aws-sdk";
const AWS_S3_BUCKET = process.env.BUCKET_NAME;

export const imageDelete = async (imageIds: string[]) => {
  const s3 = new AWS.S3();
  // delete할 image들을 조회한 string 배열 값을 파라미터 형식에 맞게 변환 후 params에 추가한다.
  try {
    if (Object.keys(imageIds).length > 0) {
      const Objects = imageIds.map((el) => {
        return { Key: el };
      });

      const params = {
        Bucket: AWS_S3_BUCKET!,
        Delete: {
          Objects,
        },
      };
      await s3.deleteObjects(params).promise();
    }
    return "image delete successfully";
  } catch (error) {
    return error;
  }
};
