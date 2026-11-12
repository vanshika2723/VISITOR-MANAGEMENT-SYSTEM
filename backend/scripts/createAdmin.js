
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const createAdmin = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Admin environment variables are missing.");
    }

    if (ADMIN_PASSWORD.length < 8) {
      throw new Error("Admin password must be at least 8 characters.");
    }

    await connectDB();

    const existingAdmin = await User.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      console.log("An Admin account already exists.");
      return;
    }

    const existingUser = await User.findOne({
      email: ADMIN_EMAIL.trim().toLowerCase(),
    });

    if (existingUser) {
      console.log("This email is already registered.");
      return;
    }

    const admin = await User.create({
      name: ADMIN_NAME.trim(),
      email: ADMIN_EMAIL.trim().toLowerCase(),
      password: ADMIN_PASSWORD,
      role: "admin",
      isActive: true,
    });

    console.log("--------------------------------");
    console.log("ADMIN ACCOUNT CREATED SUCCESSFULLY");
    console.log("Name:", admin.name);
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
    console.log("--------------------------------");
  } catch (error) {
    console.error("Admin Creation Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
