import express from "express";
import Monument from "../models/monumentModel.js";
import Gallery from "../models/galleryModel.js";
import User from "../models/userModel.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

const awsAccessKey = process.env.AWS_ACCESS_KEY;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsBucketName = process.env.AWS_BUCKET_NAME;
const awsBucketRegion = process.env.AWS_BUCKET_REGION;

const s3 = new S3Client({
  credentials: {
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretAccessKey,
  },
  region: awsBucketRegion,
});

const router = express.Router();

// route get all
router.get("/", async (request, response) => {
  try {
    const monuments = await Monument.find({ status: 1 });
    const updatedMonuments = [];
    for (const monument of monuments) {
      const getObjectParams = {
        Bucket: awsBucketName,
        Key: monument.cover_image,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      const updatedMonument = {
        ...monument.toObject(),
        imageUrl: url,
      };
      updatedMonuments.push(updatedMonument);
    }

    return response.status(200).json(updatedMonuments);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// route get latest 3 only only
router.get("/latest3/", async (request, response) => {
  try {
    const monuments = await Monument.find({ status: 1 })
      .sort({ createdAt: -1 })
      .limit(3);

    const updatedMonuments = [];
    for (const monument of monuments) {
      const getObjectParams = {
        Bucket: awsBucketName,
        Key: monument.cover_image,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      const updatedMonument = {
        ...monument.toObject(),
        imageUrl: url,
      };
      updatedMonuments.push(updatedMonument);
    }

    return response.status(200).json(updatedMonuments);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});
// route get one
router.get("/:id", async (request, response) => {
  try {
    const { id } = request.params;

    // Fetch monument data
    const monument = await Monument.findById(id);

    const getObjectParams = {
      Bucket: awsBucketName,
      Key: monument.cover_image,
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    const updatedMonumentItem = {
      ...monument.toObject(),
      imageUrl: url,
    };

    const user = await User.findById(monument.user); // Assuming userId is the field linking to the User table

    // Combine monument and user data into one dictionary
    const combinedData = {
      monument: updatedMonumentItem,
      userName: user.name, // Assuming 'name' is the field you want from the User table
    };

    return response.status(200).json(combinedData);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

router.get("/monument/:monumentId", async (request, response) => {
  try {
    const galleryItems = await Gallery.find({
      monumentId: request.params.monumentId,
    });

    const updatedGalleryItems = [];
    for (const galleryItem of galleryItems) {
      const getObjectParams = {
        Bucket: awsBucketName,
        Key: galleryItem.image,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      const updatedGalleryItem = {
        ...galleryItem.toObject(),
        imageUrl: url,
      };
      updatedGalleryItems.push(updatedGalleryItem);
    }
    return response.status(200).json(updatedGalleryItems);
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

//

export default router;
