import firebase from 'firebase'
var config = {
    apiKey: "AIzaSyAddPoF3ydNzxlrbwElVycsR5-l_WqFjGQ",
    authDomain: "pintionary.firebaseapp.com",
    databaseURL: "https://pintionary.firebaseio.com",
    projectId: "pintionary",
    storageBucket: "pintionary.appspot.com",
    messagingSenderId: "308579016094"
  };
var fire = firebase.initializeApp(config);
export const provider = new firebase.auth.GoogleAuthProvider();
export const auth = firebase.auth();
export default fire;