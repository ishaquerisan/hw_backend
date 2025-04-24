import multer from "multer";
import sharp from "sharp";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import e from "express";
const mStorage = multer.memoryStorage();
const upload = multer({
  storage: mStorage,
  //   limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
});

export { upload };
