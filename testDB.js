const mongoose = require("mongoose");

const uri = "mongodb+srv://admin01:OsFB7c1y1nKx64JC@cluster0.mongodb.net/notesDB?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    console.log("✅ Connected to MongoDB Atlas!");

    // Define a sample schema and model
    const testSchema = new mongoose.Schema({ name: String });
    const TestModel = mongoose.model("TestCollection", testSchema);

    // Insert a test document
    await TestModel.create({ name: "MongoDB Test Document" });

    console.log("✅ Test document inserted, 'notesDB' should now exist!");
    mongoose.connection.close();
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err.message));
