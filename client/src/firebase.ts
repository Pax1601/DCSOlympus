// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyArFxFtLvZqV6RKMxZR-zCH-TT3LV43aVg",
  authDomain: "dcs-olympus.firebaseapp.com",
  projectId: "dcs-olympus",
  storageBucket: "dcs-olympus.appspot.com",
  messagingSenderId: "393187308632",
  appId: "1:393187308632:web:545dc9551716a84d3c462d",
  measurementId: "G-10E10S2WBN"
};

// Initialize Firebase
const firebase  = initializeApp( firebaseConfig );

const analytics = getAnalytics( firebase );
const firestore = getFirestore( firebase );


export { firebase, analytics, firestore };