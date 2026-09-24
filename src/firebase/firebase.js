// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCIls4XQbgnr-qJzWpMfzkXwLs_bE-VzFw",
  authDomain: "smart-irrigation-bd46c.firebaseapp.com",
  databaseURL: "https://smart-irrigation-bd46c-default-rtdb.firebaseio.com",
  projectId: "smart-irrigation-bd46c",
  storageBucket: "smart-irrigation-bd46c.firebasestorage.app",
  messagingSenderId: "86147427434",
  appId: "1:86147427434:web:584694057c09f40f32ee13",
  measurementId: "G-19C265THTE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

module.exports = { app, analytics };