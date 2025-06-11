# Datacraft: A Gamified Coding Platform with an AI Assistant

**Datacraft** is an interactive, gamified coding platform designed to make learning and practicing programming challenges engaging and rewarding. It features AI-generated challenges, a real-time code editor, user progression tracking (points, levels, badges), a global leaderboard, and an integrated AI assistant **Zinda**, powered by the Google Gemini API.

---

## ✨ Features

* **User Authentication:** Secure registration, login (email/password), anonymous sign-in, and comprehensive account management.

* **Personalized User Profiles:** Track user points, levels, earned badges, and a complete history of completed challenges.

* **AI-Generated Challenges:** Dynamically create diverse programming challenges across various topics and difficulties using the powerful Google Gemini API.

* **Interactive Code Editor:** Write and test your coding solutions directly within the browser with an intuitive code editor.

* **Real-time Test Runner:** Execute your code against predefined test cases and receive immediate feedback on your solution's correctness.

* **Gamified Progression:** Earn points for every solved challenge, level up your coding rank, and unlock unique badges for your achievements.

* **Global Leaderboard:** See how you stack up against other users on a dynamic leaderboard, fostering healthy competition and motivation.

* **Zinda AI Assistant:** Your intelligent coding companion, Zinda (powered by Google Gemini), offers contextual hints, clarifies problem statements, and answers general programming questions, guiding you without revealing direct solutions.

* **Responsive Design:** Enjoy a seamless and optimized experience across all devices, from desktop to mobile.

## 🎬 Application Walkthrough

Get a quick overview of Datacraft's key features and how it works by watching our application walkthrough video.

[![Datacraft App Walkthrough Thumbnail](https://placehold.co/600x338/2D3748/A0AEC0?text=Click+for+App+Walkthrough)](https://youtu.be/BjOf5hk7BJM "Watch the Datacraft App Walkthrough")


## 🚀 Technologies Used

* **Frontend:**

    * [React](https://react.dev/): A JavaScript library for building user interfaces.

    * [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework for rapid UI development.

    * [Parcel](https://parceljs.org/): A blazing fast, zero configuration web application bundler.

    * [Ace Editor](https://ace.c9.io/): An embeddable code editor.

    * `react-ace`: React component for Ace Editor.

* **Backend & Database:**

    * [Firebase](https://firebase.google.com/):

        * **Firebase Authentication:** For user identity management.

        * **Cloud Firestore:** A flexible, scalable NoSQL cloud database for storing challenges, user profiles, and leaderboard data.

        * **Cloud Storage for Firebase:** For storing user-uploaded profile pictures.

* **Artificial Intelligence:**

    * [Google Gemini API (gemini-2.0-flash)](https://ai.google.com/): Used for generating programming challenges and powering the Zinda AI assistant.

## 🚦 Getting Started

Follow these steps to set up and run Datacraft locally.

### Prerequisites

* Node.js (LTS version recommended)

* npm or yarn (Node.js comes with npm)

* A Google Cloud Project with Firebase enabled.

### Firebase Project Setup

1.  **Create a Firebase Project:**

    * Go to the [Firebase Console](https://console.firebase.google.com/).

    * Click "Add project" and follow the steps to create a new project.

2.  **Enable Firebase Services:**

    * In your Firebase project, navigate to:

        * **Authentication:** Go to "Build" > "Authentication" > "Get started". Enable the **Email/Password** provider and **Anonymous** provider.

        * **Firestore Database:** Go to "Build" > "Firestore Database" > "Create database". Choose to start in **production mode** (you'll set security rules later). Select a location closest to your users.

        * **Cloud Storage:** Go to "Build" > "Storage" > "Get started". Accept the default rules for now (you can refine them later).

3.  **Firebase Admin SDK Configuration (`firebase-admin-config.json`):**

    * This file is required by the `seed.js` script to interact with your Firestore database from a Node.js environment.

    * In your Firebase project, go to "Project settings" (gear icon next to "Project overview").

    * Go to the "Service accounts" tab.

    * Click "Generate new private key" and then "Generate key".

    * A JSON file will be downloaded (e.g., `your-project-name-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`).

    * **Rename this file to `firebase-admin-config.json`** and place it in the root directory of your Datacraft project.

4.  **Firebase Web App Configuration (`firebaseConfig` in `App.js`):**

    * This configuration is used by the client-side React application.

    * In your Firebase project settings, scroll down to the "Your apps" section.

    * If you haven't added a web app yet, click the `</>` icon (Web) to register your app. Follow the steps.

    * Firebase will provide you with a `firebaseConfig` JavaScript object. Copy this entire object.

5.  **Google Gemini API Key:**

    * Go to the [Google AI Studio](https://aistudio.google.com/app/apikey) to create an API key for the Gemini API.

    * You will need this key for both the challenge seeding script (`seed.js`) and the Zinda AI chatbot in the `App.js` client-side code.

### Installation

1.  **Clone the Repository (If you haven't already):**

    ```bash
    git clone https://github.com/nadaYossef/Graduation-Project
    cd datacraft-minimal # Or whatever your project folder is named
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

### Configuration

1.  **Update `App.js` with your Firebase Web App Config:**

    * Open `App.js`.

    * Locate the `firebaseConfig` object at the top of the file.

    * **Replace** the placeholder values with the actual `firebaseConfig` object you copied from the Firebase Console.

    ```javascript
    const firebaseConfig = {
        apiKey: "YOUR_FIREBASE_API_KEY", // Replace this
        authDomain: "YOUR_AUTH_DOMAIN",   // Replace this
        projectId: "YOUR_PROJECT_ID",     // Replace this
        storageBucket: "YOUR_STORAGE_BUCKET", // Replace this
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace this
        appId: "YOUR_APP_ID",             // Replace this
        measurementId: "YOUR_MEASUREMENT_ID" // Replace this 
    };
    ```

2.  **Update `seed.js` and `App.js` with your Gemini API Key:**

    * Open `seed.js`.

    * Locate `const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";` and replace `"YOUR_GEMINI_API_KEY"` with your actual Gemini API Key.

    * Open `App.js`.

    * Locate `const geminiApiKey = "YOUR_GEMINI_API_KEY";` (under the Zinda AI Chat Integration section) and replace `"YOUR_GEMINI_API_KEY"` with your actual Gemini API Key.

3.  **Set Firestore Security Rules (Important for Data Access)**

    * Go to your Firebase project's Firestore Database section.

    * Click the "Rules" tab.

    * For testing/development, you can use rules that allow authenticated users to read and write. **However, for a production application, you should refine these rules for stricter security.**

    ```firestore
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {

        // Public data for challenges and leaderboard
        match /artifacts/{appId}/public/data/{collection}/{document} {
          allow read: if request.auth != null;
          allow write: if request.auth != null; // For seeding and leaderboard updates
        }

        // Private user profiles
        match /users/{appId}/userProfiles/{userId} {
          allow read: if request.auth != null && request.auth.uid == userId;
          allow write: if request.auth != null && request.auth.uid == userId;
        }

        // Add more specific rules as needed for other collections if you introduce them
      }
    }
    ```

    * **Note:** The above rules allow any authenticated user to read and write to public collections. For production, you might want to restrict `write` access to `admin` users only for challenges and have more granular control over leaderboard updates. User profiles are restricted to the owner (`userId`).

### Seeding Challenges

The `seed.js` script generates coding challenges using the Gemini API and uploads them to your Firestore database.

1.  Open your terminal in the project root directory.

2.  Run the seeding script:

    ```bash
    node seed.js
    ```

3.  Follow the prompts to specify the number of challenges, topics, and difficulties you want to generate.

### Running the Application

1.  After installing dependencies and configuring Firebase, start the development server:

    ```bash
    npm start
    # or
    yarn start
    ```

2.  The application will typically open in your browser at `http://localhost:1234` (or another available port).

## 📂 Project Structure (Key Files)

* `public/`: Contains static assets (not used in this minimal setup, but typical for web apps).

* `src/`:

    * `App.js`: The main React component containing the entire application logic, state management, and UI rendering.

    * `index.js`: Entry point for the React application, rendering the `App` component into the `index.html`'s `root` div.

* `index.html`: The main HTML file that serves as the entry point for the web application.

* `seed.js`: A Node.js script used to generate and seed coding challenges into Firebase Firestore using the Gemini API.

* `package.json`: Defines project metadata and lists all dependencies and scripts.

* `firebase-admin-config.json`: (Generated from Firebase Console) Contains credentials for the Firebase Admin SDK used by `seed.js`.

## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to improve the project, please open an issue or submit a pull request.

## 📄 License

This project is open-source.
