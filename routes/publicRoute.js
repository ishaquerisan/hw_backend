import express from "express";
import Monument from "../models/monumentModel.js";
import Gallery from "../models/galleryModel.js";
import User from "../models/userModel.js";
import multer from "multer";
import fs, { copyFileSync } from "fs";
import path from "path";
import mongoose from "mongoose";

const router = express.Router();

// route get all
router.get("/", async (request, response) => {
  try {
    const monument = await Monument.find({ status: 1 });

    return response.status(200).json(monument);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// route get latest 3 only only
router.get("/latest3/", async (request, response) => {
  try {
    const monuments = await Monument.find({ status: 1 })
      .sort({ createdAt: -1 }) // Sort by creation date in descending order
      .limit(3); // Limit the result to 3 documents

    return response.status(200).json(monuments);
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
    const monumentPromise = Monument.findById(id);

    // Fetch user data
    const monument = await monumentPromise;
    const user = await User.findById(monument.user); // Assuming userId is the field linking to the User table

    // Combine monument and user data into one dictionary
    const combinedData = {
      monument: monument,
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
    // const id = "65cf253a709063993bd5362b";
    // const galleryItems = await Gallery.find({
    //   monumentId: id,
    // });
    const galleryItems = await Gallery.find({
      monumentId: request.params.monumentId,
    });
    // setTimeout(() => {
    //   console.log(galleryItems);
    // }, 500);
    return response.status(200).json(galleryItems);
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

//

export default router;
