// survey-app/server.js

// Load environment variables from .env file
require('dotenv').config();

// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Ensure 'path' is required for joining paths

// Initialize Express app
const app = express();

// Define the port the server will listen on
// Use Render's provided PORT environment variable, or 3001 for local development
const PORT = process.env.PORT || 3001;

// Get the MongoDB connection URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// --- Middleware Setup ---

// Enable Cross-Origin Resource Sharing (CORS) for all origins
// This allows your React frontend (potentially on a different domain/port during development)
// to make requests to this backend.
app.use(cors());

// Enable Express to parse JSON request bodies
// This is necessary to read data sent from the frontend (like survey answers).
app.use(express.json());

// --- MongoDB Connection ---

// Check if the MongoDB URI is provided
if (!MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI is not defined. Make sure you have a .env file with MONGODB_URI set or have set it in your deployment environment variables.");
    process.exit(1); // Exit the application if the database connection string is missing
}

// Connect to MongoDB using Mongoose
mongoose.connect(MONGODB_URI, {
    // Deprecation warnings avoidance - these are standard options
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully.')) // Log success message
.catch(err => {
    // Log any connection errors and exit the application
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// --- Mongoose Schema and Model Definition ---

// Define the structure for storing survey responses in MongoDB
const surveyResponseSchema = new mongoose.Schema({
    // Store the answers as a Map (key: questionIndex, value: answer string or array)
    answers: {
        type: Map,
        of: mongoose.Schema.Types.Mixed, // Allows values to be strings or arrays (for multiple choice)
        required: true // Answers are mandatory
    },
    // Store the source suffix captured from the URL parameter
    sourceSuffix: {
        type: String,   // The suffix will be stored as a string
        trim: true,     // Automatically remove leading/trailing whitespace
        index: true,    // Create an index on this field for potentially faster queries if needed
        default: null   // Default to null if no suffix is provided in the request
    },
    // Timestamp when the survey response was saved
    submittedAt: {
        type: Date,
        default: Date.now // Automatically set to the current date and time
    }
});

// Create the Mongoose model based on the schema
const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);

// --- API Routes ---

// Define the endpoint for submitting survey responses
app.post('/api/submit', async (req, res) => {
    try {
        // Destructure the 'answers' and 'sourceSuffix' from the request body
        const { answers, sourceSuffix } = req.body;

        // Basic validation: Check if answers object exists and is not empty
        if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
            // Send a 400 Bad Request response if data is invalid
            return res.status(400).json({ message: 'Invalid survey data submitted.' });
        }

        // Convert the plain JavaScript 'answers' object into a Map suitable for Mongoose
        const answersMap = new Map(Object.entries(answers));

        // Create a new survey response document using the Mongoose model
        const newResponse = new SurveyResponse({
            answers: answersMap,
            sourceSuffix: sourceSuffix // Save the suffix (will be null if not sent by the client)
        });

        // Save the new document to the MongoDB database
        await newResponse.save();

        // Log the successful save operation on the server
        console.log(`Survey response saved: ${newResponse._id}, Suffix: ${sourceSuffix || 'None'}`);

        // Send a 201 Created success response back to the client
        res.status(201).json({ message: 'Survey submitted successfully!', id: newResponse._id });

    } catch (error) {
        // Log any errors that occur during the database operation
        console.error('Error saving survey response:', error);

        // Send a 500 Internal Server Error response back to the client
        res.status(500).json({ message: 'Failed to submit survey.', error: error.message });
    }
});

// --- Serve React Static Files ---

// Configure Express to serve the static files (HTML, CSS, JS)
// built by the React application (`npm run build`).
// These files are typically located in the 'client/build' directory.
// This middleware should come *before* the catch-all route.
app.use(express.static(path.join(__dirname, 'client/build')));

// --- Catch-all Route for Client-Side Routing ---

// This route handles any requests that haven't been matched by previous routes
// (like `/api/submit` or requests for static files like `/static/css/main.css`).
// It sends the main `index.html` file from the React build directory.
// This allows React Router to take over routing on the client-side.
// Ensure the path string is exactly '*' without extra spaces or characters.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// --- Start the Server ---

// Start the Express server and make it listen on the defined PORT
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});