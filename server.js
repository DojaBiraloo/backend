const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");



const connectDB= require("./config/db");
const userRoutes= require("./routes/userRoutes");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Load environment variables FIRST, before anything else
dotenv.config();

const PORT = process.env.PORT || 3000;

// Connect to the MONGO DB 
connectDB();

app.get("/", (req, res) =>{
    res.send("Welcome to KARMA API!")
})

// API routes
app.use("/api/users", userRoutes);

app.listen(PORT, () =>{
    console.log(`Server is running on http://localhost:${PORT}`);
})