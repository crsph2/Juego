// Copia y pega aquí TU configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDWiRZWAU9sJMat1XsYznKqC4JxIXimL4c",
  authDomain: "jmate-54676.firebaseapp.com",
  projectId: "jmate-54676",
  storageBucket: "jmate-54676.firebasestorage.app",
  messagingSenderId: "23842288171",
  appId: "1:23842288171:web:ff9175535ecccdd791706e",
  measurementId: "G-1Z33844ZT8"
};

// Inicializamos Firebase
firebase.initializeApp(firebaseConfig);

// Obtenemos la instancia de Firestore
const db = firebase.firestore();
