// index.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
// import { PORT, mongoDBURL } from "./config.js"; // Import your secret key
import mongoose from "mongoose";
import monumentRoute from "./routes/monumentRoute.js";
import galleryRoute from "./routes/galleryRoute.js";
import loginRoute from "./routes/loginRoute.js";
import adminRoute from "./routes/adminRoute.js";
import publicRoute from "./routes/publicRoute.js";
import authenticateToken from "./auth/authMiddleware.js";

dotenv.config();

// import authenticateToken from "./auth/authMiddleware.js"
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("uploads"));

app.get("/", (request, response) => {
  return response.status(200).send("welcome to Historical monuments project ");
});
//authenticateToken need to added !!!!!!!!!!!!!!!!!!!!!!!!
app.use("/monuments", authenticateToken, monumentRoute);
app.use("/gallery", authenticateToken, galleryRoute);
app.use("/users", loginRoute);
app.use("/admin", authenticateToken, adminRoute);
app.use("/public", publicRoute);
mongoose
  .connect(process.env.MONGOURL)
  .then(() => {
    console.log("app connected to database");
    app.listen(process.env.PORT, () => {
      console.log(`app is listerning to port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
