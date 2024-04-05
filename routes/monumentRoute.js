import express from "express";
import Monument from "../models/monumentModel.js";
import User from "../models/userModel.js";
import multer from "multer";
import fs, { copyFileSync } from "fs";
import path from "path";
import mongoose from "mongoose";

const router = express.Router();
import sharp from "sharp";

const storage = multer.memoryStorage(); // Use memory storage to process image with Sharp
const upload = multer({ storage: storage });
const compressAndSaveImage = async (file) => {
  try {
    //Generate a random number between 1000 and 9999
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;
    const compressedFileName = `${
      file.originalname.split(".")[0] + randomNumber
    }.jpg`;
    const compressedImageFilePath = `uploads/coverimg/${compressedFileName}`;

    await sharp(file.buffer)
      .jpeg({ quality: 30 }) // Adjust quality as per your requirement
      .toFile(compressedImageFilePath);

    return compressedFileName;
  } catch (error) {
    throw new Error("Error compressing image");
  }
};

router.post("/", upload.single("cover_image"), async (request, response) => {
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

    const compressedImageFile = await compressAndSaveImage(request.file);
    const imagename = `/coverimg/${compressedImageFile}`;

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
      cover_image: imagename, // Use compressed image path
      user: request.user.id,
      status: 0,
    };

    const monument = await Monument.create(newmonument);

    return response.status(201).send(monument);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});
// route get all
router.get("/", async (request, response) => {
  try {
    let monument = undefined;

    const users = await User.findById(request.user.id);
    if (users.type == "user")
      monument = await Monument.find({ user: request.user.id });
    else if (users.type == "admin") monument = await Monument.find();
    else throw `Account Type Error. Got type : ${users.type}`;

    const data = {
      monument: monument,
      userType: users.type,
    };
    return response.status(200).json(data);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});
// route get one
router.get("/:id", async (request, response) => {
  try {
    const { id } = request.params;

    const monument = await Monument.findById(id);

    return response.status(200).json(monument);
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
          "send all required fields : title , shortdescription , description",
      });
    }
    const { id } = request.params;
    const monument = await Monument.findById(id);
    if (!monument) {
      return response.status(404).json({ message: "Monument is not found" });
    }

    // Check if a new image or video is uploaded
    if (request.file) {
      // Delete previous image or video if exists
      if (monument.cover_image) {
        const imagePath = path.join(
          "uploads",
          "coverimg",
          monument.cover_image
        );
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Error deleting image:", err);
          } else {
            console.log("Image deleted successfully");
          }
        });
      }

      const compressedImageFile = await compressAndSaveImage(request.file);
      const imagename = `/coverimg/${compressedImageFile}`;
      monument.cover_image = imagename; // Update image or video path with new file
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
    monument.status = 0;
    // Save the updated monument
    await monument.save();

    // const result = await Monument.findByIdAndUpdate(id, request.body);
    // if (!result) {
    //   return response.status(404).json({ mesage: "monument not found " });
    // }
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
    const result = await Monument.findByIdAndDelete(id);
    if (!result) {
      return response.status(404).json({ mesage: "monument not found " });
    }

    const imagePath = path.join("uploads", "coverimg", result.cover_image);
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error("Error deleting image:", err);
      } else {
        console.log("Image deleted successfully");
      }
    });

    return response
      .status(200)
      .json({ mesage: "monument deleted success fully " });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

export default router;
