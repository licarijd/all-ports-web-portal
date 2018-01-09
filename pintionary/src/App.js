import React, { Component } from 'react';
import firebase, { auth, provider } from './fire.js';
import logo from './logo.svg';
import './App.css';
import FileUploader from 'react-firebase-file-uploader';

const storage = firebase.storage().ref()
const google = window.google;
var mapName = "testMap";
var userID;

var markers = [];
var lines = [];

class App extends Component {

  constructor() {
    super();
    this.state = {
      currentItem: '',
      username: '',
      items: [],
      user: null, // <-- add this line

      test: ''
    }
    
    this.getImage('images/test');

    this.login = this.login.bind(this); // <-- add this line
    this.logout = this.logout.bind(this); // <-- add this line
  }

    getImage (image) {
    let { state } = this
    storage.child(`${image}.png`).getDownloadURL().then((url) => {
      state[image] = url
      this.setState({test: state[image]})
    }).catch((error) => {
      // Handle any errors
    })
  }

  handleUploadStart = () => this.setState({isUploading: true, progress: 0});
  handleProgress = (progress) => this.setState({progress});
  handleUploadError = (error) => {
    this.setState({isUploading: false});
    console.error(error);
  }

  pinMode = true;

  handleChange(e) {
    /* ... */
  }
  logout() {
    auth.signOut()
    .then(() => {
      this.setState({
        user: null
      });
    });
  }
  login() {
    auth.signInWithPopup(provider) 
      .then((result) => {
        const user = result.user;
        console.log("user: " + user);
        this.setState({
          user
        });
      });

  }

  //Dismiss overlay when user clicks "get started" button
  dismissIntro(){
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  addRoute(){
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  addPin(){
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  savePin(){
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  saveRoute(){
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  save(){
     
        document.getElementById("savedata").value = "";

        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i].position;
            document.getElementById("savedata").value += marker;           
        }

       for (var i = 0; i < lines.length; i++) {
            var line = lines[i].getPath().getArray();
            document.getElementById("savedata").value += line;
        }

        var mapData = document.getElementById("savedata").value;

        
        firebase.database().ref('users/' + userID + '/maps/' + mapName).push(mapData);
  }

  load(){

        
        /* Create reference to messages in Firebase Database */
        let messagesRef = firebase.database().ref('users/' + userID + '/maps/' + mapName).orderByKey().limitToLast(100);
        messagesRef.on('child_added', snapshot => {

        /* Update React state when message is added at Firebase Database */
        let mapPlotData = { text: snapshot.val(), id: snapshot.key };
        //this.setState({ messages: [message].concat(this.state.messages) });
        console.log("mapPlotData : " + mapPlotData.text);
    })
  }

  //Render introduction overlay when web app starts
  render() {
    return (
      <div id = "interctable"> 
         <div>
        Hello Lithuania<br />
        <img src={ this.state.test } alt="test image" />
        </div> 
        <form>
              <label>photos:</label>
              {this.state.isUploading &&
              <p>Progress: {this.state.progress}</p>
              }
              {this.state.avatarURL &&
              <img src={this.state.avatarURL} />
              }
              <FileUploader
              accept="image/*"
              name="avatar"
              //randomizeFilename
              filename="test"
              storageRef={firebase.storage().ref('images')}
              onUploadStart={this.handleUploadStart}
              onUploadError={this.handleUploadError}
              onUploadSuccess={this.handleUploadSuccess}
              onProgress={this.handleProgress}
              />
          </form>
          <div className="wrapper">
          
           {this.state.user ?
              <button onClick={this.logout}>Log Out</button>                
              :
              <button onClick={this.login}>Log In</button>              
            }
  </div>   
         <div id = "intro">
            <img src={logo} className="App-logo" alt="logo" />
            <div  className="dimmed"></div>
               <h1 className="App-intro">Quick tips to familiarize you with Pintionary</h1>
               <button  onClick={this.dismissIntro} className="App-intro-button">
                Okay, let's start
               </button>
          </div>

          <div id = "side-panel">
            <button id="save" onClick={this.save} className="save-button">
                save
            </button>
          
            <textarea id="savedata" rows="8" cols="40"></textarea>
             <button  onClick={this.load} className="load-button">
                load
            </button>
          </div> 
          <div id = "tools">
          </div>  

      </div>   
    );
  }

  componentDidMount(){
    auth.onAuthStateChanged((user) => {
        if (user) {
          this.setState({ user });
          userID = user.uid;
        } 
      });

    window.initMap = this.initMap; 
    loadJS('https://maps.googleapis.com/maps/api/js?key=AIzaSyDUl_1pB8VULv0KmItP_FuzmE4Y6qy0VeQ&libraries=drawing&callback=initMap')
  }

      initMap = function() {
              var map = new google.maps.Map(document.getElementById('map'), {
                center: {lat: -34.397, lng: 150.644},
                zoom: 8
              });
        
             var drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: google.maps.drawing.OverlayType.MARKER,
                drawingControl: true,
                drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_RIGHT,
                drawingModes: ['marker', 'polyline']
            },

              markerOptions: {icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'},
              circleOptions: {
              fillColor: '#ffff00',
              fillOpacity: 1,
              strokeWeight: 5,
              clickable: false,
              editable: true,
              zIndex: 1
          }
        });

        drawingManager.setMap(map);

        google.maps.event.addDomListener(drawingManager, 'markercomplete', function(marker) {
           markers.push(marker);
        });

         google.maps.event.addDomListener(drawingManager, 'polylinecomplete', function(line) {
           lines.push(line);
        });
  
    }
}

function loadJS(src) {
    var ref = window.document.getElementsByTagName("script")[0];
    var script = window.document.createElement("script");
    script.src = src;
    script.async = true;
    ref.parentNode.insertBefore(script, ref);
}

export default App;
