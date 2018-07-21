import firebase from 'firebase'
var config = {
    apiKey: "AIzaSyCbjUCSjDHsA_y23BHQzuamI1Kq9p28eBY",
    authDomain: "all-ports-9f7f8.firebaseapp.com",
    databaseURL: "https://all-ports-9f7f8.firebaseio.com",
    projectId: "all-ports-9f7f8",
    storageBucket: "all-ports-9f7f8.appspot.com",
    messagingSenderId: "1070498137898"
  };
var fire = firebase.initializeApp(config);
export const provider = new firebase.auth.GoogleAuthProvider();
export const auth = firebase.auth();
export default fire;