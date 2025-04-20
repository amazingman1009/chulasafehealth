// survey-app/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
if (!MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI is not defined.");
        process.exit(1);
        }
        mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => console.log('MongoDB connected successfully.'))
                .catch(err => {
                        console.error('MongoDB connection error:', err);
                                process.exit(1);
                                    });

                                    // --- Mongoose Schema and Model (Updated) ---
                                    const surveyResponseSchema = new mongoose.Schema({
                                        answers: {
                                                type: Map,
                                                        of: mongoose.Schema.Types.Mixed,
                                                                required: true
                                                                    },
                                                                        // Add the new field for the suffix
                                                                            sourceSuffix: {
                                                                                    type: String, // Store the suffix as a string
                                                                                            trim: true,   // Remove leading/trailing whitespace
                                                                                                    index: true,  // Add an index for potentially faster lookups based on suffix
                                                                                                            default: null // Default to null if not provided
                                                                                                                },
                                                                                                                    submittedAt: {
                                                                                                                            type: Date,
                                                                                                                                    default: Date.now
                                                                                                                                        }
                                                                                                                                        });

                                                                                                                                        const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);

                                                                                                                                        // --- API Routes (Updated) ---
                                                                                                                                        app.post('/api/submit', async (req, res) => {
                                                                                                                                            try {
                                                                                                                                                    // Destructure answers AND sourceSuffix from the request body
                                                                                                                                                            const { answers, sourceSuffix } = req.body;

                                                                                                                                                                    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
                                                                                                                                                                                return res.status(400).json({ message: 'Invalid survey data submitted.' });
                                                                                                                                                                                        }

                                                                                                                                                                                                // Convert the answers object into a Map for Mongoose
                                                                                                                                                                                                        const answersMap = new Map(Object.entries(answers));

                                                                                                                                                                                                                // Create new response, including the sourceSuffix
                                                                                                                                                                                                                        const newResponse = new SurveyResponse({
                                                                                                                                                                                                                                    answers: answersMap,
                                                                                                                                                                                                                                                sourceSuffix: sourceSuffix // Save the suffix (will be null if not sent)
                                                                                                                                                                                                                                                        });
                                                                                                                                                                                                                                                                await newResponse.save();

                                                                                                                                                                                                                                                                        console.log(`Survey response saved: ${newResponse._id}, Suffix: ${sourceSuffix || 'None'}`);
                                                                                                                                                                                                                                                                                res.status(201).json({ message: 'Survey submitted successfully!', id: newResponse._id });

                                                                                                                                                                                                                                                                                    } catch (error) {
                                                                                                                                                                                                                                                                                            console.error('Error saving survey response:', error);
                                                                                                                                                                                                                                                                                                    res.status(500).json({ message: 'Failed to submit survey.', error: error.message });
                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                        });

                                                                                                                                                                                                                                                                                                        // --- Serve React Static Files ---
                                                                                                                                                                                                                                                                                                        app.use(express.static(path.join(__dirname, 'client/build')));

                                                                                                                                                                                                                                                                                                        // --- Catch-all Route ---
                                                                                                                                                                                                                                                                                                        // This needs to be AFTER your API routes but BEFORE the final error handler (if any)
                                                                                                                                                                                                                                                                                                        // It ensures that any path (like /campaignA) is handled by React Router on the client-side
                                                                                                                                                                                                                                                                                                        app.get('*', (req, res) => {
                                                                                                                                                                                                                                                                                                            res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
                                                                                                                                                                                                                                                                                                            });

                                                                                                                                                                                                                                                                                                            // --- Start Server ---
                                                                                                                                                                                                                                                                                                            app.listen(PORT, () => {
                                                                                                                                                                                                                                                                                                                console.log(`Server listening on port ${PORT}`);
                                                                                                                                                                                                                                                                                                                });