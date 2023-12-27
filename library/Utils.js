const moment = require('moment');
const path = require('path');
const fs = require('fs');


const uploadStorageFile = async (files) => {
    const data = await Promise.all(files.map(async (file, i) => {
        let extension = path.extname(file.name);
        let filename = moment().unix() + i + makeid(3);
        await file.mv(`${appRoot}/uploads/${filename + extension}`, function(err) {
            if (err) {
                console.log('err', err);
            }
        });
        return `/uploads/${filename + extension}`;
    }));
    return data;
}


const calcPercentByDistance = async (face_distance, face_match_threshold = 0.6) => {
    if (face_distance > face_match_threshold) {
        range = (1 - face_match_threshold)
        linear_val = (1 - face_distance) / (range * 2)
        return linear_val * 100
    } else {
        range = face_match_threshold
        linear_val = 1.0 - (face_distance / (range * 2))
        return (linear_val + ((1 - linear_val) * Math.pow((linear_val - 0.5) * 2, 0.2))) * 100
    }
}

const calcPercentByDistanceBasic = async (face_distance) => {
    return disPer = 100 - (face_distance * 100);
}

const makeid = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

// reusable arrow function to encode file data to base64 encoded string
const convertBase64 = async (path) => {
    // read binary data from file
    const bitmap = await fs.readFileSync(path);
    // convert the binary data to base64 encoded string
    return bitmap.toString('base64');
};

module.exports = {
    uploadStorageFile,
    calcPercentByDistance,
    calcPercentByDistanceBasic,
    convertBase64
};