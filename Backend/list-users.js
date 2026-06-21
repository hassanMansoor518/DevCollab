import mongoose from "mongoose";
import User from "./model/user.model.js";

const DB_URL = "mongodb://DevCollab:UI3Fk9Dazwgld1BL@ac-cilty9i-shard-00-00.hvty79v.mongodb.net:27017,ac-cilty9i-shard-00-01.hvty79v.mongodb.net:27017,ac-cilty9i-shard-00-02.hvty79v.mongodb.net:27017/?ssl=true&replicaSet=atlas-iq7jho-shard-0&authSource=admin&appName=Cluster0";

async function test() {
  await mongoose.connect(DB_URL);
  const users = await User.find({}, 'fullName email aiSettings');
  console.log("Users and AI settings:");
  console.log(JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}

test().catch(console.error);
