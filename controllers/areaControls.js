const AreaModel = require('../models/area');
const resConst = require("../constants/res.data")

const createAreaDataStore = async (req, res, next) => {
    const { name, notes } = req.body;
    let resData = resConst;
    const oldArea = await AreaModel.findOne({ name });
    if (oldArea) {
        resData.error = true;
        resData.message = "Area Name Already Exist!";
        return res.status(409).send(resData);
    }
    const area = await AreaModel.create({
        name,
        notes
    });
    if (area) {
        resData.error = false
        resData.message = "Area Created Successfully!"
    }
    res.json(resData);
}

module.exports = {
    createAreaDataStore
};