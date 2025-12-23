// ✅ Load environment variables FIRST, before anything else
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB= require("./config/db");
const userRoutes= require("./routes/userRoutes");
const productRoutes= require("./routes/productRoutes");
const cartRoutes= require("./routes/cartRoutes");

const app = express();

// CORS should be before body parsing
app.use(cors());

// Body parsing middleware - must be before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
    if (req.path.includes('/login') || req.path.includes('/register')) {
        console.log(`\n=== ${req.method} ${req.path} ===`);
        console.log('Content-Type header:', req.headers['content-type']);
        console.log('All headers:', JSON.stringify(req.headers, null, 2));
    }
    next();
});

const PORT = process.env.PORT || 3000;

// Connect to the MONGO DB 
connectDB();

app.get("/", (req, res) =>{
    res.send("Welcome to KARMA API!")
})

// API routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

app.listen(PORT, () =>{
    console.log(`Server is running on http://localhost:${PORT}`);
})