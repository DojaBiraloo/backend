const mongoose = require("mongoose");

const connectDB = async() =>{
    try{
        if(!process.env.MONGO_URI){
            throw new Error("MONGO_URI is not defined in environment variables. Please check your .env file.");
        }
        console.log("Attempting to connect to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
        
    }catch(err){
        console.error("MongoDB connection failed:", err.message);
        console.error("Full error:", err);
        process.exit(1);
    }
};

module.exports= connectDB;