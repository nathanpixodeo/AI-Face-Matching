const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    first_name: { type: String, default: null },
    last_name: { type: String, default: null },
    email: { type: String, unique: true },
    password: { type: String },
    phone: { type: Number },
    phone_prefix: { type: String },
    birthday: { type: Date },
    token: { type: String },
    area_id: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("user", userSchema);