const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://fazeelabtl:SOtyrZokcPqUFO4H@notes-cluster.ti2mn.mongodb.net/?appName=notes-cluster";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. Successfully connected to MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
  } finally {
    await client.close();
  }
}

run();
