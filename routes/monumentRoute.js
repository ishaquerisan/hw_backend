import express from "express";
import Monument from "../models/monumentModel.js";
import User from "../models/userModel.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import dotenv from "dotenv";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { compressAndSaveFile } from "../utils/fileHandler.js";
import { deletefilewithfoldername } from "../utils/fileHandler.js";

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

const mStorage = multer.memoryStorage();
const upload = multer({
  storage: mStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// const compressAndSaveImage = async (file) => {
//   try {
//     const randomNumber = Math.floor(Math.random() * 9000) + 1000;
//     const compressedFileName = `${
//       file.originalname.split(".")[0]
//     }${randomNumber}.jpg`;

//     const compressedImage = await sharp(file.buffer)
//       .jpeg({ quality: 30 }) // Adjust quality as per your requirement
//       .toBuffer();

//     return {
//       fileName: compressedFileName,
//       buffer: compressedImage,
//     };
//   } catch (error) {
//     throw new Error("Error compressing image");
//   }
// };

const convertImageToBase64 = (buffer) => {
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
};

router.post("/", upload.single("cover_image"), async (request, response) => {
  const uploadPath = "uploads/coverimg/";
  try {
    if (
      !request.body.title ||
      !request.body.description ||
      !request.body.nation ||
      !request.body.state ||
      !request.file ||
      !request.body.place
    ) {
      return response.status(400).send({
        message: "send all required fields: title, description, file, place",
      });
    }
    let fileName = null;

    if (request.file) {
      fileName = await compressAndSaveFile(request.file, uploadPath);
    }
    // const { fileName, buffer } = await compressAndSaveFile(request.file);

    // const params = {
    //   Bucket: awsBucketName,
    //   Key: fileName,
    //   Body: buffer,
    //   ContentType: request.file.mimetype,
    // };
    // const command = new PutObjectCommand(params);

    // await s3.send(command);

    const newmonument = {
      title: request.body.title,
      description: request.body.description,
      ipms_place: request.body.ipms_place,
      archi_imps: request.body.archi_imps,
      past_condition: request.body.past_condition,
      present_condition: request.body.present_condition,
      location: request.body.location,
      nation: request.body.nation,
      state: request.body.state,
      place: request.body.place,
      cover_image: fileName,
      user: request.user.id,
      status: 0,
    };

    const monument = await Monument.create(newmonument);

    return response.status(201).send(monument);
  } catch (error) {
    deletefilewithfoldername(request.file, uploadPath);
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

router.get("/", async (request, response) => {
  try {
    let monuments = undefined;

    const users = await User.findById(request.user.id);
    if (users.type == "user")
      monuments = await Monument.find({ user: request.user.id });
    else if (users.type == "admin") monuments = await Monument.find();
    else throw `Account Type Error. Got type : ${users.type}`;

    const updatedMonuments = [];
    for (const monument of monuments) {
      // const getObjectParams = {
      //   Bucket: awsBucketName,
      //   Key: monument.cover_image,
      // };

      // const command = new GetObjectCommand(getObjectParams);
      // const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      const updatedMonument = {
        ...monument.toObject(),
        imageUrl: "uploads/coverimg/" + monument.cover_image,
        userType: users.type,
      };
      updatedMonuments.push(updatedMonument);
    }

    const data = {
      monument: updatedMonuments,
      userType: users.type,
    };
    return response.status(200).json(data);
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});
// route get one
router.get("/:id", async (request, response) => {
  try {
    const { id } = request.params;

    const monument = await Monument.findById(id);
    if (!monument) {
      return response.status(404).send({ message: "Monument item not found" });
    }

    // const getObjectParams = {
    //   Bucket: awsBucketName,
    //   Key: monument.cover_image,
    // };
    // const command = new GetObjectCommand(getObjectParams);
    // const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    const updatedMonumentItem = {
      ...monument.toObject(),
      imageUrl: "uploads/coverimg/" + monument.cover_image,
    };

    return response.status(200).json(updatedMonumentItem);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

//update

router.put("/:id", upload.single("cover_image"), async (request, response) => {
  try {
    if (
      !request.body.title ||
      !request.body.description ||
      !request.body.nation ||
      !request.body.state ||
      !request.body.place
    ) {
      return response.status(400).send({
        message:
          "send all required fields: title, shortdescription, description, nation, state, place",
      });
    }

    const { id } = request.params;
    const monument = await Monument.findById(id);

    if (!monument) {
      return response.status(404).json({ message: "Monument is not found" });
    }

    let oldCoverImage = monument.cover_image;

    let fileName = oldCoverImage;

    if (request.file) {
      const uploadPath = "uploads/coverimg/";
      fileName = await compressAndSaveFile(request.file, uploadPath);
      deletefilewithfoldername(oldCoverImage, uploadPath);

      // const params = {
      //   Bucket: awsBucketName,
      //   Key: fileName,
      //   Body: buffer,
      //   ContentType: request.file.mimetype,
      // };

      // const command = new PutObjectCommand(params);

      // await s3.send(command);

      // const deleteOldParams = {
      //   Bucket: awsBucketName,
      //   Key: oldCoverImage,
      // };

      // const deleteOldCommand = new DeleteObjectCommand(deleteOldParams);
      // await s3.send(deleteOldCommand);
    }

    monument.title = request.body.title;
    monument.shortdescription = request.body.shortdescription;
    monument.description = request.body.description;
    monument.nation = request.body.nation;
    monument.state = request.body.state;
    monument.place = request.body.place;
    monument.location = request.body.location;
    monument.hst_chronology = request.body.hst_chronology;
    monument.ipms_place = request.body.ipms_place;
    monument.past_condition = request.body.past_condition;
    monument.present_condition = request.body.present_condition;
    monument.archi_imps = request.body.archi_imps;
    monument.cover_image = fileName;
    monument.status = 0;

    await monument.save();

    return response
      .status(200)
      .json({ message: "Monument updated successfully" });
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

//delete
router.delete("/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const monument = await Monument.findByIdAndDelete(id);
    if (!monument) {
      return response.status(404).json({ mesage: "monument not found " });
    }
    const deleteParams = {
      Bucket: awsBucketName,
      Key: monument.cover_image,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3.send(command);

    return response
      .status(200)
      .json({ mesage: "monument deleted success fully " });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

export default router;
