const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-config.json'); 
const readline = require('readline'); 
const util = require('util'); 

const GEMINI_API_KEY = "AIzaSyBPNhcZlMH06cR17jBaDl-MVqTrGOmIIqg"; // Ensure your key is here!
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const appId = serviceAccount.project_id; 

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function generateChallengesWithGemini(numChallenges, topics, difficulties) {
    console.log(`\nGenerating ${numChallenges} challenges on topics: ${topics} (Difficulties: ${difficulties})...`);

    const prompt = `
        You are a programming challenge generator.
        Your task is to create ${numChallenges} unique programming challenges.
        Each challenge MUST be a JSON object and include the following EXACT fields:
        - "id": A unique string identifier (e.g., "twoSum", "reverseString"). Ensure it's unique across all generated challenges.
        - "title": A concise and descriptive title for the challenge.
        - "description": A clear problem statement with examples. Use markdown for code snippets (e.g., \`\`\`javascript\\nconsole.log("hello");\\n\`\`\`).
        - "difficulty": Must be one of: "${difficulties}".
        - "topic": Must be one of: "${topics}".
        - "points": An integer reflecting difficulty (Easy: 20-50, Medium: 60-120, Hard: 130-200).
        - "entryPoint": The exact name of the JavaScript function the user should implement (e.g., "twoSum", "reverseString").
        - "testCases": An array of test case objects. Each test case object MUST have two fields:
            - "input": An array containing the arguments for the 'entryPoint' function. Ensure all values in this array are JSON literals (numbers, strings in quotes, booleans, null, or nested arrays/objects).
            - "expectedOutput": The expected return value of the 'entryPoint' function for the given input. This must also be a JSON literal (number, string in quotes, boolean, null, or nested arrays/objects).

        IMPORTANT:
        - Generate ONLY a JSON array containing the challenge objects. Do NOT include any other text, explanations, or markdown fences (e.g., \`\`\`json).
        - Ensure the output is perfectly valid JSON.
        - Example structure for testCases (must be valid JSON):
          "testCases": [
            { "input": [[2, 7, 11, 15], 9], "expectedOutput": [0, 1] },
            { "input": [[3, 2, 4], 6], "expectedOutput": [1, 2] }
          ]
        - For string inputs/outputs, ensure they are correctly quoted within the JSON (e.g., "hello", not hello).
        - For array or object inputs/outputs, ensure they are valid JSON arrays/objects.

        Generate ${numChallenges} challenges now.
    `;

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            // responseMimeType: "application/json", // Removed for flexibility
            // responseSchema: {} // Removed explicit schema for robust JSON generation
        },
        model: "gemini-2.0-flash" // Using gemini-2.0-flash for better text generation
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${payload.model}:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API request failed with status ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            let jsonText = result.candidates[0].content.parts[0].text;
            
            jsonText = jsonText.replace(/^```json\n|```$/g, '').trim();

            //Replace invalid JSON literals (NaN, undefined) with null ---
            jsonText = jsonText.replace(/NaN/g, 'null');
            jsonText = jsonText.replace(/undefined/g, 'null');
            jsonText = jsonText.replace(/undef/g, 'null'); // Catch common variations like 'undef' from previous error

            console.log("\n--- Raw JSON from Gemini (for debugging) ---");
            console.log(jsonText);
            console.log("-------------------------------------------\n");
            
            const parsedChallenges = JSON.parse(jsonText);
            
            // Add createdAt timestamp and filter out invalid challenges if any
            return parsedChallenges.map(c => ({
                ...c,
                createdAt: admin.firestore.FieldValue.serverTimestamp() 
            })).filter(c => {
                if (!c.id || typeof c.id !== 'string' || c.id.trim() === '') {
                    console.warn(`Skipping generated challenge due to invalid/missing ID:`, util.inspect(c, { depth: 2 }));
                    return false;
                }
                if (!Array.isArray(c.testCases)) {
                    console.warn(`Challenge '${c.id}' skipped: testCases is not an array.`, util.inspect(c, { depth: 2 }));
                    return false;
                }
                for (const tc of c.testCases) {
                    if (!Array.isArray(tc.input)) {
                        console.warn(`Challenge '${c.id}' skipped: testCases input is not an array.`, util.inspect(tc, { depth: 2 }));
                        return false;
                    }

                    if (tc.expectedOutput === undefined || (typeof tc.expectedOutput === 'string' && tc.expectedOutput.toLowerCase() === 'undefined')) {
                         console.warn(`Challenge '${c.id}' skipped: testCases expectedOutput is undefined or 'undefined' string.`, util.inspect(tc, { depth: 2 }));
                         return false;
                    }
                }
                return true;
            });
        }
        throw new Error("Invalid response format or empty content from Gemini API.");
    } catch (error) {
        console.error("Error generating challenges:", error);
        throw error; 
    }
}

async function seedChallenges() {
    console.log('--- Datacraft Challenge Seeder ---');

    try {
        // Get user input
        const numChallenges = parseInt(await askQuestion('How many challenges? (e.g., 5): '));
        if (isNaN(numChallenges) || numChallenges < 1) {
            throw new Error("Invalid number of challenges.");
        }

        const topics = (await askQuestion('Enter topics (comma-separated): '))
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);
        
        if (!topics.length) {
            throw new Error("At least one topic required.");
        }

        const difficulties = (await askQuestion('Enter difficulties (Easy,Medium,Hard): '))
            .split(',')
            .map(d => d.trim())
            .filter(d => ['Easy','Medium','Hard'].includes(d));
        
        if (!difficulties.length) {
            throw new Error("At least one valid difficulty required.");
        }

        // Generate challenges
        const challenges = await generateChallengesWithGemini(
            numChallenges,
            topics.join(', '),
            difficulties.join(', ')
        );

        if (!challenges?.length) {
            throw new Error("No challenges generated or all generated challenges were invalid.");
        }

        // Upload to Firestore
        console.log(`Uploading ${challenges.length} challenges...`);
        const collectionRef = db.collection(`artifacts/${appId}/public/data/challenges`);
        let currentBatch = db.batch();
        let count = 0;

        for (const challenge of challenges) {
            // Validate challenge.id existence and type before using it as doc ID
            if (!challenge.id || typeof challenge.id !== 'string') {
                console.warn("Skipping challenge during upload due to invalid ID:", util.inspect(challenge, { depth: 2 }));
                continue;
            }
            
            //Serialize input and expectedOutput to JSON strings before saving ---
            const challengeToSave = { ...challenge }; 
            challengeToSave.testCases = challenge.testCases.map(tc => ({
                input: JSON.stringify(tc.input), 
                expectedOutput: JSON.stringify(tc.expectedOutput) 
            }));

            const docRef = collectionRef.doc(challenge.id);
            currentBatch.set(docRef, challengeToSave); 
            count++;

            // Firestore batches have 500 operation limit
            if (count % 499 === 0) { // Using 499 to be safe within the 500 limit
                await currentBatch.commit();
                console.log(`Committed ${count} challenges so far.`);
                currentBatch = db.batch(); // Start a new batch
            }
        }

        // Commit any remaining operations in the last batch
        if (count % 499 !== 0 || count === 0) { // If there's a partial batch or no challenges at all
            await currentBatch.commit();
        }

        console.log(`Success! Uploaded ${count} challenges.`);
    } catch (error) {
        console.error("Seeding failed:", error.message);
        // If the error originated from Gemini, the message should be more specific
        if (error.message.includes('Gemini API request failed')) {
            console.error("Please check your Gemini API key, network connection, or try a different prompt/number of challenges.");
        }
    } finally {
        rl.close();
        process.exit(0); 
    }
}

seedChallenges();
