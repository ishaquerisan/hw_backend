import jwt from "jsonwebtoken";
import dotenv from "dotenv";
// import { secretKey } from "../config.js";

dotenv.config();

// Middleware function to authenticate JWT tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(401).send({ message: "Unauthorized" });

  jwt.verify(token, process.env.JWTSECRET, (err, user) => {
    if (err) return res.status(403).send({ message: "Forbidden" });
    req.user = user;
    next();
  });
}

export default authenticateToken;
