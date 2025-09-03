import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence  } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDvCD4UN9tYi8MaSC_chJuZxHkWox_0rOE",
  authDomain: "collab-codeeditor-whiteboard.firebaseapp.com",
  projectId: "collab-codeeditor-whiteboard",
  storageBucket: "collab-codeeditor-whiteboard.appspot.com",
  messagingSenderId: "309268430618",
  appId: "1:309268430618:web:6dd34670bd55b6dab076a3",
  measurementId: "G-5ZQB4DL2NY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.error("Failed to set auth persistence:", error);
});