const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const {protect} = require("../middleware/authMiddleware");

const router= express.Router();

// @route POST/api/users/register
//@desc Register a new user
// access Public

router.post("/register", async(req, res) =>{
    const {name, email, password} = req.body;

    try{
        // Validate input
        if(!name || !email || !password){
            return res.status(400).json({message: "Please provide all fields (name, email, password)"});
        }

        // Registration logic
        let user = await User.findOne({email});

        if(user) return res.status(400).json({message: "User already exists"});

        user = new User({name, email, password});
        await user.save();

    //    Create JWT Payload
    const payload = {user: {id:user._id, role: user.role}};

    // Sign and return the token along with user data
    if(!process.env.JWT_SECRET){
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    
    // Use promise-based jwt.sign instead of callback
    const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "40h"});

    // Send the user and token in response
    res.status(201).json({
        user:{
            _id:user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        token,
    });

    }catch(error){
        console.error("Registration Error:", error);
        console.error("Error Stack:", error.stack);
        res.status(500).json({
            message: "Server Error",
            error: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
})

// @route POST/api/users/login
// @desc Authenticate User
// @access Public
router.post("/login", async (req, res) =>{
    try{
        // Debug logging
        console.log("Login request received");
        console.log("req.body:", req.body);
        console.log("req.body type:", typeof req.body);
        console.log("Content-Type:", req.headers['content-type']);
        console.log("req.body keys:", req.body ? Object.keys(req.body) : 'req.body is null/undefined');

        // Validate input - check if body exists and has required fields
        const {email, password} = req.body || {};

        if(!email || !password){
            return res.status(400).json({
                message: "Please provide email and password",
                received: req.body,
                emailProvided: !!email,
                passwordProvided: !!password,
                bodyKeys: req.body ? Object.keys(req.body) : []
            });
        }

        // Find the user with email
        let user= await User.findOne({email});

        if(!user) return res.status(400).json({message: "Invalid Credentials"});
        const isMatch = await user.matchPassword(password);

        if(!isMatch) return res.status(400).json({message: "Invalid Credentials"});

          const payload = {user: {id:user._id, role: user.role}};

    // Sign and return the token along with user data
    if(!process.env.JWT_SECRET){
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    
    // Use promise-based jwt.sign instead of callback
    const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "40h"});

    // Send the user and token in response
    res.json({
        user:{
            _id:user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        token,
    });

    }catch(error){
        console.error("Login Error:", error);
        console.error("Error Stack:", error.stack);
        res.status(500).json({
            message: "Server Error",
            error: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
})

// @rout GET /api/Users/profile
// @desc Get logged in users profile (Protected Route)
// @access Private

router.get("/profile",protect, async (req, res) =>{
    res.json(req.user);
})
module.exports = router;