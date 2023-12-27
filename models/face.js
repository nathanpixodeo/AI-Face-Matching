const mongoose = require("mongoose");

const faceSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
    },
    descriptions: {
        type: Array,
        required: true,
    },
    phone: {
        type: String
    },
    birthday: {
        type: Date
    },
    notes: {
        type: String
    }
});

module.exports = mongoose.model("face", faceSchema);
