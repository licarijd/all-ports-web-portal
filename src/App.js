import React, { Component } from 'react';
import firebase, { auth, provider } from './fire.js';
import logo from './logo.svg';
import './App.css';
import FileUploader from 'react-firebase-file-uploader';

const storage = firebase.storage().ref()

//var imagesLoaded = false;
  var  markers = [];
 var     lines = [];

 var picCount = null;

//Need a reference to google object from index.html
const google = window.google;

window.currentRouteObj = [];
window.currentMarkerObj = [];

var mapNameSnapshots = null;
var mapName = "";
var userID;
var mapButtonList = [];

//References the list of all of the user's maps
var allMaps = [];
var listItems;

//Represents if the map list has been checked at the start of the program
var mapsChecked = false;

window.test = [
          {lat: -34.39784494644986, lng: 100.611572265625},
          {lat: -34.55181136917047, lng: 100.2874755859375}
        ];

//Lists of routes and pins
//var markers = [];
//var lines = [];

//The number of pictures associated with the currently loaded map


class App extends Component {

  constructor() {
    super();
    this.state = {
      user: null, 
      currentMapPictures: 0,
      //Map name input field
      mapNameField: 'Please enter your map name',
      loadedImage: [],
      itemArray: []
    }

    this.login = this.login.bind(this); // <-- add this line
    this.logout = this.logout.bind(this); // <-- add this line
    this.handleChange = this.handleChange.bind(this);
    //this.handleUploadSuccess = this.handleUploadSuccess.bind(this);
  }

  //Adds maps to a list
  createMapList() {
if (!mapsChecked) {
  var temp = "";
mapsChecked = true;
    //Get the names of all of a user's maps, and add to a list. This will be used to generate links in the 'maps' section
      var db = firebase.database();
      var ref = db.ref('users/' + userID + '/maps/');
      ref.orderByChild("markers").on("child_added", function (snapshot) {
        
         mapNameSnapshots+="|"+snapshot.key; 
        console.log(snapshot.key + " markers " + snapshot.val().markers);
        allMaps.push(snapshot.key);
        //temp=latestSnapshot.val();
        console.log("MAPS :" + allMaps + temp);
        });

        //console.log("MAPS fg:" + allMaps + temp + latestSnapshot);

        const item = this.state.itemArray;
    const title = "dfdfdf";
    const text = 'map description';
    item.push({ title, text })
    this.setState({ itemArray: item })
      //});

}
  }

  

  //Update map nme field with user input
  handleChange(event) {
    this.setState({ mapNameField: event.target.value });
    mapName = event.target.value;
    console.log(event.target.value);
  }

  //Gets an image via firebase URL and loads it into an element
  getImage = function (image) {
    let { state } = this
    
    
    storage.child(`${image}.png`).getDownloadURL().then((url) => {
      state[image] = url
      const tempLoadedImage = this.state.loadedImage;
      if(image!='/images/pic000'){
    tempLoadedImage.push(state[image]);
      }
      this.setState({ loadedImage: tempLoadedImage })
    }).catch((error) => {
        //this.setState({ loadedImage: this.state.loadedImage })
    })
    storage.child(`${image}.jpg`).getDownloadURL().then((url) => {
      state[image] = url
      const tempLoadedImage = this.state.loadedImage;
      if(image!='/images/pic000'){
    tempLoadedImage.push(state[image]);
      }
      this.setState({ loadedImage: tempLoadedImage })
    }).catch((error) => {
      // Handle any errors
    })

      
    console.log("getimage run");
  }

  //Update upload info
  handleUploadStart = () => this.setState({ isUploading: true, progress: 0 });
  handleProgress = (progress) => this.setState({ progress });
  handleUploadError = (error) => {
    this.setState({ isUploading: false });
    console.error(error);
  }

  //Increment the image counter when an image is added to a map
  handleUploadSuccess = () => 
    this.setState({
          currentMapPictures: this.state.currentMapPictures+1
        }); 
        
        //currentMapPictures++; 
        
        

  //Auth functions
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

  //Incomplete
  dismissIntro() {
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  addRoute() {
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  addPin() {
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  savePin() {
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  saveRoute() {
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }


  save() {

    //Test mutability
   // window.markers += " marker";
    //console.log("markers " + window.markers);
    var lineData;
    var pinData;

    //document.getElementById("savedata").value = "";

    //Add pins and routes to lists
    for (var i = 0; i < markers.length; i++) {
      var marker = markers[i].position;
      pinData += marker + "+";
      console.log("pindata add");
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].getPath().getArray();
      lineData += line + "+";
      
      console.log("linedata add");
    }

    //Push all map data to Firebase
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markers").push(pinData);
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/lines").push(lineData);
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName).child("pics").set({pics: 2});
  }
generateButtonList(){

  console.log("snap" + mapNameSnapshots);
  //var str = "How are you doing today?";
mapButtonList = mapNameSnapshots.split("|");
///this.itemArray = mapButtonList
console.log("snap" + mapButtonList);
}
  load() {
    
    //if(mapsChecked){
        this.getImage('/images/pic000');
    //}
    
        //mapsChecked = true;
        
    var db = firebase.database();
var ref = db.ref('users/' + userID + '/maps/pics');
      ref.orderByChild("pics").on("child_added", function (snapshot) {
  picCount = snapshot.val();
  
  console.log("piccount in: "+picCount);
}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
});


  
 //Test loading an image from Firebase
    //if (!imagesLoaded){
        //imagesLoaded = true;
    if(picCount){
    for (var i =0;i<=picCount;i++){
      console.log("piccount out: i "+i);
        this.getImage('/images/pics/pics'+i);

    }
    }
    
   // }
    //this.getImage('/images/pics/pics1');

    /* Create reference to maps in Firebase Database */
    let messagesRef = firebase.database().ref('users/' + userID + '/maps/' + mapName).orderByKey().limitToLast(100);
    messagesRef.on('child_added', snapshot => {

      /* Load map plot data from Firebase */
      let mapPlotData = { text: snapshot.val(), id: snapshot.key };
      console.log("mapPlotData : " + mapPlotData.text);

      //Get the names of all of a user's maps, and add to a list. This will be used to generate links in the 'maps' section
      //var db = firebase.database();
      /*var ref = db.ref('users/' + userID + '/maps/');
      ref.orderByChild("markers").on("child_added", function (snapshot) {
        console.log(snapshot.key + " markers " + snapshot.val().markers);
        allMaps.push(snapshot.val().markers);
      });*/

      //Only generate the list of maps once
      
        this.createMapList();
        
      
    })

    //console.log("MAPPLOTDATA: " + messagesRef.v);
  }

  test(){
    console.log("GOOGLEOBJ " + google)
    setTimeout(function(){
    window.history.go(-1);
    window.history.go(1);
},100); 
    
  }

  getMapData(mapID){
    
    //this.getImage('/images/pics/pics1');
    var test =['{ "name":"John", "age":30, "city":"New York"}+5'];/*[
          {lat: -34.39784494644986, lng: 150.611572265625},
          {lat: -34.55181136917047, lng: 150.2874755859375}
        ];*/
        localStorage.setItem("test", test);
     console.log(mapID);
    var markerDataString;
    var routeDataString;

    var db = firebase.database();
    var routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/lines/');
    routeRef.orderByChild("markers").on("child_added", function (snapshot) {
        
        routeDataString+=snapshot.val(); 
        console.log(" routedata data" + snapshot.val());
      });
      
    routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/markers/');
    routeRef.orderByChild("markers").on("child_added", function (snapshot) {
        
        markerDataString+=snapshot.val(); 
        
      });
    
    if(markerDataString){
    markerDataString = markerDataString.substr(18);
    
    

    markerDataString = markerDataString.replace(" ", "");
    var markerData = markerDataString;
    
    markerData = markerDataString.split("+"); 

    for (var i=0;i<markerData.length;i++){

        markerData[i] = markerData[i].replace("(", "");
        markerData[i] = markerData[i].replace(")", "");
        markerData[i] = markerData[i].replace(" ", "");

        var markerDataCoordinate = markerData[i].split(",");

        var point = {lat:Number(markerDataCoordinate[0]), lng:Number(markerDataCoordinate[1])};
      window.currentMarkerObj.push(point);
    }
    console.log(" marker data" + window.currentMarkerObj);
    }
if(routeDataString){
routeDataString = routeDataString.substr(18);
routeDataString = routeDataString.replace("(", "");
    routeDataString = routeDataString.replace(" ", "");
    var routeData = routeDataString;
    
    routeData = routeDataString.split("+"); 

  var routeDataCoordinates1 = [];
  var routeDataCoordinates2 = [[],[],[],[],[],[],[],[],[],[],[]];

var cntr1 = 0;
var cntr2 = 0;
  for (var cntr1 = 0; cntr1 < routeData.length; cntr1++){

    routeDataCoordinates1[cntr1] = routeData[cntr1].split(")"); 
    console.log("checking lines " + routeDataCoordinates1[cntr1]);
    
    for (var cntr2 = 0; cntr2 < routeDataCoordinates1[cntr1].length; cntr2++){
        routeDataCoordinates2[cntr1][cntr2] = routeDataCoordinates1[cntr1][cntr2].split(",");
        
    console.log("checking points in lines " + routeDataCoordinates2[cntr1][cntr2]);
    }
  }

  for (var i = 0; i < routeDataCoordinates2.length-1; ++i){  
    for (var j = 0; j<routeDataCoordinates2[i].length-1; ++j){
      if (j!=0){
        routeDataCoordinates2[i][j][0] = routeDataCoordinates2[i][j][1];
        routeDataCoordinates2[i][j][1] = routeDataCoordinates2[i][j][2];
      
      }
      var point = {lat:routeDataCoordinates2[i][j][0].replace("(", ""), lng:routeDataCoordinates2[i][j][1].replace("(", "")};
      window.currentRouteObj.push(point);
      console.log("obj:   " + point.lat + "   " + point.lng);
    }
    window.currentRouteObj.push("new");
  }
  }
  }

  //Render introduction overlay when web app starts
  render() {
    return (
      <div id="interctable" >
        
        <div id="intro">
          <div className="dimmed"></div>
          <h1 className="App-intro">Quick tips to familiarize you with Pintionary</h1>
          <button onClick={this.dismissIntro} className="App-intro-button">
            Okay, let's start
               </button>
        </div>
        <button onClick={this.initMap} className="load-button">
            TEST
          </button>
        <div id="top-panel" className="top-panel">
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
              <button onClick={this.save}>Save current map</button>
              :
              <button onClick={this.login}>Sign in to save current map</button>
            }
          </div>
        </div>
        <div id="side-panel" className="side-panel">
          <button onClick={this.load.bind(this)} className="load-button">
            load test map
          </button>
          <div>
            {this.state.user && !mapsChecked ? this.load() : false
            }
          </div>
          <div>
            {mapNameSnapshots==null ? false : this.generateButtonList() 
            }
          </div>
          <div>
            {mapButtonList.map((item, index) => {
              return (
                <div className="box" key={index}>
                  <div>
                    <button onClick={() => this.getMapData(item)}>{item/*.title*/}</button>
                  </div>
                </div>
              )
            })}
          </div>
          <br /><br />
          <input
            type="text"
            value={this.state.mapNameField}
            onChange={this.handleChange}
          />
          <br /><br />
          <div>
            <br /><br />Photos <br />
            {this.state.loadedImage.map((item, index) => {
              return (
                <div className="box" key={index}>
                  <div>
                    <img src={this.state.loadedImage[index]} alt="test image" width="25" height="25"/>
                  </div>
                </div>
              )
            })}
          </div>
          <form>
            <label>photos:</label>
            {this.state.isUploading &&
              <p>Progress: {this.state.progress}</p>
            }
            {this.state.avatarURL &&
              <img src={this.state.avatarURL} />
            }
            <label style={{backgroundColor: 'steelblue', color: 'white', padding: 10, borderRadius: 4, pointer: 'cursor'}}>
              Select your awesome avatar
                    <FileUploader
                      hidden
                      accept="image/*"
                      name="avatar"
                      filename={mapName + this.state.currentMapPictures}
                      storageRef={firebase.storage().ref('images/'+mapName)}
                      onUploadStart={this.handleUploadStart}
                      //onUploadStart={this.currentMapPictures(mapName + currentMapPictures)}
                      onUploadError={this.handleUploadError}
                      onUploadSuccess={this.handleUploadSuccess}
                      onProgress={this.handleProgress}
                    />
              </label>
          </form>
        </div>
        <div id="tools">
        </div>
      </div>
    );
  }

  //Check auth info
  componentDidMount() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ user });
        userID = user.uid;
      }
    });

    /*f (!mapsChecked) {
        console.log("create map list");
        this.createMapList();
      }
      mapsChecked = true;*/
      //mapsChecked = true;
      if(google){
      window.initMap = this.initMap;
      loadJS('https://maps.googleapis.com/maps/api/js?key=AIzaSyDUl_1pB8VULv0KmItP_FuzmE4Y6qy0VeQ&libraries=drawing&callback=initMap')
    } else {
    
       setTimeout(function(){
    window.location.reload(true);
},3000);
  }
  
  }


  /*checkFlag() {
    if (window.google) {
      window.initMap = this.initMap;
      //loadJS('https://maps.googleapis.com/maps/api/js?key=AIzaSyDUl_1pB8VULv0KmItP_FuzmE4Y6qy0VeQ&libraries=drawing&callback=initMap')
    } else {
      window.setTimeout(this.checkFlag, 100);
      this.checkFlag();
    }
  }*/



  initMap = function () {
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

                var flightPlanCoordinates = [];

                if(window.currentRouteObj[0]){
                /*flightPlanCoordinates = [
          {lat: parseFloat(window.currentRouteObj[0].lat), lng: parseFloat(window.currentRouteObj[0].lng)},
          {lat: parseFloat(window.currentRouteObj[1].lat), lng: parseFloat(window.currentRouteObj[1].lng)}
        ];*/
        flightPlanCoordinates = [];
        for (var i=0;i<window.currentRouteObj.length;i++){

            if (window.currentRouteObj[i]=="new"){
              console.log("new section");
                var flightPath = new google.maps.Polyline({
          path: flightPlanCoordinates,
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 2
        });

        flightPath.setMap(map);
        flightPlanCoordinates = [];
        
      
            } else{

                
            flightPlanCoordinates.push({lat: parseFloat(window.currentRouteObj[i].lat), lng: parseFloat(window.currentRouteObj[i].lng)});
            }
        }

          console.log("FLIGHT :" + window.currentRouteObj[0].lat);
          window.currentRouteObj = [];
  }

  if(window.currentMarkerObj[0]){

    for (var i=0;i<window.currentMarkerObj.length-1;i++){
    console.log( window.currentMarkerObj[i].lat + "mmmmm" + window.currentMarkerObj[i].lng)
      var marker = new google.maps.Marker({
          position: window.currentMarkerObj[i],
          map: map,
          title: 'Hello World!'
        });
      }

      window.currentMarkerObj = [];
      
  }
              
                //flightPlanCoordinates = window.test;
        

    google.maps.event.addDomListener(drawingManager, 'markercomplete', function(marker) {
       markers.push(marker);
       console.log("added");
    });

     google.maps.event.addDomListener(drawingManager, 'polylinecomplete', function(line) {
       lines.push(line);
       
       console.log("added");
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
