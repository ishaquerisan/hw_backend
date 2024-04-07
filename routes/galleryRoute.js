import express from "express";
import multer from "multer";
import Gallery from "../models/galleryModel.js";
import fs from "fs";
import path from "path";

const router = express.Router();

import sharp from "sharp";

// Memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Compress and save function for both image and video
const compressAndSaveFile = async (file) => {
  try {
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;
    let compressedFileName;

    let compressedFile;

    if (file.mimetype.startsWith("video")) {
      // Handle video compression if needed
      // For now, we're just returning the original video file without compression
      compressedFileName = `${
        file.originalname.split(".")[0]
      }${randomNumber}.mp4`;
      compressedFile = file.buffer;
    } else {
      compressedFileName = `${
        file.originalname.split(".")[0]
      }${randomNumber}.jpg`;
      compressedFile = await sharp(file.buffer)
        .jpeg({ quality: 30 })
        .toBuffer();
    }

    return {
      fileName: compressedFileName,
      buffer: compressedFile,
    };
  } catch (error) {
    throw new Error("Error compressing file");
  }
};
// Convert buffer to Base64
const convertToBase64 = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString("base64")}`;
};

// POST route to add a new gallery item
router.post(
  "/:monumentId",
  upload.single("image"),
  async (request, response) => {
    try {
      if (!request.body.imgTitle || !request.file) {
        return response.status(400).send({
          message: "Send all required fields: imgTitle, image",
        });
      }
      const { fileName, buffer } = await compressAndSaveFile(request.file);
      const base64Image = convertToBase64(buffer, request.file.mimetype);
      // Construct the new gallery item object
      const newGalleryItem = {
        monumentId: request.params.monumentId,
        imgTitle: request.body.imgTitle,
        image: base64Image,
      };

      // Create a new gallery item using Mongoose model
      const galleryItem = await Gallery.create(newGalleryItem);

      return response.status(201).json(galleryItem);
    } catch (error) {
      console.error(error.message);
      return response.status(500).send({ message: "Internal Server Error" });
    }
  }
);

// GET route to retrieve  gallery items for monument
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

// GET route to retrieve a specific gallery item by ID
router.get("/:id", async (request, response) => {
  try {
    const galleryItem = await Gallery.findById(request.params.id);
    if (!galleryItem) {
      return response.status(404).send({ message: "Gallery item not found" });
    }
    return response.status(200).json(galleryItem);
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

router.put("/:id", upload.single("image"), async (request, response) => {
  try {
    let galleryItem = await Gallery.findById(request.params.id);

    if (!galleryItem) {
      return response.status(404).json({ message: "Gallery item not found" });
    }
    const { fileName, buffer } = await compressAndSaveImage(request.file);
    const base64Image = convertImageToBase64(buffer);
    if (request.file) {
      if (galleryItem.image) {
        const imagePath = path.join("uploads", galleryItem.image);
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Error deleting image:", err);
          } else {
            console.log("Image deleted successfully");
          }
        });
      }
      galleryItem.image = base64Image;
    }

    // Update other fields if provided
    if (request.body.imgTitle) {
      galleryItem.imgTitle = request.body.imgTitle;
    }

    //   if (image) {
    //     galleryItem.image = image;
    //   }
    // Save the updated gallery item
    galleryItem = await galleryItem.save();

    return response.status(200).json(galleryItem);
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

// DELETE route to delete a specific gallery item by ID
router.delete("/:id", async (request, response) => {
  try {
    const galleryItem = await Gallery.findByIdAndDelete(request.params.id);
    if (!galleryItem) {
      return response.status(404).send({ message: "Gallery item not found" });
    }

    const imagePath = path.join("uploads", galleryItem.image);
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error("Error deleting image:", err);
      } else {
        console.log("Image deleted successfully");
      }
    });

    return response
      .status(200)
      .send({ message: "Gallery item deleted successfully" });
  } catch (error) {
    console.error(error.message);
    return response.status(500).send({ message: "Internal Server Error" });
  }
});

export default router;
