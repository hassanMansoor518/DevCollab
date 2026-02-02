const mongoose = require("mongoose");

function connectDB() {
    mongoose.connect(process.env.DB_URL)
        .then(() => {
            console.log("Database is connected");
        })
        .catch((error) => {
            console.log("No connection", error);
        });
}

module.exports = connectDB;
