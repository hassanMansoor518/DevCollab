import mongoose from "mongoose";
import { getResult } from "./controller/ai.controller.js";
import User from "./model/user.model.js";
import Project from "./model/project.model.js";

const DB_URL = "mongodb://DevCollab:UI3Fk9Dazwgld1BL@ac-cilty9i-shard-00-00.hvty79v.mongodb.net:27017,ac-cilty9i-shard-00-01.hvty79v.mongodb.net:27017,ac-cilty9i-shard-00-02.hvty79v.mongodb.net:27017/?ssl=true&replicaSet=atlas-iq7jho-shard-0&authSource=admin&appName=Cluster0";

async function test() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(DB_URL);
  console.log("Connected successfully!");

  const user = await User.findOne({ fullName: 'hassan' });
  console.log("User:", user?._id);

  const project = await Project.findOne();
  console.log("Project:", project?._id);

  // Mock Request & Response
  const req = {
    query: {
      prompt: "Hello",
      projectId: project?._id?.toString()
    },
    user: user
  };

  const res = {
    status(code) {
      console.log("Status Code:", code);
      return this;
    },
    json(data) {
      console.log("Response JSON:", JSON.stringify(data, null, 2));
      return this;
    }
  };

  console.log("Calling getResult...");
  try {
    await getResult(req, res);
  } catch (err) {
    console.error("getResult crashed directly:", err);
  }

  await mongoose.disconnect();
}

test().catch(console.error);
