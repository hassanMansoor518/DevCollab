import mongoose from "mongoose";
import * as ai from "./services/ai.service.js";
import User from "./model/user.model.js";
import Project from "./model/project.model.js";
import Conversation from "./model/conversation.model.js";
import AiMessage from "./model/aiMessage.model.js";

const DB_URL = "mongodb://DevCollab:UI3Fk9Dazwgld1BL@ac-cilty9i-shard-00-00.hvty79v.mongodb.net:27017,ac-cilty9i-shard-00-01.hvty79v.mongodb.net:27017,ac-cilty9i-shard-00-02.hvty79v.mongodb.net:27017/?ssl=true&replicaSet=atlas-iq7jho-shard-0&authSource=admin&appName=Cluster0";

async function test() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(DB_URL);
  console.log("Connected successfully!");

  // Find a user
  const user = await User.findOne();
  console.log("User found:", user ? { _id: user._id, fullName: user.fullName, aiSettings: user.aiSettings } : "None");

  // Find a project
  const project = await Project.findOne();
  console.log("Project found:", project ? { _id: project._id, projectName: project.projectName } : "None");

  // Find a conversation
  const conversation = await Conversation.findOne();
  console.log("Conversation found:", conversation ? { _id: conversation._id, members: conversation.members } : "None");

  // Test generateResult directly
  try {
    console.log("Testing generateResult...");
    const result = await ai.generateResult("Hi, write a one line response", null, [], user?.aiSettings);
    console.log("Result:", result);
  } catch (err) {
    console.error("generateResult Error:", err);
  }

  await mongoose.disconnect();
}

test().catch(console.error);
