# AI Face Matching - System Documentation

> Current state documentation - snapshot of the existing codebase before refactoring.

---

## 1. Overview

**Project:** Face Recognition Services API
**Runtime:** Node.js + Express.js
**Database:** MongoDB (via Mongoose)
**ML Engine:** TensorFlow.js + @vladmandic/face-api
**Auth:** JWT (jsonwebtoken + bcryptjs)

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | Not specified |
| Framework | Express.js | ~4.16.1 |
| Database | MongoDB / Mongoose | 6.5.0 |
| ML Backend | @tensorflow/tfjs-node | 3.19.0 |
| Face Detection | @vladmandic/face-api | 1.7.1 |
| Image Processing | canvas (node-canvas) | 2.9.3 |
| Auth | jsonwebtoken | 8.5.1 |
| Password Hash | bcryptjs | 2.4.3 |
| File Upload | express-fileupload | 1.4.0 |
| Template Engine | Jade (deprecated) | 1.9.2 |

---

## 2. Project Structure

```
AI-Face-Matching/
├── app.js                      # Express app initialization + ML model loading
├── bin/www                     # HTTP server entry point (port 3100 default)
├── .env                        # Environment variables
├── package.json
│
├── config/
│   └── database.js             # MongoDB connection
│
├── models/
│   ├── user.js                 # User schema (auth)
│   ├── face.js                 # Face data schema (descriptors + metadata)
│   └── area.js                 # Area/location schema
│
├── controllers/
│   ├── faceControls.js         # Core face import/matching logic
│   └── areaControls.js         # Area CRUD
│
├── routes/
│   ├── api.js                  # API routes (auth + face + area)
│   └── index.js                # Frontend routes (home + image gallery)
│
├── middleware/
│   └── auth.js                 # JWT verification middleware
│
├── constants/
│   └── res.data.js             # Standard response object template
│
├── library/
│   ├── Utils.js                # File upload, distance calc, base64 convert
│   └── models/                 # Pre-trained ML model weights
│       ├── face_recognition_model-*
│       ├── face_landmark_68_model-*
│       ├── ssd_mobilenetv1_model-*
│       ├── tiny_face_detector_model-*
│       ├── face_expression_model-*
│       └── age_gender_model-*
│
├── uploads/                    # Stored face images
├── public/                     # Static assets
└── views/                      # Jade templates (index, error, layout)
```

---

## 3. Application Startup Flow

```
bin/www
  │
  ├── 1. require('../app')
  │     ├── Load .env (dotenv)
  │     ├── Connect MongoDB (config/database.js)
  │     ├── Initialize TensorFlow.js (tfjs-node CPU backend)
  │     ├── Initialize face-api with Canvas/Image monkey-patch
  │     ├── Load 6 ML models from /library/models/:
  │     │   ├── faceRecognitionNet      (128-D face embedding)
  │     │   ├── faceLandmark68Net       (68-point landmarks)
  │     │   ├── ssdMobilenetv1          (face detector - primary)
  │     │   ├── tinyFaceDetector        (face detector - fallback)
  │     │   ├── faceExpressionNet       (emotion classification)
  │     │   └── ageGenderNet            (age/gender estimation)
  │     ├── Configure middleware stack
  │     └── Mount routes
  │
  ├── 2. Normalize PORT (env.PORT || 3100)
  ├── 3. Create HTTP server
  └── 4. Listen on port
```

---

## 4. API Endpoints

### 4.1 Authentication

#### `POST /api/auth/register`
**Auth:** None
**Body:**
```json
{
  "first_name": "string (required)",
  "last_name": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "phone": "number (optional)",
  "phone_prefix": "string (optional)",
  "birthday": "date (optional)"
}
```
**Flow:**
1. Validate required fields (email, password, first_name, last_name)
2. Check if email already exists -> 409 if duplicate
3. Hash password with bcryptjs (salt rounds: 10)
4. Create User document in MongoDB
5. Generate JWT token (expires: 2h, payload: user_id + email)
6. Return user object with token

**Response:** `201` - User object with JWT token

---

#### `POST /api/login`
**Auth:** None
**Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```
**Flow:**
1. Validate email and password present
2. Find user by email
3. Compare password with bcryptjs
4. Generate JWT token (expires: 2h)
5. Return user object with token

**Response:** `200` - User object with JWT token | `400` - Invalid Credentials

---

### 4.2 Face Recognition

#### `POST /api/post-face` - Import Face Data
**Auth:** JWT required
**Content-Type:** multipart/form-data
**Body:**
```
Files: [image files] (max 1000 files, max 50MB each)
label: "string" (person name)
phone: "string" (optional)
birthday: "date" (optional)
notes: "string" (optional)
```

**Flow:**
```
1. Validate file count <= 1000
2. Upload files to /uploads/ (rename: timestamp + index + random)
3. For each image file:
   │
   ├── Load image with canvas.loadImage()
   ├── Attempt face detection with multi-detector fallback:
   │   ├── Try 1: detectSingleFace() [default SSD MobileNet]
   │   ├── Try 2: detectSingleFace() [same, retry]
   │   ├── Try 3: SsdMobilenetv1Options({ minConfidence: 0.4 })
   │   └── Try 4: TinyFaceDetectorOptions({ inputSize: 1280, scoreThreshold: 0.1 })
   │
   ├── For successful detection, extract:
   │   ├── .withFaceLandmarks()     -> 68 facial landmarks
   │   ├── .withFaceExpressions()   -> emotion probabilities
   │   ├── .withAgeAndGender()      -> age + gender + probability
   │   └── .withFaceDescriptor()    -> 128-D Float32Array embedding
   │
   └── Store descriptor object:
       { image, gender, genderProbability, age, descriptor }
4. Create single Face document with ALL descriptions for this label
5. Return success response
```

**Response:**
```json
{
  "error": false,
  "data": null,
  "message": "Face data stored successfully"
}
```

---

#### `POST /api/check-face` - Match Face Against Database
**Auth:** JWT required
**Content-Type:** multipart/form-data
**Body:**
```
File1: [single image file]
```

**Flow:**
```
1. Get temp file path from req.files.File1.tempFilePath
2. Load ALL Face documents from MongoDB
3. Convert stored descriptors to Float32Array
4. Build LabeledFaceDescriptors array (label: "{faceId}_{descIndex}")
5. Create FaceMatcher with threshold 0.6
6. Load query image with canvas.loadImage()
7. Detect face in query image:
   └── SsdMobilenetv1Options({ minConfidence: 0.1 })
       .withFaceLandmarks()
       .withFaceExpressions()
       .withAgeAndGender()
       .withFaceDescriptor()
8. Resize detections to image dimensions
9. Find matches:
   ├── FaceMatcher.findBestMatch() -> primary results
   └── findDistanceGetByBasic()    -> Euclidean distance for all faces
       (sorted ascending by distance, excluding already-matched labels)
10. Take top 6 results
11. For each result:
    ├── Parse label -> faceId + descriptionIndex
    ├── Fetch Face document from DB
    ├── Calculate similarity percentage from distance
    └── Build response object
12. Return matches with input face info
```

**Response:**
```json
{
  "error": false,
  "data": {
    "input": {
      "gender": "male",
      "genderProbability": 0.95,
      "age": 28.5,
      "image": "/tmp/uploaded-file-path"
    },
    "output": [
      {
        "informations": {
          "name": "Person Name",
          "phone": "0123456789",
          "birthday": "1995-01-01",
          "notes": "Some notes"
        },
        "image": "/uploads/image.jpg",
        "descriptions": {
          "gender": "male",
          "genderProbability": 0.92,
          "age": 30,
          "descriptor": { ... }
        },
        "percent": "85.50%",
        "distance": "0.35"
      }
    ]
  },
  "message": "Successfully"
}
```

---

### 4.3 Area Management

#### `POST /api/area/create`
**Auth:** None (missing auth middleware)
**Body:**
```json
{
  "name": "string (required, unique)",
  "notes": "string (optional)"
}
```
**Flow:**
1. Check if area name exists -> 409 if duplicate
2. Create Area document (auto-increment a_id)
3. Return success

---

### 4.4 Utility Routes

#### `GET /` - Home page
Renders Jade template `index.jade`

#### `GET /gallery?view=/uploads/image.jpg` - Image viewer
Reads file from disk and serves with Content-Type based on extension (.png -> image/png)

---

## 5. Database Schemas

### 5.1 User Collection
```
users {
  _id:          ObjectId
  first_name:   String (default: null)
  last_name:    String (default: null)
  email:        String (unique)
  password:     String (bcrypt hash)
  phone:        Number
  phone_prefix: String
  birthday:     Date
  token:        String (JWT)
  area_id:      String
  created_at:   Date (default: Date.now)
}
```

### 5.2 Face Collection
```
faces {
  _id:          ObjectId
  label:        String (required) - person name/identifier
  descriptions: Array [
    {
      image:              String - file path in /uploads/
      gender:             String - "male" | "female"
      genderProbability:  Number - 0.0 to 1.0
      age:                Number - estimated age
      descriptor:         Object - 128-D face embedding (stored as plain Object,
                                   converted to Float32Array at runtime)
    }
  ]
  phone:        String
  birthday:     Date
  notes:        String
}
```

### 5.3 Area Collection
```
areas {
  _id:        ObjectId
  a_id:       Number (auto-increment via mongoose-sequence)
  name:       String (required, unique)
  notes:      String
  status:     Number (default: 1)
  created_at: Date (default: Date.now)
}
```

---

## 6. Face Matching Algorithm Detail

### 6.1 Face Embedding
- Model: `face_recognition_model` via @vladmandic/face-api
- Output: 128-dimensional Float32Array (face descriptor)
- Each face image produces one descriptor vector representing facial features

### 6.2 Distance Metric
**Euclidean Distance** between two 128-D descriptors:
```
distance = sqrt(sum((a[i] - b[i])^2 for i in 0..127))
```
- Lower distance = more similar faces
- Threshold: **0.6** (used for FaceMatcher classification)

### 6.3 Similarity Percentage Calculation
```javascript
function calcPercentByDistance(face_distance, threshold = 0.6) {
  if (face_distance > threshold) {
    // Low confidence range
    range = (1 - threshold)
    linear_val = (1 - face_distance) / (range * 2)
    return linear_val * 100
  } else {
    // High confidence range (nonlinear boost)
    range = threshold
    linear_val = 1.0 - (face_distance / (range * 2))
    return (linear_val + ((1 - linear_val) * pow((linear_val - 0.5) * 2, 0.2))) * 100
  }
}
```

### 6.4 Multi-Detector Fallback Strategy (Face Import)
```
Detection cascade (stops at first success):
1. detectSingleFace(img) [default]           -> standard quality images
2. detectSingleFace(img) [retry same]        -> flaky detection retry
3. SsdMobilenetv1({ minConfidence: 0.4 })    -> small/partial faces
4. TinyFaceDetector({ inputSize: 1280,       -> low-resolution images
                      scoreThreshold: 0.1 })
```

### 6.5 Matching Pipeline (Face Check)
```
Detection for query image:
- SsdMobilenetv1({ minConfidence: 0.1 }) only (single detector)

Matching strategy:
1. FaceMatcher.findBestMatch() -> best match per labeled class
2. findDistanceGetByBasic()    -> brute-force Euclidean distance against all
   stored descriptors, sorted ascending, excluding already-matched labels
3. Concatenate results, take top 6
```

---

## 7. Authentication Flow

```
Registration:
  Client -> POST /api/auth/register { email, password, ... }
         -> bcrypt.hash(password, 10)
         -> User.create({ ..., password: hashed })
         -> jwt.sign({ user_id, email }, TOKEN_KEY, { expiresIn: "2h" })
         <- { user object + token }

Login:
  Client -> POST /api/login { email, password }
         -> User.findOne({ email })
         -> bcrypt.compare(password, stored_hash)
         -> jwt.sign({ user_id, email }, TOKEN_KEY, { expiresIn: "2h" })
         <- { user object + token }

Protected Routes:
  Client -> Request with token in:
            - req.body.token OR
            - req.query.token OR
            - req.headers["authorization"]
         -> jwt.verify(token, TOKEN_KEY)
         -> req.user = { user_id, email }
         -> next()
```

---

## 8. File Upload Flow

```
Client uploads files (multipart/form-data)
  │
  ├── express-fileupload middleware:
  │   ├── Max size: 50MB per file
  │   ├── useTempFiles: true
  │   └── abortOnLimit: true
  │
  └── uploadStorageFile(files):
      ├── For each file:
      │   ├── Generate filename: {unix_timestamp}{index}{random_3_chars}.{ext}
      │   ├── file.mv() to /uploads/{filename}
      │   └── Return "/uploads/{filename}"
      └── Return array of file paths
```

---

## 9. Standard Response Format

All API endpoints use this base structure:
```json
{
  "error": false,
  "data": null,
  "message": ""
}
```
Defined in `constants/res.data.js`.

---

## 10. Environment Configuration

```
API_PORT=4001           # Application port
MONGO_URI=mongodb://... # MongoDB connection string
TOKEN_KEY=...           # JWT signing secret
```

Entry point `bin/www` uses `process.env.PORT || 3100` (not API_PORT).

---

## 11. Middleware Stack (order in app.js)

```
1. express-fileupload   (file upload parsing, 50MB limit)
2. cors()               (all origins allowed)
3. express.json()       (JSON body parsing)
4. express.urlencoded() (form data parsing)
5. cookieParser()       (cookie parsing)
6. express.static()     (serve /public/)
7. morgan('dev')        (HTTP request logging)
8. Routes:
   ├── '/'    -> routes/index.js
   └── '/api' -> routes/api.js
9. 404 handler          (createError(404))
10. Error handler       (render error.jade)
```

---

## 12. Dependencies

### Used
| Package | Version | Purpose |
|---------|---------|---------|
| express | ~4.16.1 | Web framework |
| mongoose | ^6.5.0 | MongoDB ODM |
| mongoose-sequence | ^5.3.1 | Auto-increment for Area.a_id |
| @vladmandic/face-api | ^1.7.1 | Face detection & recognition |
| @tensorflow/tfjs-node | ^3.19.0 | TensorFlow.js CPU backend |
| canvas | ^2.9.3 | Image loading for face-api |
| express-fileupload | ^1.4.0 | Multipart file upload |
| jsonwebtoken | ^8.5.1 | JWT generation & verification |
| bcryptjs | ^2.4.3 | Password hashing |
| axios | ^0.27.2 | HTTP client (third-party face matching) |
| cors | ^2.8.5 | CORS middleware |
| cookie-parser | ~1.4.4 | Cookie parsing |
| morgan | ~1.9.1 | HTTP logging |
| moment | ^2.29.4 | Timestamp generation |
| dotenv | ^16.0.1 | Environment variables |
| http-errors | ~1.6.3 | HTTP error creation |
| debug | ~2.6.9 | Debug logging |
| jade | ^1.9.2 | Template engine (deprecated) |

### Unused (installed but not imported)
| Package | Version | Notes |
|---------|---------|-------|
| @exadel/compreface-js-sdk | ^1.0.0 | Never imported |
| @tensorflow/tfjs-node-gpu | ^3.19.0 | Never imported (tfjs-node used instead) |
| busboy | ^1.6.0 | Superseded by express-fileupload |
| connect-busboy | ^1.0.0 | Superseded by express-fileupload |

### Missing (no devDependencies at all)
- No test framework
- No linter (eslint)
- No formatter (prettier)
- No dev server (nodemon)
- No TypeScript
