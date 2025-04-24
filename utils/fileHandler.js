// const sharp = require("sharp");
// const path = require("path");
// const fs = require("fs");

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import sharp from "sharp";
dotenv.config();
const compressAndSaveFile = async (file, uploadPath) => {
  try {
    const date = Date.now() + "-";
    let processedFileName = `${date}${file.originalname}`;
    let processedFile = file.buffer;

    // const ext = path.extname(file.originalname).toLowerCase();

    if (file.mimetype.startsWith("image")) {
      // Compress image
      processedFileName = `${date}${file.originalname.split(".")[0]}.jpg`;
      processedFile = await sharp(file.buffer).jpeg({ quality: 30 }).toBuffer();
    }

    const filePath = path.join(uploadPath, processedFileName);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    fs.writeFileSync(filePath, processedFile);

    return processedFileName;
  } catch (error) {
    console.error("Error processing file:", error);
    throw new Error("Error processing file");
  }
};
const compressAndSaveImageorVideo = async (file, uploadPath) => {
  try {
    const date = Date.now() + "-";
    let processedFileName = `${date}${file.originalname}`;
    let processedFile = file.buffer;

    // const ext = path.extname(file.originalname).toLowerCase();

    if (file.mimetype.startsWith("video")) {
      // Handle video compression if needed
      // For now, we're just returning the original video file without compression
      processedFileName = `${date}${file.originalname.split(".")[0]}.mp4`;
      processedFile = file.buffer;
    } else if (file.mimetype.startsWith("image")) {
      // Compress image
      processedFileName = `${date}${file.originalname.split(".")[0]}.jpg`;
      processedFile = await sharp(file.buffer).jpeg({ quality: 30 }).toBuffer();
    }

    const filePath = path.join(uploadPath, processedFileName);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    fs.writeFileSync(filePath, processedFile);
    return processedFileName;
  } catch (error) {
    console.error("Error processing file:", error);
    throw new Error("Error processing file");
  }
};
const deletefilewithfoldername = async (filename, foldername) => {
  try {
    if (filename) {
      const filePath = path.join(foldername, filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log("Deleted file:", filePath);
      }
    }
  } catch (err) {
    console.error("Error cleaning up " + foldername + " files:", err);
  }
};
export {
  compressAndSaveFile,
  compressAndSaveImageorVideo,
  deletefilewithfoldername,
};
// module.exports = {
//   compressAndSaveFile,
//   deletefilewithfoldername,
// };
