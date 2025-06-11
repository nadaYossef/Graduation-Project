import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInAnonymously,
    signInWithCustomToken, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail, 
    deleteUser,
    updateProfile
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
    collection,
    query,
    getDocs,
    arrayUnion,
    arrayRemove,
    getDoc 
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadBytes,
    deleteObject,
    getDownloadURL
} from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCwjM3VrTXmvbzjmANYTU87_smv7TOgqz4", 
    authDomain: "datacraft-app.firebaseapp.com",  
    projectId: "datacraft-app", 
    storageBucket: "datacraft-app.firebasestorage.app", 
    messagingSenderId: "491174733279",
    appId: "1:491174733279:web:e76e47cdf559452df6506a",
    measurementId: "G-E3HCXYQ0FV"
};


const __app_id = firebaseConfig.projectId;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app); 

// --- ZindaFloatingChat Component ---
const ZindaFloatingChat = ({ chatMessages, setChatMessages, chatInput, setChatInput, handleChatInputChange, handleSendMessage, chatMessagesEndRef, selectedChallenge, currentPage }) => {
    const [isOpen, setIsOpen] = useState(false); 
    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        if (chatMessagesEndRef.current) {
            chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, isOpen]);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Zinda Icon/Button */}
            <button
                onClick={toggleChat}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
                title="Open Zinda AI Chat"
            >
                {/* Zinda SVG Icon */}
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.733-1.337c-.555-.246-1.108-.485-1.637-.674C2.073 14.286 1 14.12 1 13.5c0-.142.061-.271.168-.387.112-.124.298-.242.502-.345.205-.102.43-.198.667-.282.238-.083.487-.156.74-.216.516-.12.986-.192 1.346-.192 3.418 0 6.643 2.057 7.973 4.673.54-2.076.883-4.27.917-6.529C17.067 6.442 16.592 3.65 14.707 1.764 12.822-.121 10.03-.6 7.073 1.077c-.504.286-.983.61-1.428.966-.445.356-.867.747-1.264 1.168C3.904 4.07 3 5.378 3 7c0 .121-.035.239-.099.352-.065.113-.153.217-.263.309-.11.092-.234.168-.367.227-.133.059-.271.092-.41.092-.259 0-.486-.095-.678-.261C.967 7.574.654 7.06.654 6.5c0-.62.825-1.157 2.073-1.614A17.915 17.915 0 005.15 3.513C7.394 2.277 9.87 2 12.5 2c3.582 0 6 2.418 6 6z" clipRule="evenodd" />
                </svg>
            </button>

            {/* Chat Window - Now a larger overlay when open */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl flex flex-col border border-gray-700 w-full max-w-2xl h-[90vh] relative">
                        <div className="p-4 bg-gray-900 text-white font-bold text-lg rounded-t-lg flex justify-between items-center">
                            Chat with Zinda AI
                            <button onClick={toggleChat} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {chatMessages.length === 0 && (
                                <div className="text-center text-gray-500 text-sm italic">
                                    Ask Zinda anything about the challenges or coding!
                                </div>
                            )}
                            {chatMessages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] p-3 rounded-lg shadow-md ${
                                        msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-100'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatMessagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-gray-700 flex">
                            <input
                                type="text"
                                className="flex-1 bg-gray-700 text-gray-100 border border-gray-600 rounded-l-lg py-2 px-3 focus:outline-none focus:border-indigo-500"
                                placeholder="Type a message..."
                                value={chatInput}
                                onChange={handleChatInputChange}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleSendMessage();
                                }}
                            />
                            <button
                                onClick={handleSendMessage}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    // Authentication States
    const [currentUser, setCurrentUser] = useState(null); 
    const [userProfile, setUserProfile] = useState(null); 
    const [showLoginModal, setShowLoginModal] = useState(true); 
    const [isRegisterMode, setIsRegisterMode] = useState(false); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mobileNumber, setMobileNumber] = useState(''); 
    const [authError, setAuthError] = useState(''); 
    const [isAuthReady, setIsAuthReady] = useState(false); 
    // App Navigation States
    const [currentPage, setCurrentPage] = useState('challenges'); 
    const [selectedChallenge, setSelectedChallenge] = useState(null); 

    // Challenges Data States
    const [challenges, setChallenges] = useState([]); 
    const [loadingChallenges, setLoadingChallenges] = useState(true);

    // Code Editor & Test Result States
    const [userCode, setUserCode] = useState(''); 
    const [testResults, setTestResults] = useState([]); 

    // Zinda Chatbot States
    const [chatMessages, setChatMessages] = useState([]); 
    const [chatInput, setChatInput] = useState('');
    const chatMessagesEndRef = useRef(null); 

    // Filtering and Search States for Challenges
    const [filterDifficulty, setFilterDifficulty] = useState('All'); 
    const [filterTopic, setFilterTopic] = useState('All');
    const [searchTerm, setSearchTerm] = useState(''); 

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                setShowLoginModal(false);

                const userDocRef = doc(db, `users/${__app_id}/userProfiles`, user.uid);

                const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data());
                    } else {
                        console.log("Creating new user profile for:", user.uid);
                        setDoc(userDocRef, {
                            points: 0,
                            level: 1,
                            badges: [],
                            completedChallenges: [], // Initialize completed challenges array
                            createdAt: new Date().toISOString(),
                            email: user.email || null,
                            mobileNumber: null, 
                            photoURL: user.photoURL || null, 
                            displayName: user.displayName || user.email?.split('@')[0] || `User_${user.uid.substring(0, 6)}`
                        }).then(() => {
                            
                            setUserProfile({
                                points: 0,
                                level: 1,
                                badges: [],
                                completedChallenges: [],
                                createdAt: new Date().toISOString(),
                                email: user.email || null,
                                mobileNumber: null,
                                photoURL: user.photoURL || null,
                                displayName: user.displayName || user.email?.split('@')[0] || `User_${user.uid.substring(0, 6)}`
                            });
                        }).catch(error => {
                            console.error("Error creating user profile:", error);
                        });
                    }
                    setAuthError(''); 
                }, (error) => {
                    console.error("Error fetching user profile:", error);
                    setAuthError(`Failed to load profile: ${error.message}`);
                });

                return () => unsubscribeProfile();
            } else {
                setShowLoginModal(true);
                setUserProfile(null);
                setAuthError(''); 
            }
            setIsAuthReady(true); 
        });

        return () => unsubscribeAuth();
    }, []);


    // --- Authentication Handlers ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError(''); 
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setEmail('');
            setPassword('');
        } catch (error) {
            console.error("Login error:", error.code, error.message);
            setAuthError(error.message);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setAuthError(''); 
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Send email verification
            await sendEmailVerification(user);
            console.log("Registered and verification email sent:", user.uid);
            setAuthError('Registration successful! Please check your email to verify your account. You can now log in.');

            // Create user profile in Firestore
            const userDocRef = doc(db, `users/${__app_id}/userProfiles`, user.uid);
            await setDoc(userDocRef, {
                points: 0,
                level: 1,
                badges: [],
                completedChallenges: [],
                createdAt: new Date().toISOString(),
                email: user.email,
                mobileNumber: mobileNumber || null,
                photoURL: user.photoURL || null,
                displayName: user.displayName || user.email?.split('@')[0] // Set initial display name
            });

            // Redirect to login mode after successful registration and verification email sent
            setIsRegisterMode(false);
            setEmail('');
            setPassword('');
            setMobileNumber('');
        } catch (error) {
            console.error("Registration error:", error.code, error.message);
            setAuthError(error.message);
        }
    };

    const handleAnonymousSignIn = async () => {
        setAuthError('');
        try {
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
        } catch (error) {
            console.error("Anonymous sign-in error:", error.code, error.message);
            setAuthError(error.message);
        }
    };

    const handleForgotPassword = async () => {
        setAuthError('');
        if (!email) {
            setAuthError("Please enter your email to reset password.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setAuthError('Password reset email sent! Check your inbox.');
        } catch (error) {
            console.error("Password reset error:", error.code, error.message);
            setAuthError(error.message);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log("User logged out successfully.");
            setCurrentPage('challenges'); // Redirect to challenges page after logout
        } catch (error) {
            console.error("Logout error:", error.message);
            setAuthError(error.message);
        }
    };

    const handleDeleteAccount = async () => {
        if (!currentUser || !userProfile) {
            setAuthError("No user logged in to delete.");
            return;
        }

        const confirmDelete = window.confirm("Are you sure you want to delete your account? This action is irreversible.");

        if (confirmDelete) {
            try {
                // Delete profile picture from Storage first (if exists)
                if (userProfile.photoURL) {
                    const profilePicRef = ref(storage, `profilePictures/${currentUser.uid}/profile.jpg`);
                    await deleteObject(profilePicRef).catch(e => console.warn("No profile picture to delete or error deleting:", e.message));
                }

                // Delete user profile document from Firestore
                const userDocRef = doc(db, `users/${__app_id}/userProfiles`, currentUser.uid);
                await updateDoc(userDocRef, { deleted: true }).catch(e => console.warn("Error marking user profile as deleted:", e.message));
                await deleteUser(currentUser);
                console.log("User account deleted.");
                setCurrentPage('challenges');
            } catch (error) {
                console.error("Account deletion error:", error.message);
                setAuthError(`Failed to delete account: ${error.message}. You might need to re-authenticate (log in again) to delete your account.`);
            }
        }
    };


    // --- Profile Picture Handling ---
    const handleProfilePictureUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || !currentUser) return;

        setAuthError('');
        const profilePicRef = ref(storage, `profilePictures/${currentUser.uid}/profile.jpg`);
        try {
            await uploadBytes(profilePicRef, file);
            const photoURL = await getDownloadURL(profilePicRef);
            await updateProfile(currentUser, { photoURL });
            const userDocRef = doc(db, `users/${__app_id}/userProfiles`, currentUser.uid);
            await updateDoc(userDocRef, { photoURL });

            console.log("Profile picture uploaded and updated.");
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            setAuthError(`Failed to upload profile picture: ${error.message}`);
        }
    };

    const handleRemoveProfilePicture = async () => {
        if (!currentUser || !userProfile?.photoURL) return;

        setAuthError('');
        const profilePicRef = ref(storage, `profilePictures/${currentUser.uid}/profile.jpg`);
        try {
            // Delete file from Firebase Storage
            await deleteObject(profilePicRef);

            // Update user's profile in Firebase Authentication
            await updateProfile(currentUser, { photoURL: null });

            // Update user's profile document in Firestore
            const userDocRef = doc(db, `users/${__app_id}/userProfiles`, currentUser.uid);
            await updateDoc(userDocRef, { photoURL: null });

            console.log("Profile picture removed.");
        } catch (error) {
            console.error("Error removing profile picture:", error);
            setAuthError(`Failed to remove profile picture: ${error.message}`);
        }
    };


    // --- Challenge Management ---
    useEffect(() => {
        if (!db || !isAuthReady) {
            return; 
        }

        const fetchChallenges = async () => {
            setLoadingChallenges(true);
            try {
                const challengesCollectionRef = collection(db, `artifacts/${__app_id}/public/data/challenges`);
                const q = query(challengesCollectionRef);
                const querySnapshot = await getDocs(q);
                const fetched = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const deserializedTestCases = data.testCases ? data.testCases.map(tc => {
                        try {
                            return {
                                input: JSON.parse(tc.input),
                                expectedOutput: JSON.parse(tc.expectedOutput)
                            };
                        } catch (e) {
                            console.error(`Error parsing testCase for challenge ${doc.id}:`, tc, e);
                            return tc;
                        }
                    }) : [];

                    return {
                        id: doc.id,
                        ...data,
                        testCases: deserializedTestCases,
                        starterCode: data.starterCode || `function ${data.entryPoint || 'myFunction'}(/* args */) {\n  // Write your code here\n}\n`
                    };
                });
                fetched.sort((a, b) => {
                    const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
                    const diffA = difficultyOrder[a.difficulty] || 99; // Default to high for unknown
                    const diffB = difficultyOrder[b.difficulty] || 99;

                    if (diffA !== diffB) return diffA - diffB;
                    return a.title.localeCompare(b.title);
                });
                setChallenges(fetched);
                if (fetched.length > 0) {
                    setSelectedChallenge(fetched[0]);
                    setUserCode(fetched[0].starterCode || '');
                }
            } catch (error) {
                console.error("Error fetching challenges:", error);
                setAuthError(`Failed to load challenges: ${error.message}. Check your Firestore rules and seed data.`);
            } finally {
                setLoadingChallenges(false);
            }
        };

        fetchChallenges();
    }, [db, isAuthReady]); 


    const handleChallengeSelect = (challenge) => {
        setCurrentPage('challenges'); 
        setSelectedChallenge(challenge);
        setUserCode(challenge.starterCode || ''); 
        setTestResults([]); 
        setChatMessages([]); 
    };

    const handleCodeChange = (e) => {
        setUserCode(e.target.value);
    };

    const handleRunTests = useCallback(() => {
        if (!selectedChallenge || !userCode.trim()) {
            setTestResults([{ type: 'error', message: 'Please select a challenge and write some code.', passed: false }]);
            return;
        }

        const newTestResults = [];
        try {
            
            const userFunctionWrapperCode = `
                ${userCode}; // User's code is executed, which should define the function
                if (typeof ${selectedChallenge.entryPoint} === 'function') {
                    return ${selectedChallenge.entryPoint};
                } else {
                    throw new Error('Function "${selectedChallenge.entryPoint}" not found or not a function in your code.');
                }
            `;
            const getUserFunction = new Function(userFunctionWrapperCode);
            const userSolutionFunction = getUserFunction(); // This call executes the wrapper code and returns the user's function

            selectedChallenge.testCases.forEach((testCase, index) => {
                let passed = false;
                let actualOutput = null;
                let error = null;

                try {
                  
                    const inputs = Array.isArray(testCase.input) ? testCase.input : [testCase.input];
                    actualOutput = userSolutionFunction(...inputs); // Call the user's function with spread inputs

                    // Compare outputs, handling arrays/objects by stringifying for deep comparison
                    if (JSON.stringify(actualOutput) === JSON.stringify(testCase.expectedOutput)) {
                        passed = true;
                    }
                } catch (e) {
                    error = e.message;
                    console.error(`Error in Test Case ${index + 1}:`, e);
                }

                newTestResults.push({
                    testCaseIndex: index + 1,
                    passed,
                    actualOutput: actualOutput !== null && actualOutput !== undefined ? JSON.stringify(actualOutput) : 'N/A',
                    expectedOutput: JSON.stringify(testCase.expectedOutput),
                    error
                });
            });

        } catch (e) {
            console.error("Error parsing or getting user function:", e);
            newTestResults.push({ type: 'error', message: `Code Setup Error: ${e.message}. Ensure your function "${selectedChallenge.entryPoint}" is correctly defined.`, passed: false });
        }
        setTestResults(newTestResults);
    }, [selectedChallenge, userCode]); 


    const handleSubmitSolution = async () => {
        if (!currentUser || !userProfile || !selectedChallenge) {
            alert('Please log in to submit solutions.');
            return;
        }

        handleRunTests();

        setTimeout(async () => {
            const allTestsPassed = testResults.length > 0 && testResults.every(result => result.passed);

            if (allTestsPassed) {
                let pointsEarned = selectedChallenge.points || 0; 
                let newBadge = null;

                const alreadyCompleted = userProfile.completedChallenges && userProfile.completedChallenges.includes(selectedChallenge.id);

                if (alreadyCompleted) {
                    pointsEarned = 0; 
                    alert("You've already completed this challenge!");
                } else {
                    newBadge = `${selectedChallenge.title} Master`; 
                    await updateUserProgress(currentUser.uid, pointsEarned, selectedChallenge.id, newBadge);
                    alert(`Challenge completed! You earned ${pointsEarned} points and the "${newBadge}" badge (if new)!`);
                    setAuthError(''); 
                    setCurrentPage('challenges');
                }

            } else {
                alert("Not all tests passed. Please fix your code before submitting.");
            }
        }, 100);
    };


    const updateUserProgress = async (userId, pointsToAdd, completedChallengeId = null, specificBadge = null) => {
        const userDocRef = doc(db, `users/${__app_id}/userProfiles`, userId);
        try {
            const currentProfileSnap = await getDoc(userDocRef);
            const currentProfileData = currentProfileSnap.exists() ? currentProfileSnap.data() : { points: 0, level: 1, badges: [], completedChallenges: [] };

            let updatedPoints = (currentProfileData.points || 0) + pointsToAdd;
            let updatedLevel = currentProfileData.level || 1;
            let updatedBadges = new Set(currentProfileData.badges || []); // Use Set to avoid duplicates
            let updatedCompletedChallenges = new Set(currentProfileData.completedChallenges || []);

            if (completedChallengeId) {
                updatedCompletedChallenges.add(completedChallengeId);
            }

            if (specificBadge) {
                updatedBadges.add(specificBadge);
            }

            const pointsForNextLevel = updatedLevel * 100;
            if (updatedPoints >= pointsForNextLevel) {
                updatedLevel++;
                updatedBadges.add(`Level ${updatedLevel - 1} Achieved`); // Award badge for previous level
                console.log(`User leveled up to Level ${updatedLevel}!`);
            }

            if (updatedPoints >= 50 && !updatedBadges.has('Novice Coder')) updatedBadges.add('Novice Coder');
            if (updatedPoints >= 150 && !updatedBadges.has('Problem Solver')) updatedBadges.add('Problem Solver');
            if (updatedPoints >= 300 && !updatedBadges.has('Algorithm Enthusiast')) updatedBadges.add('Algorithm Enthusiast');
            if (updatedCompletedChallenges.size >= 5 && !updatedBadges.has('Challenge Seeker')) updatedBadges.add('Challenge Seeker');
            if (updatedCompletedChallenges.size >= 10 && !updatedBadges.has('Pro Developer')) updatedBadges.add('Pro Developer');
            if (updatedPoints >= 500 && !updatedBadges.has('Datacraft Master')) updatedBadges.add('Datacraft Master');
            if (updatedPoints >= 1000 && !updatedBadges.has('Grand Champion')) updatedBadges.add('Grand Champion');

            await updateDoc(userDocRef, {
                points: updatedPoints,
                level: updatedLevel,
                badges: Array.from(updatedBadges), 
                completedChallenges: Array.from(updatedCompletedChallenges)
            });

            const leaderboardDocRef = doc(db, `artifacts/${__app_id}/public/data/leaderboard`, userId);
            await setDoc(leaderboardDocRef, {
                userId: userId,
                displayName: currentUser?.displayName || currentProfileData.displayName || currentUser?.email?.split('@')[0] || `User_${userId.substring(0,6)}`, // Use displayName from currentProfileData if available
                points: updatedPoints,
                level: updatedLevel,
                lastUpdated: new Date().toISOString()
            }, { merge: true }); 

        } catch (error) {
            console.error("Error updating user progress:", error);
            setAuthError(`Failed to update progress: ${error.message}`);
        }
    };


    // --- Leaderboard Data Fetching ---
    const [leaderboardData, setLeaderboardData] = useState([]);
    useEffect(() => {
        if (!db || !isAuthReady) return; 

        const leaderboardCollectionRef = collection(db, `artifacts/${__app_id}/public/data/leaderboard`);
        const q = query(leaderboardCollectionRef);

        const unsubscribeLeaderboard = onSnapshot(q, (snapshot) => {
            const fetchedLeaderboard = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                fetchedLeaderboard.push({
                    id: doc.id,
                    userId: data.userId,
                    displayName: data.displayName || `User_${data.userId.substring(0,6)}`, // Fallback for display name
                    points: data.points,
                    level: data.level
                });
            });
            // Sort leaderboard by points descending
            fetchedLeaderboard.sort((a, b) => b.points - a.points);
            setLeaderboardData(fetchedLeaderboard);
            console.log("Leaderboard data updated from Firestore:", fetchedLeaderboard);
        }, (error) => {
            console.error("Error listening to leaderboard:", error);
            setAuthError(`Failed to load leaderboard: ${error.message}`);
        });

        return () => unsubscribeLeaderboard();
    }, [db, isAuthReady]);


    // --- Zinda AI Chat Integration ---
    const handleChatInputChange = (e) => {
        setChatInput(e.target.value);
    };

    const handleSendMessage = async () => {
        if (chatInput.trim() === '') return;

        const userMessage = { sender: 'user', text: chatInput };
        setChatMessages(prevMessages => [...prevMessages, userMessage]);
        setChatInput(''); 

        const typingMessage = { sender: 'zinda', text: 'Zinda is typing...', isTyping: true };
        setChatMessages((prevMessages) => [...prevMessages, typingMessage]);


        try {
            let basePrompt = `You are Zinda, a friendly and encouraging AI assistant for Datacraft, a gamified coding platform. Your purpose is to help users with coding challenges, offer encouragement, and answer general programming questions. Always keep your responses concise, positive, and guiding. Do NOT provide direct solutions to coding problems. Guide the user towards the solution step-by-step.`;

            if (currentPage === 'challenges' && selectedChallenge) {
                basePrompt += `\n\nCurrently, the user is on the "${selectedChallenge.title}" challenge page. Here is the problem description: "${selectedChallenge.description}". The entry point function is "${selectedChallenge.entryPoint}".`;
                if (userCode) {
                    basePrompt += `\nUser's current code attempt:\n\`\`\`javascript\n${userCode}\n\`\`\``;
                }
                if (testResults.length > 0) {
                    basePrompt += `\nLatest test results:\n${JSON.stringify(testResults, null, 2)}`;
                }
                basePrompt += `\n\nWhen responding to questions about this challenge, focus on providing hints, clarifying parts of the description, explaining related concepts, or suggesting approaches. Remember: NO direct code solutions.`;
            } else if (currentPage === 'learning') {
                basePrompt += `\n\nThe user is currently in the 'Learning' section, focusing on Data Structures and Algorithms. Provide conceptual explanations or resource suggestions.`;
            } else {
                basePrompt += `\n\nIf the user asks about a specific challenge, remind them to navigate to that challenge's page for contextual help.`;
            }

            const fullPrompt = `${basePrompt}\n\nThe user just asked: "${userMessage.text}"`;

            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: fullPrompt }] }); 
            const payload = { contents: chatHistory };

        
            const geminiApiKey = "AIzaSyBPNhcZlMH06cR17jBaDl-MVqTrGOmIIqg"; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            setChatMessages((prevMessages) => prevMessages.filter(msg => !msg.isTyping));

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const zindaResponseText = result.candidates[0].content.parts[0].text;
                setChatMessages((prevMessages) => [...prevMessages, { sender: 'zinda', text: zindaResponseText }]);
            } else {
                console.error("Zinda: Unexpected API response structure:", result);
                setChatMessages((prevMessages) => [...prevMessages, { sender: 'zinda', text: "Sorry, I couldn't generate a response. Please try again." }]);
            }
        } catch (error) {
            console.error("Error communicating with Zinda (Gemini API):", error);
            setChatMessages((prevMessages) => prevMessages.filter(msg => !msg.isTyping));
            setChatMessages((prevMessages) => [...prevMessages, { sender: 'zinda', text: "Oops! I'm having trouble connecting right now. Please check your internet connection or try again later." }]);
        }
    };


    // --- Filtering and Search Logic for Challenges ---
    const filteredChallenges = useMemo(() => {
        return challenges.filter(challenge => {
            const matchesDifficulty = filterDifficulty === 'All' || challenge.difficulty === filterDifficulty;
            const matchesTopic = filterTopic === 'All' || challenge.topic === filterTopic;
            const matchesSearch = searchTerm.trim() === '' ||
                challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesDifficulty && matchesTopic && matchesSearch;
        });
    }, [challenges, filterDifficulty, filterTopic, searchTerm]);

    // Extract unique topics for the dropdown
    const uniqueTopics = useMemo(() => {
        const topics = new Set();
        challenges.forEach(c => topics.add(c.topic));
        return ['All', ...Array.from(topics).sort()];
    }, [challenges]);


    // --- Conditional Rendering for Main Pages ---
    const renderMainContent = () => {
        if (!isAuthReady) {
            return (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-xl text-gray-400 animate-pulse">Loading Datacraft...</p>
                </div>
            );
        }

        switch (currentPage) {
            case 'challenges':
                return (
                    <div className="flex flex-col lg:flex-row flex-1 p-6 space-y-6 lg:space-y-0 lg:space-x-6">
                        {/* Challenge List Sidebar */}
                        <aside className="w-full lg:w-1/4 bg-gray-800 rounded-lg shadow-lg p-4 custom-scrollbar overflow-y-auto max-h-[calc(100vh-100px)]">
                            <h2 className="text-xl font-bold text-gray-100 mb-4">Coding Challenges</h2>

                            {/* Filter and Search Controls within sidebar */}
                            <div className="mb-4 space-y-3">
                                {/* Difficulty Filter */}
                                <div className="space-y-1">
                                    <span className="text-gray-400 font-semibold text-sm">Difficulty:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
                                            <button
                                                key={diff}
                                                onClick={() => setFilterDifficulty(diff)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                    filterDifficulty === diff
                                                        ? 'bg-purple-600 text-white shadow-md'
                                                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                                }`}
                                            >
                                                {diff}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Topic Filter */}
                                <div className="space-y-1">
                                    <span className="text-gray-400 font-semibold text-sm">Topic:</span>
                                    <select
                                        onChange={(e) => setFilterTopic(e.target.value)}
                                        value={filterTopic}
                                        className="w-full px-3 py-1 rounded-full border border-gray-500 bg-gray-700 text-gray-200 text-sm focus:ring-1 focus:ring-purple-400 focus:border-transparent"
                                    >
                                        {uniqueTopics.map(topic => (
                                            <option key={topic} value={topic}>{topic}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Search Bar */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search challenges..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1 rounded-full border border-gray-500 bg-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                                    />
                                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        &#x1F50D; {/* Search icon */}
                                    </span>
                                </div>
                            </div>

                            {/* Display Filtered Challenges */}
                            {loadingChallenges ? (
                                <p className="text-gray-400 text-sm">Loading challenges...</p>
                            ) : filteredChallenges.length > 0 ? (
                                <ul className="space-y-2">
                                    {filteredChallenges.map((challenge) => (
                                        <li key={challenge.id}>
                                            <button
                                                onClick={() => handleChallengeSelect(challenge)}
                                                className={`w-full text-left p-3 rounded-md transition-colors duration-200 flex flex-col ${
                                                    selectedChallenge && selectedChallenge.id === challenge.id
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                }`}
                                            >
                                                <span className="font-semibold">{challenge.title}</span>
                                                <span className={`text-xs font-medium mt-1 ${
                                                    challenge.difficulty === 'Easy' ? 'text-green-300' :
                                                    challenge.difficulty === 'Medium' ? 'text-yellow-300' : 'text-red-300'
                                                }`}>
                                                    Difficulty: {challenge.difficulty}
                                                </span>
                                                {userProfile?.completedChallenges?.includes(challenge.id) && (
                                                    <span className="text-green-400 text-xs mt-1">Completed</span>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 italic text-sm mt-4">No challenges match your filters.</p>
                            )}
                        </aside>

                        {/* Main Challenge Content Area */}
                        <main className="flex-1 bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
                            {selectedChallenge ? (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-100 mb-4">{selectedChallenge.title}</h2>
                                    <p className="text-gray-300 mb-6 whitespace-pre-wrap">{selectedChallenge.description}</p>

                                    {/* Code Editor */}
                                    <h3 className="text-xl font-semibold text-gray-100 mb-2">Your Code:</h3>
                                    <textarea
                                        className="w-full h-48 bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 custom-scrollbar"
                                        value={userCode}
                                        onChange={handleCodeChange}
                                        placeholder={`function ${selectedChallenge.entryPoint}(/* args */) {\n  // Write your code here\n}\n`}
                                    ></textarea>

                                    <div className="flex space-x-4 mb-6">
                                        <button
                                            onClick={handleRunTests}
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            Run Tests
                                        </button>
                                        <button
                                            onClick={handleSubmitSolution}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            Submit Solution
                                        </button>
                                    </div>

                                    {/* Test Results */}
                                    {testResults.length > 0 && (
                                        <div className="bg-gray-700 p-4 rounded-md mt-4">
                                            <h3 className="text-xl font-semibold text-gray-100 mb-2">Test Results:</h3>
                                            {testResults.map((result, index) => (
                                                <div key={index} className={`mb-2 p-2 rounded-md ${result.passed ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
                                                    <p className="font-bold">Test Case {result.testCaseIndex}: {result.passed ? 'PASS' : 'FAIL'}</p>
                                                    <p className="text-xs">Input: {result.testCase}</p>
                                                    <p className="text-xs">Expected: {result.expectedOutput}</p>
                                                    <p className="text-xs">Actual: {result.actualOutput}</p>
                                                    {result.error && <p className="text-xs text-red-300">Error: {result.error}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-gray-400">Select a challenge from the sidebar to begin.</p>
                            )}
                        </main>
                    </div>
                );
            case 'leaderboard':
                return (
                    <div className="p-6 max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-gray-100 mb-6 text-center">Leaderboard</h2>
                        {leaderboardData.length > 0 ? (
                            <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-lg">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Player</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Points</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Level</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {leaderboardData.map((entry, index) => (
                                            <tr key={entry.id} className="hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{index + 1}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                                                    {entry.displayName || `User_${entry.userId.substring(0, 6)}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-400 font-bold">{entry.points}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{entry.level}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center text-lg">No one on the leaderboard yet. Be the first to score points!</p>
                        )}
                    </div>
                );
            case 'profile':
                return (
                    <div className="p-6 max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold text-gray-100 mb-6 text-center">Your Profile</h2>
                        {currentUser && userProfile ? (
                            <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
                                <div className="flex flex-col items-center mb-6">
                                    {/* Profile Picture Display and Upload */}
                                    <div className="relative w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mb-4 border-2 border-indigo-500">
                                        {userProfile.photoURL ? (
                                            <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.706 0 8.87 2.185 11.996 5.993zM12 12.5c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"></path>
                                            </svg>
                                        )}
                                        <input
                                            type="file"
                                            id="profile-picture-upload"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleProfilePictureUpload}
                                        />
                                        <label htmlFor="profile-picture-upload" className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors">
                                            {/* Camera Icon */}
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 6.293A1 1 0 015.586 7H4zm0 2h12v8H4V7zM9 12a3 3 0 116 0 3 3 0 01-6 0z" clipRule="evenodd" />
                                            </svg>
                                        </label>
                                    </div>
                                    {userProfile.photoURL && (
                                        <button onClick={handleRemoveProfilePicture} className="text-red-400 hover:text-red-300 text-sm mt-2 transition-colors">
                                            Remove Profile Picture
                                        </button>
                                    )}
                                </div>

                                {/* User Details */}
                                <div className="text-gray-300 space-y-3">
                                    <p><span className="font-semibold text-indigo-400">Display Name:</span> {userProfile.displayName || 'N/A'}</p>
                                    <p><span className="font-semibold text-indigo-400">Email:</span> {currentUser.email || 'N/A (Anonymous)'}</p>
                                    {currentUser.email && (
                                        <p><span className="font-semibold text-indigo-400">Verification Status:</span> {currentUser.emailVerified ? <span className="text-green-400">Verified</span> : <span className="text-red-400">Not Verified</span>}
                                            {!currentUser.emailVerified && (
                                                <button onClick={() => sendEmailVerification(currentUser)} className="text-blue-400 hover:text-blue-300 text-sm ml-2 transition-colors">
                                                    Resend Verification Email
                                                </button>
                                            )}
                                        </p>
                                    )}
                                    <p><span className="font-semibold text-indigo-400">Mobile Number:</span> {userProfile.mobileNumber || 'N/A'}</p>
                                    <p><span className="font-semibold text-indigo-400">Points:</span> {userProfile.points}</p>
                                    <p><span className="font-semibold text-indigo-400">Level:</span> {userProfile.level}</p>
                                    <p><span className="font-semibold text-indigo-400">Badges:</span></p>
                                    {userProfile.badges && userProfile.badges.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {userProfile.badges.map((badge, index) => (
                                                <span key={index} className="bg-yellow-700 text-yellow-100 px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                                                    {badge}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 ml-4">No badges earned yet. Keep coding!</p>
                                    )}
                                    <p><span className="font-semibold text-indigo-400">Account Created:</span> {new Date(userProfile.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="mt-8 flex justify-center space-x-4">
                                    {currentUser.isAnonymous ? (
                                        <p className="text-gray-400 italic">Guest accounts cannot be deleted directly. Log in with email/password to manage.</p>
                                    ) : (
                                        <button
                                            onClick={handleDeleteAccount}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            Delete Account
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center text-lg">Please log in to view your profile.</p>
                        )}
                    </div>
                );
            case 'learning':
                return (
                    <div className="p-6 max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-gray-100 mb-6 text-center">Learning Section (DSA Concepts)</h2>
                        <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
                            <p className="text-gray-300 mb-4 text-lg">
                                Welcome to the learning section! Here you can master Data Structures and Algorithms with structured learning paths, quizzes, and earn certifications.
                            </p>
                            <p className="text-gray-400 mb-6 italic">
                                This section is under development. Here's what you can expect:
                            </p>
                            <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                                <li>**Structured Learning Paths:** Dive into core DSA concepts like Arrays, Linked Lists, Trees, Graphs, Sorting, Searching, and more.</li>
                                <li>**Interactive Modules:** Each path will contain modules with clear explanations, code examples, and visual aids.</li>
                                <li>**Knowledge Quizzes:** Test your understanding with short quizzes after each module to solidify your learning.</li>
                                <li>**Certifications & Badges:** Earn special badges and certifications upon completing entire learning paths, validating your DSA knowledge!</li>
                            </ul>
                            <p className="text-yellow-300 text-center">
                                Stay tuned for updates! We're actively building this valuable resource for aspiring coders.
                            </p>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-xl text-gray-400">Page not found. Please use the navigation.</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
            {/* Login/Register Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700 relative">
                        <h2 className="text-3xl font-bold text-white mb-6 text-center">
                            {isRegisterMode ? 'Register' : 'Login'} to Datacraft
                        </h2>
                        {authError && <p className="bg-red-900 text-red-300 p-3 rounded-md mb-4 text-center text-sm">{authError}</p>}
                        <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    className="shadow appearance-none border border-gray-700 rounded w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-700"
                                    placeholder="your@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    className="shadow appearance-none border border-gray-700 rounded w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-700"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {isRegisterMode && (
                                <div>
                                    <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="mobileNumber">
                                        Mobile Number (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        id="mobileNumber"
                                        className="shadow appearance-none border border-gray-700 rounded w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-700"
                                        placeholder="e.g., +15551234567"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                    />
                                </div>
                            )}
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {isRegisterMode ? 'Register Account' : 'Sign In'}
                            </button>
                        </form>

                        {/* Forgot Password / Switch Mode / Anonymous Sign In */}
                        <div className="mt-6 text-center space-y-3">
                            <p className="text-sm">
                                {isRegisterMode ? "Already have an account?" : "Don't have an account?"}{' '}
                                <button
                                    onClick={() => { setIsRegisterMode(!isRegisterMode); setAuthError(''); }}
                                    className="text-indigo-400 hover:text-indigo-300 font-bold focus:outline-none transition-colors"
                                >
                                    {isRegisterMode ? 'Sign In' : 'Register Here'}
                                </button>
                            </p>
                            {!isRegisterMode && (
                                <>
                                    <button
                                        onClick={handleForgotPassword}
                                        className="text-gray-400 hover:text-white text-sm focus:outline-none transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                    <p className="text-gray-500 text-xs">or</p>
                                    <button
                                        onClick={handleAnonymousSignIn}
                                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        Continue as Guest
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!showLoginModal && (
                <>
                    {/* Header */}
                    <header className="bg-gray-800 p-4 shadow-md flex justify-between items-center z-10">
                        <h1 className="text-3xl font-extrabold text-white">Datacraft</h1>
                        <nav className="flex items-center space-x-6">
                            <button
                                onClick={() => setCurrentPage('challenges')}
                                className={`text-lg font-medium transition-colors duration-200 ${currentPage === 'challenges' ? 'text-indigo-400' : 'text-gray-300 hover:text-white'}`}
                            >
                                Challenges
                            </button>
                            <button
                                onClick={() => setCurrentPage('leaderboard')}
                                className={`text-lg font-medium transition-colors duration-200 ${currentPage === 'leaderboard' ? 'text-indigo-400' : 'text-gray-300 hover:text-white'}`}
                            >
                                Leaderboard
                            </button>
                            <button
                                onClick={() => setCurrentPage('learning')}
                                className={`text-lg font-medium transition-colors duration-200 ${currentPage === 'learning' ? 'text-indigo-400' : 'text-gray-300 hover:text-white'}`}
                            >
                                Learn DSA
                            </button>
                            {currentUser ? (
                                <>
                                    <button
                                        onClick={() => setCurrentPage('profile')}
                                        className={`text-lg font-medium transition-colors duration-200 ${currentPage === 'profile' ? 'text-indigo-400' : 'text-gray-300 hover:text-white'}`}
                                    >
                                        Profile ({userProfile?.points || 0} pts)
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowLoginModal(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                                >
                                    Login / Register
                                </button>
                            )}
                        </nav>
                    </header>

                    <div className="flex flex-1 overflow-hidden">
                        {/* Main Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {renderMainContent()}
                        </div>
                    </div>

                    {/* Zinda Floating Chat */}
                    <ZindaFloatingChat
                        chatMessages={chatMessages}
                        setChatMessages={setChatMessages}
                        chatInput={chatInput}
                        setChatInput={setChatInput}
                        handleChatInputChange={handleChatInputChange}
                        handleSendMessage={handleSendMessage}
                        chatMessagesEndRef={chatMessagesEndRef}
                        selectedChallenge={selectedChallenge}
                        currentPage={currentPage}
                    />
                </>
            )}
        </div>
    );
};

export default App; 