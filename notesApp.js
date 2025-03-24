require("dotenv").config();
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const connectDB = require("./db");

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret"; // Use environment variable

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
connectDB();

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
});

const User = mongoose.model("User", userSchema);

// Notes Schema
const noteSchema = new mongoose.Schema({
    title: String,
    content: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Note = mongoose.model("Note", noteSchema);

// Register User
app.post("/signup", async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "Username already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, email });
        await user.save();
        res.json({ message: "User registered successfully. Please login." });
    } catch (error) {
        res.status(500).json({ error: "Error registering user" });
    }
});

// Login User
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ token, userId: user._id, message: "Login successful." });
    } catch (error) {
        res.status(500).json({ error: "Error logging in" });
    }
});

// Create a new note
app.post("/notes", async (req, res) => {
    try {
        const { title, content, userId } = req.body;
        const newNote = new Note({ title, content, userId });
        await newNote.save();
        res.json({ message: "Note added successfully", note: newNote });
    } catch (error) {
        res.status(500).json({ error: "Error adding note" });
    }
});

// Get user notes
app.get("/notes/:userId", async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.params.userId });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: "Error fetching notes" });
    }
});

// Update a note
app.put("/notes/:id", async (req, res) => {
    try {
        const { title, content } = req.body;
        const updatedNote = await Note.findByIdAndUpdate(req.params.id, { title, content }, { new: true });
        res.json({ message: "Note updated successfully", note: updatedNote });
    } catch (error) {
        res.status(500).json({ error: "Error updating note" });
    }
});

// Delete a note
app.delete("/notes/:id", async (req, res) => {
    try {
        await Note.findByIdAndDelete(req.params.id);
        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting note" });
    }
});

// Get user profile
app.get("/profile/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select("-password");
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Error fetching profile" });
    }
});

// Update user profile
app.put("/profile/:userId", async (req, res) => {
    try {
        const { username, email } = req.body;
        const updatedUser = await User.findByIdAndUpdate(req.params.userId, { username, email }, { new: true });
        res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: "Error updating profile" });
    }
});

// Start the server (✅ Only Once)
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});




























  
// mongoose.connect("mongodb://127.0.0.1:27017/notesDB", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => {
//     console.log("Connected to MongoDB");
// }).catch((err) => {
//     console.error("MongoDB connection error:", err);
// });

// // Serve HTML file
// app.get("/", (req, res) => {
//     res.sendFile(path.join(__dirname, "public", "index.html"));
// });

// // User Schema
// const userSchema = new mongoose.Schema({
//     username: String,
//     password: String,
//     email: String,
// });

// const User = mongoose.model("User", userSchema);

// // Notes Schema
// const noteSchema = new mongoose.Schema({
//     title: String,
//     content: String,
//     userId: mongoose.Schema.Types.ObjectId
// });

// const Note = mongoose.model("Note", noteSchema);

// // Register User
// app.post("/signup", async (req, res) => {
//     const { username, password, email } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ username, password: hashedPassword, email });
//     await user.save();
//     res.json({ message: "User registered successfully. Please login." });
// });

// // Login User
// app.post("/login", async (req, res) => {
//     const { username, password } = req.body;
//     const user = await User.findOne({ username });
//     if (!user) return res.status(400).json({ message: "User not found" });
    
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    
//     const token = jwt.sign({ userId: user._id }, "secret", { expiresIn: "1h" });
//     res.json({ token, userId: user._id, message: "Login successful. Redirecting to app..." });
// });

// // Create a new note
// app.post("/notes", async (req, res) => {
//     const { title, content, userId } = req.body;
//     try {
//         const newNote = new Note({ title, content, userId });
//         await newNote.save();
//         res.json({ message: "Note added successfully", note: newNote });
//     } catch (error) {
//         res.status(500).json({ error: "Error adding note" });
//     }
// });

// // Get user notes
// app.get("/notes/:userId", async (req, res) => {
//     try {
//         const notes = await Note.find({ userId: req.params.userId });
//         res.json(notes);
//     } catch (error) {
//         res.status(500).json({ error: "Error fetching notes" });
//     }
// });

// // Update a note
// app.put("/notes/:id", async (req, res) => {
//     const { title, content } = req.body;
//     try {
//         const updatedNote = await Note.findByIdAndUpdate(req.params.id, { title, content }, { new: true });
//         res.json({ message: "Note updated successfully", note: updatedNote });
//     } catch (error) {
//         res.status(500).json({ error: "Error updating note" });
//     }
// });

// // Delete a note
// app.delete("/notes/:id", async (req, res) => {
//     try {
//         await Note.findByIdAndDelete(req.params.id);
//         res.json({ message: "Note deleted successfully" });
//     } catch (error) {
//         res.status(500).json({ error: "Error deleting note" });
//     }
// });

// // Get user profile
// app.get("/profile/:userId", async (req, res) => {
//     try {
//         const user = await User.findById(req.params.userId).select("-password");
//         res.json(user);
//     } catch (error) {
//         res.status(500).json({ error: "Error fetching profile" });
//     }
// });

// // Update user profile
// app.put("/profile/:userId", async (req, res) => {
//     const { username, email } = req.body;
//     try {
//         const updatedUser = await User.findByIdAndUpdate(req.params.userId, { username, email }, { new: true });
//         res.json({ message: "Profile updated successfully", user: updatedUser });
//     } catch (error) {
//         res.status(500).json({ error: "Error updating profile" });
//     }
// });

// // Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });