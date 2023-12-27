const { Canvas, Image } = require("canvas");
//const tf = require('@tensorflow/tfjs');
//const tf = require('@tensorflow/tfjs-node-gpu');
const tf = require('@tensorflow/tfjs-node');
//require('@tensorflow/tfjs-node');
const faceapi = require('@vladmandic/face-api');
faceapi.env.monkeyPatch({ Canvas, Image });
const canvas = require("canvas");
const FaceModel = require("../models/face");
const resConst = require("../constants/res.data")
const { uploadStorageFile, calcPercentByDistance, calcPercentByDistanceBasic, convertBase64 } = require("../library/Utils")
const axios = require("axios").create({ baseUrl: "http://139.180.136.67:5000/" });


const importFaceDataToDataStore = async (req, res) => {
    const files = req.files.Files;
    let resData = { ...resConst };
    if (files.length > 1000) {
        resData.error = true
        resData.message = "Maximum is 1000 files."
    } else {
        const fileUrls = await uploadStorageFile(files);
        let result = await uploadLabeledImages(fileUrls, req.body);
        //let result = await imagesToDB(fileUrls, req.body);
        if (result) {
            resData.error = false,
                resData.message = "Face data stored successfully"
        }
    }
    res.json(resData);
}

const imagesToDB = async (files, body) => {
    const { label, phone, birthday, notes } = body;
    const dataBase64 = await Promise.all(files.map(async (file, i) => {
        const base_tr = await convertBase64(`${appRoot + file}`);
        const faceCreated = await FaceModel.create({
            label,
            descriptions: {
                path: file,
                base64: base_tr
            },
            phone,
            birthday,
            notes
        });
        return faceCreated;
    }));
    return dataBase64;

}

const faceMatchingByThirdLibrary = async (req, res) => {
    let resData = { ...resConst };
    const File1 = req.files.File1.tempFilePath;
    const base64_str = await convertBase64(File1);
    let imgParams = [];
    let faces = await FaceModel.find();
    const dataResponse = await Promise.all(faces.map(async (face, i) => {
        try {
            const response = await axios.post("verify", {
                model_name: "DeepFace",
                img: [{
                    img1: "data:image/jpeg;base64," + base64_str,
                    img2: "data:image/jpeg;base64," + faces[i].descriptions[0].base64
                }]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return (response.data);
        } catch (error) {
            console.log(error);
        }
    }));
    resData.data = dataResponse.length;
    res.json(resData);
}


const faceMatchingInDataStore = async (req, res) => {
    let resData = { ...resConst };
    const File1 = req.files.File1.tempFilePath;
    const indexPath = File1.indexOf("\\tmp\\");
    console.log(File1);
    console.log(indexPath);
    let result = await getDescriptorsFromDB(File1);
    if (result.output) {
        // Fetching information
        let arrData = [];
        const showResults = result.output.slice(0, 6);
        for (const face of showResults) {
            let dataIndentify = face._label.split("_");
            let faceData = await FaceModel.findById(dataIndentify[0]);
            arrData.push({
                informations: {
                    name: faceData.label,
                    phone: faceData.phone,
                    birthday: faceData.birthday,
                    notes: faceData.notes
                },
                image: faceData.descriptions[dataIndentify[1]].image,
                descriptions: {
                    gender: faceData.descriptions[dataIndentify[1]].gender,
                    genderProbability: faceData.descriptions[dataIndentify[1]].genderProbability,
                    age: faceData.descriptions[dataIndentify[1]].age,
                    descriptor: faceData.descriptions[dataIndentify[1]].descriptor,
                },
                percent: (await calcPercentByDistance(face._distance)).toFixed(2) + "%",
                distance: face._distance.toFixed(2)
            });
        };
        resData.error = false
        resData.data = {
            input: {
                gender: result.input.gender,
                genderProbability: result.input.genderProbability,
                age: result.input.age,
                image: File1.slice(indexPath,File1.length)
            },
            output: arrData
        };
        resData.message = "Successfully"
    }
    res.json(resData);
}

async function uploadLabeledImages(files, body) {
    const { label, phone, birthday, notes } = body;
    try {
        const descriptions = [];
        let countFail = 0;
        // Loop through the images
        for (let i = 0; i < files.length; i++) {
            const img = await canvas.loadImage(appRoot + files[i]);
            // Read each face and save the face descriptions in the descriptions array
            let detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceExpressions().withAgeAndGender().withFaceDescriptor();
            if (detections) {
                descriptions.push({
                    image: files[i],
                    gender: detections.gender,
                    genderProbability: detections.genderProbability,
                    age: detections.age,
                    descriptor: detections.descriptor
                });
            } else {
                let detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceExpressions().withAgeAndGender().withFaceDescriptor();
                if (detections) {
                    descriptions.push({
                        image: files[i],
                        gender: detections.gender,
                        genderProbability: detections.genderProbability,
                        age: detections.age,
                        descriptor: detections.descriptor
                    });
                } else {
                    // Redetect Face For Low Display Pixel
                    let detections = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })).withFaceLandmarks().withFaceExpressions().withAgeAndGender().withFaceDescriptor();
                    if (detections) {
                        descriptions.push({
                            image: files[i],
                            gender: detections.gender,
                            genderProbability: detections.genderProbability,
                            age: detections.age,
                            descriptor: detections.descriptor
                        });
                    } else {
                        let detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 1280, scoreThreshold: 0.1 })).withFaceLandmarks().withFaceExpressions().withAgeAndGender().withFaceDescriptor();
                        if (detections) {
                            descriptions.push({
                                image: files[i],
                                gender: detections.gender,
                                genderProbability: detections.genderProbability,
                                age: detections.age,
                                descriptor: detections.descriptor
                            });
                        } else {
                            console.log("Fail:" + files[i]);
                            countFail++;
                        }
                    }
                }
            }
        }
        const faceCreated = await FaceModel.create({
            label,
            descriptions,
            phone,
            birthday,
            notes
        });
        return true;
    } catch (error) {
        console.log(error);
        return (error);
    }
}

async function getDescriptorsFromDB(image) {
    // Get all the face data from mongodb and loop through each of them to read the data
    let faces = await FaceModel.find();
    let facesArray = [];
    let arrMatcher = [];
    let onlyFaces = [];
    for (i = 0; i < faces.length; i++) {
        // Change the face data descriptors from Objects to Float32Array type
        for (j = 0; j < faces[i].descriptions.length; j++) {
            let parseVal = new Float32Array(Object.values(faces[i].descriptions[j].descriptor));
            arrMatcher.push(new faceapi.LabeledFaceDescriptors(faces[i].id + "_" + j, [parseVal]));
            facesArray.push({
                name: faces[i].id + "_" + j,
            });
            onlyFaces.push(parseVal);
        }
    }

    // Load face matcher to find the matching face
    const faceMatcher = new faceapi.FaceMatcher(arrMatcher, 0.6);
    // Read the image using canvas or other method
    const img = await canvas.loadImage(image);
    // Find matching faces
    const displaySize = { width: img.width, height: img.height };
    let detections = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 })).withFaceLandmarks().withFaceExpressions().withAgeAndGender().withFaceDescriptor();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    let results = [];
    if (detections) {
        // Result First
        const resultMatch = faceMatcher.findBestMatch(resizedDetections.descriptor);
        if (resultMatch && resultMatch.length > 0) {
            let labelExclude = resultMatch.map(matcher => matcher._label);
            const resultBasic = await findDistanceGetByBasic(resizedDetections.descriptor, onlyFaces, facesArray, labelExclude);
            results = resultMatch.concat(resultBasic);
        } else {
            const resultBasic = await findDistanceGetByBasic(resizedDetections.descriptor, onlyFaces, facesArray);
            results = resultBasic;
        }
    }
    return {
        input: detections,
        output: results
    };
}

const findDistanceGetByBasic = async (query_descriptor, onlyFaces, facesArray, excludeLabelArray = []) => {
    let results = [];
    onlyFaces.map((face, index) => {
        const dist = faceapi.euclideanDistance(face, query_descriptor);
        results.push({
            _label: facesArray[index].name,
            _distance: dist
        })
    })
    let resultsSort = results.sort((a, b) => a._distance - b._distance);
    let resultFilter = resultsSort.filter(item => !excludeLabelArray.includes(item._label))
    return resultFilter;
}

module.exports = {
    importFaceDataToDataStore,
    faceMatchingInDataStore,
    faceMatchingByThirdLibrary,
    uploadLabeledImages
};