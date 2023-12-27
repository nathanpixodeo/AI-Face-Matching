const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);

const areaSchema = new mongoose.Schema({
    a_id: {
        type: Number,
    },
    name: {
        type: String,
        required: true,
        unique: true,
    },
    notes: {
        type: String
    },
    status: {
        type: Number,
        default: 1
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

areaSchema.plugin(AutoIncrement, { id: 'a_id_seq', inc_field: 'a_id' });

module.exports = mongoose.model("area", areaSchema);
