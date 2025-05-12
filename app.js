require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const connectDB = require("./db");

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_local_dev';

// Enhanced Logging Middleware
const loggingMiddleware = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);

// Serve static files and handle SPA routing
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
connectDB();

// Authentication Middleware with Enhanced Logging
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
        console.error("No token provided");
        return res.status(401).json({ 
            message: "No token, authorization denied",
            error: "Token is missing" 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        console.log(`Authenticated user ID: ${req.userId}`);
        next();
    } catch (error) {
        console.error("Token verification error:", error.message);
        res.status(401).json({ 
            message: "Token is not valid",
            error: error.message 
        });
    }
};

// Health Check (for Elastic Beanstalk)
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "ok", 
        timestamp: new Date().toISOString() 
    });
});

// User Schema with Validation
const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, "Username is required"],
        unique: true,
        trim: true,
        minlength: [3, "Username must be at least 3 characters long"],
        maxlength: [20, "Username must be less than 20 characters"]
    },
    password: { 
        type: String, 
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"]
    },
    email: { 
        type: String, 
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"]
    }
});

const User = mongoose.model("User", userSchema);

// Notes Schema with Enhanced Validation
const noteSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, "Title is required"],
        trim: true,
        maxlength: [100, "Title must be less than 100 characters"]
    },
    content: { 
        type: String, 
        required: [true, "Content is required"],
        trim: true
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: [true, "User ID is required"]
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const Note = mongoose.model("Note", noteSchema);

// Signup Route with Comprehensive Error Handling
app.post("/signup", async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        // Validate input
        if (!username || !password || !email) {
            return res.status(400).json({ 
                message: "All fields are required",
                missingFields: Object.keys(req.body).filter(key => !req.body[key])
            });
        }

        // Check for existing user
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });
        
        if (existingUser) {
            const conflictField = existingUser.username === username ? "username" : "email";
            return res.status(409).json({ 
                message: `${conflictField.charAt(0).toUpperCase() + conflictField.slice(1)} already exists`,
                conflictField 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create new user
        const user = new User({ 
            username, 
            password: hashedPassword, 
            email 
        });
        
        await user.save();
        
        console.log(`User ${username} registered successfully`);
        
        res.status(201).json({ 
            message: "User registered successfully. Please login.", 
            userId: user._id 
        });
    } catch (error) {
        console.error("Signup Error:", error);
        
        // Handle Mongoose validation errors
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: "Validation Error", 
                errors 
            });
        }
        
        res.status(500).json({ 
            error: "Internal Server Error",
            details: error.message 
        });
    }
});

// Login Route with Enhanced Error Handling
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ 
                message: "Username and password are required",
                missingFields: Object.keys(req.body).filter(key => !req.body[key])
            });
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ 
                message: "User not found",
                field: "username" 
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                message: "Invalid credentials",
                field: "password" 
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id }, 
            JWT_SECRET, 
            { expiresIn: "1h" }
        );

        console.log(`User ${username} logged in successfully`);
        
        res.json({ 
            token, 
            userId: user._id, 
            username: user.username,
            message: "Login successful" 
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ 
            error: "Internal Server Error",
            details: error.message 
        });
    }
});

// Note Routes with Comprehensive Error Handling
app.post("/notes", authMiddleware, async (req, res) => {
    try {
        const { title, content } = req.body;
        const userId = req.userId;

        // Validate input
        if (!title || !content) {
            return res.status(400).json({ 
                message: "Title and content are required",
                missingFields: Object.keys(req.body).filter(key => !req.body[key])
            });
        }

        const newNote = new Note({ 
            title, 
            content, 
            userId 
        });
        
        await newNote.save();
        
        console.log(`Note created for user ${userId}`);
        
        res.status(201).json({ 
            message: "Note added successfully", 
            note: newNote 
        });
    } catch (error) {
        console.error("Note Creation Error:", error);
        
        // Handle Mongoose validation errors
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: "Validation Error", 
                errors 
            });
        }
        
        res.status(500).json({ 
            error: "Internal Server Error",
            details: error.message 
        });
    }
});

// Get Notes with Enhanced Error Handling
app.get("/notes", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        
        console.log(`Fetching notes for user: ${userId}`);
        
        const notes = await Note.find({ userId })
            .sort({ createdAt: -1 }); // Sort by most recent first
        
        console.log(`Found ${notes.length} notes for user ${userId}`);
        
        res.json({
            notes,
            count: notes.length,
            message: notes.length > 0 
                ? "Notes retrieved successfully" 
                : "No notes found"
        });
    } catch (error) {
        console.error("Fetch Notes Error:", error);
        res.status(500).json({ 
            error: "Internal Server Error",
            details: error.message 
        });
    }
});

// Update Note Route
app.put("/notes/:id", authMiddleware, async (req, res) => {
    try {
        const { title, content } = req.body;
        const noteId = req.params.id;
        const userId = req.userId;

        // Validate input
        if (!title || !content) {
            return res.status(400).json({ 
                message: "Title and content are required",
                missingFields: Object.keys(req.body).filter(key => !req.body[key])
            });
        }

        // Find and update note, ensuring user owns the note
        const updatedNote = await Note.findOneAndUpdate(
            { _id: noteId, userId },
            { title, content },
            { 
                new: true,
                runValidators: true 
            }
        );

        if (!updatedNote) {
            return res.status(404).json({ 
                message: "Note not found or unauthorized",
                noteId 
            });
        }

        console.log(`Note ${noteId} updated for user ${userId}`);
        
        res.json({ 
            message: "Note updated successfully", 
            note: updatedNote 
        });
    } catch (error) {
        console.error("Update Note Error:", error);
        res.status(500).json({ 
            error: "Internal Server Error",
            details: error.message 
        });
    }
});

// Delete Note Route
app.delete("/notes/:id", authMiddleware, async (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.userId;

        const deletedNote = await Note.findOneAndDelete({ 
            _id: noteId, 
            userId 
        });

        if (!deletedNote) {
            return res.status(404).json({ 
                message: "Note not found or unauthorized",
                noteId 
            });
        }

        console.log(`Note ${noteId} deleted for user ${userId}`);
        
        res.json({ 
            message: "Note deleted successfully", 
            deletedNote 
        });
    } catch (error) {
        console.error("Delete Note Error:", error);
        res.status(500).json({ 
            error: "Internal Server Error",
            details: error.message 
        });
    }
});

// Serve index.html for all client-side routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Closing MongoDB connection...`);
    try {
        await mongoose.connection.close();
        console.log("✅ MongoDB connection closed.");
        process.exit(0);
    } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
    }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Start the server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; // For potential testing



























  
