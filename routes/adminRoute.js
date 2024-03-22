import express from "express";
import Monument from "../models/monumentModel.js";
import User from "../models/userModel.js";
import multer from "multer";
import fs, { copyFileSync } from "fs";
import path from "path";

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/coverimg/");
  },
  filename: function (req, file, cb) {
    // Generate a random number between 1000 and 9999
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;
    // Append the random number to the original filename
    const modifiedFilename = randomNumber + "-" + file.originalname;
    cb(null, modifiedFilename);
  },
});

const upload = multer({ storage: storage });

// route get all
router.get("/", async (request, response) => {
  try {
    const monument = await Monument.find();

    return response.status(200).json(monument);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// verify
router.put("/verify/:id", async (request, response) => {
  try {
    const users = await User.findById(request.user.id);
    console.log(users.type);
    if (users.type == "user")
      return response
        .status(403)
        .json({ message: "Verification is not allowed for user" });

    const { id } = request.params;

    const monument = await Monument.findById(id);
    if (!monument) {
      return response.status(404).json({ message: "Monument is not found" });
    }

    monument.status = 1;
    await monument.save();
    return response
      .status(200)
      .json({ message: "Monument verified successfully" });
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

// unverify
router.put("/unverify/:id", async (request, response) => {
  try {
    const users = await User.findById(request.user.id);
    if (users.type == "user")
      return response
        .status(404)
        .json({ message: "Verification is not allowed for user" });

    const { id } = request.params;

    const monument = await Monument.findById(id);
    if (!monument) {
      return response.status(404).json({ message: "Monument is not found" });
    }

    monument.status = 0;
    await monument.save();
    return response
      .status(200)
      .json({ message: "Monument successfully  unverified" });
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
