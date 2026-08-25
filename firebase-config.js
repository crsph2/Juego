// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCrZVGH2lU_AzUTNAldgx92jRU0goeeKE0",
  authDomain: "mate2-67072.firebaseapp.com",
  projectId: "mate2-67072",
  storageBucket: "mate2-67072.firebasestorage.app",
  messagingSenderId: "563223996556",
  appId: "1:563223996556:web:f4a982536abbdbe196f3a9",
  measurementId: "G-QYYCEV58RN"
};

// Inicializamos Firebase
firebase.initializeApp(firebaseConfig);

// Obtenemos la instancia de Firestore
const db = firebase.firestore();
