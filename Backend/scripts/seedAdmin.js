import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

const [, , emailArg, passwordArg, ...nameParts] = process.argv;

const seedAdmin = async () => {
  try {
    const adminEmail = emailArg || process.env.ADMIN_EMAIL;
    const adminPassword = passwordArg || process.env.ADMIN_PASSWORD;
    const adminName = nameParts.join(" ").trim() || process.env.ADMIN_NAME || "Admin User";

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    if (!adminEmail || !adminPassword) {
      throw new Error(
        "Admin email and password are required. Use ADMIN_EMAIL/ADMIN_PASSWORD in .env or pass them as arguments."
      );
    }

    if (adminPassword.length < 6) {
      throw new Error("Admin password should be at least 6 characters long");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const normalizedEmail = adminEmail.trim().toLowerCase();
    let admin = await User.findOne({ email: normalizedEmail });

    if (admin) {
      admin.name = adminName;
      admin.password = adminPassword;
      admin.role = "admin";
      await admin.save();
      console.log("Admin user updated successfully");
    } else {
      admin = await User.create({
        name: adminName,
        email: normalizedEmail,
        password: adminPassword,
        role: "admin",
      });
      console.log("Admin user created successfully");
    }

    console.log(`Admin email: ${admin.email}`);
    console.log("Admin password: [hidden]");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error.message || error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
