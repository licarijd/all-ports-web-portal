import React, { Component } from 'react';
import firebase, { auth, provider } from './fire.js';
import logo from './logo.svg';
import './App.css';
import FileUploader from 'react-firebase-file-uploader';
//import firebaseAdmin from 'firebase-admin';

const storage = firebase.storage().ref()
const google = window.google;
var mapName = "testMap";
var userID;

var allMaps = [];
var mapsChecked = false;
var listItems;

var markers = [];
var lines = [];
var r = '';
var currentMapPictures = 0;


class App extends Component {

  constructor() {
    super();
    this.state = {
      currentItem: '',
      username: '',
      items: [],
      user: null, // <-- add this line
      value: 'Please enter your map name',
      test: '',
      itemArray: []
    }

    //this.getImage('images/test');

    this.login = this.login.bind(this); // <-- add this line
    this.logout = this.logout.bind(this); // <-- add this line

    this.handleChange = this.handleChange.bind(this);
    //this.handleSubmit = this.handleSubmit.bind(this);
  }

  createMapList() {
  const item = this.state.itemArray;
  const title = 'mmmmmmmmmm';
  const text = 'dfdfdf';
  item.push({ title, text })
  this.setState({itemArray: item})
}

  handleChange(event) {
    this.setState({value: event.target.value});
    mapName = event.target.value;
    console.log(event.target.value);
  }

  /*handleSubmit(event) {
    alert('A map name was submitted: ' + this.state.value);
    event.preventDefault();
  }*/

  getImage = function (image) {
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

  handleUploadSuccess(){currentMapPictures++; console.log(currentMapPictures)};/* = (filename) => {
    this.setState({avatar: filename, progress: 100, isUploading: false});
    firebase.storage().ref('images').child(filename).getDownloadURL().then(url => this.setState({avatarURL: url}));
  };*/

  pinMode = true;

 /* handleChange(e) {
    /* ... */
//}
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
     
        var lineData;
        var pinData;

        document.getElementById("savedata").value = "";

        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i].position;
            pinData += marker + "+";           
        }

       for (var i = 0; i < lines.length; i++) {
            var line = lines[i].getPath().getArray();
            lineData += line + "+";
        }

        //var mapData = document.getElementById("savedata").value;

        //currentMap[0] = markers;
        //currentMap[1] = lines;
        //currentMap[2] = currentMapPictures;

        
        firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markers").push(/*mapData*/pinData);
        firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/lines").push(/*mapData*/lineData);
        firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/pics").push(/*mapData*/currentMapPictures);
  }

  load(){
        this.getImage('/images/test');
        /* Create reference to messages in Firebase Database */
        let messagesRef = firebase.database().ref('users/' + userID + '/maps/' + mapName).orderByKey().limitToLast(100);
        messagesRef.on('child_added', snapshot => {

        /* Update React state when message is added at Firebase Database */
        let mapPlotData = { text: snapshot.val(), id: snapshot.key };
        //this.setState({ messages: [message].concat(this.state.messages) });
        console.log("mapPlotData : " + mapPlotData.text);


        var db = firebase.database();
var ref = db.ref('users/' + userID + '/maps/');
ref.orderByChild("markers").on("child_added", function(snapshot) {
  console.log(snapshot.key + " was " + snapshot.val().markers + " meters tall");
  allMaps.push(snapshot.val().markers);
});


if (!mapsChecked){

this.createMapList();

}
mapsChecked = true;

    })

                     //const map = [1, 2, 3, 4, 5];
/*listItems = allMaps.map((item) =>
  <button key={item.toString()}>{item}</button>
);*/
  }

  //Render introduction overlay when web app starts
  render() {
    return (
      <div id = "interctable"> 
         
         <div id = "intro">
            <div  className="dimmed"></div>
               <h1 className="App-intro">Quick tips to familiarize you with Pintionary</h1>
               <button  onClick={this.dismissIntro} className="App-intro-button">
                Okay, let's start
               </button>
          </div>
          <div id = "top-panel"  className = "top-panel">
                <img src={logo} className="App-logo" alt="logo" />
                <div className="wrapper">          
                {this.state.user ?
                    <button onClick={this.logout}>Log Out</button>                
                    :
                    <button onClick={this.login}>Ignore this button for now</button>                                  
                  }
                </div>  
                <div className="wrapper">          
                {this.state.user ?
                    <button onClick={this.save/*this.logout*/}>Save current map</button>                
                    :
                    <button onClick={this.login}>Sign in to save current map</button>                                  
                  }
                </div> 
          </div> 
          <div id = "side-panel" className = "side-panel">
          <button  onClick={this.load.bind(this)} className="load-button">
                 load test map
          </button>
          <div>
                {this.state.user && !mapsChecked ? this.load() : false
                } 
                 
          </div>
        <div>
        {this.state.itemArray.map((item, index) => {
          return (
            <div className="box" key={index}>
                <div>
                 <button>{item.title}</button>
               </div>
            </div>
          )
        })}
      </div>
          <br/><br/>
          <input
              type="text"
              value={this.state.value}
              onChange={this.handleChange}
          />
            <br/><br/>Co-ordinates (for testing)
            <textarea id="savedata" rows="8" cols="40"></textarea>
            <div>
                <br/><br/>Photos <br/>
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
                      filename={mapName+currentMapPictures}
                      storageRef={firebase.storage().ref('images')}
                      onUploadStart={this.handleUploadStart}
                      onUploadError={this.handleUploadError}
                      onUploadSuccess={this.handleUploadSuccess}
                      onProgress={this.handleProgress}
                      />
                </form>
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


//function checkFlag() {
    if(window.google) {
       
       window.initMap = this.initMap; 
       loadJS('https://maps.googleapis.com/maps/api/js?key=AIzaSyDUl_1pB8VULv0KmItP_FuzmE4Y6qy0VeQ&libraries=drawing&callback=initMap')
    } else {
      //window.setTimeout(checkFlag, 100); /* this checks the flag every 100 milliseconds*/  
    }
//}
 //this.checkFlag();
  if (window.google){
    window.initMap = this.initMap; 
    loadJS('https://maps.googleapis.com/maps/api/js?key=AIzaSyDUl_1pB8VULv0KmItP_FuzmE4Y6qy0VeQ&libraries=drawing&callback=initMap')
  } else{
//window.setTimeout(this, 100); /* this checks the flag every 100 milliseconds*/  
    //this.checkFlag();
  }
}

checkFlag() {
    if(window.google) {
        window.initMap = this.initMap; 
    loadJS('https://maps.googleapis.com/maps/api/js?key=AIzaSyDUl_1pB8VULv0KmItP_FuzmE4Y6qy0VeQ&libraries=drawing&callback=initMap')
    } else {
      window.setTimeout(this.checkFlag, 100);
      this.checkFlag();
    }
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
