import { initializeApp } from "firebase/app";
import { getFirestore, collection} from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAkjcYahYdUHhYzsVHsNnYa0k5ePNBAyrw",
  authDomain: "forfeit-to-the-machine.firebaseapp.com",
  projectId: "forfeit-to-the-machine",
  storageBucket: "forfeit-to-the-machine.firebasestorage.app",
  messagingSenderId: "343704375650",
  appId: "1:343704375650:web:60afe55188146238e19c3b"
};

initializeApp(firebaseConfig);
export const db = getFirestore();

export const colRef = collection(db, "images");