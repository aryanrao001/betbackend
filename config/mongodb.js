import mongoose from 'mongoose';

const connectDB = async () => {
  console.log("🛠️ Trying to connect to MongoDB...");  // Log here to check if function is called

  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/betapp`);

    console.log("✅ Connection attempt successful");

    mongoose.connection.on('connected', () => {
      console.log("✅ MongoDB connected successfully");
    });

    mongoose.connection.on('error', (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log("⚠️ MongoDB disconnected");
    });
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);  // Exit the app if DB connection fails
  }
};

export default connectDB;
