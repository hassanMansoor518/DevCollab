const SystemActivity = require("../model/systemActivity.model");

const logActivity = async ({ type, title, description, metadata = {} }) => {
  try {
    const activity = new SystemActivity({
      type,
      title,
      description,
      metadata
    });
    await activity.save();
    return activity;
  } catch (error) {
    console.error("Failed to log system activity:", error);
  }
};

module.exports = { logActivity };
