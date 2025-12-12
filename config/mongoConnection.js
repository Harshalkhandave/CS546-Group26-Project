import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://harshalkhandave19_db_user:NdlOn3UpsnzGKKpW@cluster0.izltwpm.mongodb.net/DeepSip",
      {}
    );
    console.log("MongoDB connected!");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected!");
  } catch (error) {
    console.error("MongoDB disconnection failed:", error.message);
  }
};

export default connectDB;
