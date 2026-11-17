import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, update, remove, onValue } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBE3AKbk6OcVjTYw7cx1KSvlfoyD3VMIqg",
    authDomain: "blower-sanur.firebaseapp.com",
    databaseURL: "https://blower-sanur-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "blower-sanur",
    storageBucket: "blower-sanur.firebasestorage.app",
    messagingSenderId: "826670868490",
    appId: "1:826670868490:web:949caf39ad4be40e88d7f3"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, set, update, remove, onValue };