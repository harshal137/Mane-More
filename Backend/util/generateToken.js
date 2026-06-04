import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const generateToken = (res, userId, cookieName = "jwt") =>{
  const jwtSecret = process.env.JWT_SECRET || process.env.JWT_SEC;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, jwtSecret, {
    expiresIn: "10d",
  });

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 10 * 24 * 60 * 60 * 1000,
  });
};

export default generateToken;
