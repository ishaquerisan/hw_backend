import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import Gallery from "../models/galleryModel.js";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { compressAndSaveImageorVideo } from "../utils/fileHandler.js";
import { deletefilewithfoldername } from "../utils/fileHandler.js";
import { upload } from "../middlewares/upload.js";
import d from "d";
dotenv.config();
const router = express.Router();

// const awsAccessKey = process.env.AWS_ACCESS_KEY;
// const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
// const awsBucketName = process.env.AWS_BUCKET_NAME;
// const awsBucketRegion = process.env.AWS_BUCKET_REGION;

// const s3 = new S3Client({
//   credentials: {
//     accessKeyId: awsAccessKey,
//     secretAccessKey: awsSecretAccessKey,
//   },
//   region: awsBucketRegion,
// });

// POST route to add a new gallery item
router.post(
  "/:monumentId",
  upload.single("image"),
  async (request, response) => {
    const uploadPath = "uploads/gallery/";

    try {
      if (!request.body.imgTitle || !request.file) {
        return response.status(400).send({
          message: "Send all required fields: imgTitle, image",
        });
      }
      let fileName = null;
      if (request.file) {
        if (request.file.size > 100 * 1024 * 1024) {
          return response.status(400).send({
            message: "File size exceeds the limit of 100MB",
          });
        }
        fileName = await compressAndSaveImageorVideo(request.file, uploadPath);
      }
      // const params = {
      //   Bucket: awsBucketName,
      //   Key: fileName,
      //   Body: buffer,
      //   ContentType: request.file.mimetype,
      // };

      // const command = new PutObjectCommand(params);

      // await s3.send(command);

      const newGalleryItem = {
        monumentId: request.params.monumentId,
        imgTitle: request.body.imgTitle,
        image: fileName,
      };

      const galleryItem = await Gallery.create(newGalleryItem);

      return response.status(201).json(galleryItem);
    } catch (error) {
      deletefilewithfoldername(request.file, uploadPath);

      console.error(error.message);
      return response.status(500).send({ message: "Internal Server Error" });
    }
  }
);

router.get("/monument/:monumentId", async (request, response) => {
  try {
    const galleryItems = await Gallery.find({
      monumentId: request.params.monumentId,
    });

    const updatedGalleryItems = [];
    for (const galleryItem of galleryItems) {
      // const getObjectParams = {
      //   Bucket: awsBucketName,
      //   Key: galleryItem.image,
      // };

      // const command = new GetObjectCommand(getObjectParams);
      // const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      const updatedGalleryItem = {
        ...galleryItem.toObject(),
        imageUrl: "uploads/gallery/" + galleryItem.image,
      };
      updatedGalleryItems.push(updatedGalleryItem);
    }
    return response.status(200).json(updatedGalleryItems);
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

// GET route to retrieve a specific gallery item by ID
router.get("/:id", async (request, response) => {
  try {
    const galleryItem = await Gallery.findById(request.params.id);
    if (!galleryItem) {
      return response.status(404).send({ message: "Gallery item not found" });
    }

    // const getObjectParams = {
    //   Bucket: awsBucketName,
    //   Key: galleryItem.image,
    // };

    // const command = new GetObjectCommand(getObjectParams);
    // const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    const updatedGalleryItem = {
      ...galleryItem.toObject(),
      imageUrl: "uploads/gallery/" + galleryItem.image,
    };

    return response.status(200).json(updatedGalleryItem);
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

router.put("/:id", upload.single("image"), async (request, response) => {
  const uploadPath = "uploads/gallery/";
  try {
    let galleryItem = await Gallery.findById(request.params.id);

    if (!galleryItem) {
      return response.status(404).json({ message: "Gallery item not found" });
    }

    let oldImageKey = galleryItem.image;
    let fileName = oldImageKey;
    if (request.file) {
      if (request.file.size > 100 * 1024 * 1024) {
        return response.status(400).send({
          message: "File size exceeds the limit of 100MB",
        });
      }
      fileName = await compressAndSaveImageorVideo(request.file, uploadPath);
      deletefilewithfoldername(oldImageKey, uploadPath);
    }
    // if (request.file) {
    //   const { fileName, buffer } = await compressAndSaveFile(request.file);

    //   const params = {
    //     Bucket: awsBucketName,
    //     Key: fileName,
    //     Body: buffer,
    //     ContentType: request.file.mimetype,
    //   };

    //   const command = new PutObjectCommand(params);

    //   await s3.send(command);

    //   const deleteOldParams = {
    //     Bucket: awsBucketName,
    //     Key: oldImageKey,
    //   };

    //   const deleteOldCommand = new DeleteObjectCommand(deleteOldParams);
    //   await s3.send(deleteOldCommand);
    // }

    if (request.body.imgTitle) {
      galleryItem.imgTitle = request.body.imgTitle;
      galleryItem.image = fileName;
    }

    await galleryItem.save();

    return response.status(200).json(galleryItem);
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

router.delete("/:id", async (request, response) => {
  try {
    const galleryItem = await Gallery.findByIdAndDelete(request.params.id);
    if (!galleryItem) {
      return response.status(404).send({ message: "Gallery item not found" });
    }

    const deleteParams = {
      Bucket: awsBucketName,
      Key: galleryItem.image,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3.send(command);

    return response
      .status(200)
      .send({ message: "Gallery item deleted successfully" });
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

export default router;
