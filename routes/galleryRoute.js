import express from "express";
import multer from "multer";
import Gallery from "../models/galleryModel.js";
import fs from "fs";
import path from "path";

const router = express.Router();

import sharp from "sharp";

const storage = multer.memoryStorage(); // Use memory storage to process image with Sharp
const upload = multer({ storage: storage });

const compressAndSaveImage = async (file) => {
  try {
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;
    const compressedFileName = `${
      file.originalname.split(".")[0]
    }${randomNumber}.jpg`;

    const compressedImage = await sharp(file.buffer)
      .jpeg({ quality: 30 }) // Adjust quality as per your requirement
      .toBuffer();

    return {
      fileName: compressedFileName,
      buffer: compressedImage,
    };
  } catch (error) {
    throw new Error("Error compressing image");
  }
};

const convertImageToBase64 = (buffer) => {
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
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
      const { fileName, buffer } = await compressAndSaveImage(request.file);
      const base64Image = convertImageToBase64(buffer);

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
