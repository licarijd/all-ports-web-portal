import React, { Component } from 'react';
import firebase, { auth, provider } from './fire.js';
import logo from './logo.svg';
import './App.css';
import FileUploader from 'react-firebase-file-uploader';

const storage = firebase.storage().ref()

//Lists of all added markers and lines. Elements are added while drawing
var markers = [];
var lines = [];

//Represents a retrieved snapshot of the number of pictures attached to a map
var picCount = null;

//A reference to google object from the Maps API
const google = window.google;

//Global variables representing retrieved routes and markers for a particular map
window.currentRouteObj = [];
window.currentMarkerObj = [];

//A list of all of a user's map snapshots from Firebase
var mapNameSnapshots = null;

//The curently loaded map
var mapName = "";

//uid from Firebse
var userID;

//A list of all of a user's maps from Firebase
var mapButtonList = [];

//Represents if the map list has been checked at the start of the program
var mapsChecked = false;

class App extends Component {
	constructor() {
    	super();
    	this.state = {
      		user: null, 

			//A counter which increments as users upload pictures
      		currentMapPictures: 0,

      		//Map name input field
      		mapNameField: 'Please enter your map name',

			//A list of all loaded images
      		loadedImage: []
    }

    this.login = this.login.bind(this); 
    this.logout = this.logout.bind(this); 
    this.handleChange = this.handleChange.bind(this);
  }

  //Adds maps to a list
  createMapList() {

		//If maps haven't been cheked, get the list from Firebase to generate buttons
		if (!mapsChecked) {
			mapsChecked = true;

    		//Get the names of all of a user's maps, and add to a list. This will be used to generate links in the 'maps' section
      		var db = firebase.database();
      		var ref = db.ref('users/' + userID + '/maps/');
      		ref.orderByChild("markers").on("child_added", function (snapshot) {
         			mapNameSnapshots+="|"+snapshot.key; 
        	});

		}
  }

  //Update map name field with user input
  handleChange(event) {
    this.setState({ mapNameField: event.target.value });
    mapName = event.target.value;
    console.log(event.target.value);
  }

  //Gets an image via firebase URL and loads it into an element
  getImage = function (image) {
    	let { state } = this
    
		//Get all png and jpg images in the current map folder and add them to state list variable
    	storage.child(`${image}.png`).getDownloadURL().then((url) => {
      		state[image] = url
      		const tempLoadedImage = this.state.loadedImage;

      		if(image!='/images/pic000'){
    			tempLoadedImage.push(state[image]);
      		}

      		this.setState({ loadedImage: tempLoadedImage });

    	}).catch((error) => {
        	console.log(error);
    	})

    	storage.child(`${image}.jpg`).getDownloadURL().then((url) => {
      		state[image] = url
      		const tempLoadedImage = this.state.loadedImage;

      		if(image!='/images/pic000'){
    			tempLoadedImage.push(state[image]);
			}

      		this.setState({ loadedImage: tempLoadedImage })
    	}).catch((error) => {
      		console.log(error);
    	})
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

  //Dismiss intro GUI 
  dismissIntro() {
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  save() {

    var lineData;
    var pinData;

    //Add pins and routes to lists
    for (var i = 0; i < markers.length; i++) {
      	var marker = markers[i].position;
      	pinData += marker + "+";
    }

    for (var i = 0; i < lines.length; i++) {
      	var line = lines[i].getPath().getArray();
      	lineData += line + "+";
    }

    //Push all map data to Firebase, including a number to represent added pictures, excluding the image files
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markers").push(pinData);
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/lines").push(lineData);
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName).child("pics").set({pics: this.state.currentMapPictures});
  }

  	//Parse map data to generate a list of buttons to create	
	generateButtonList(){
		mapButtonList = mapNameSnapshots.split("|");
		mapButtonList.shift();
	}

  load() {
	  
	  	//Supports loadability
    	this.getImage('/images/pic000');
        
		//Get the number of pictures attached to the current map from Firebase
    	var db = firebase.database();
		var ref = db.ref('users/' + userID + '/maps/' + mapName + '/pics');
      	ref.orderByChild("pics").on("child_added", function (snapshot) {
  			picCount = snapshot.val();
		}, function (errorObject) {
  			console.log(errorObject);
		});
		
		//Load each image attached to the current map
    	if(picCount){
    		for (var i =0;i<=picCount;i++){
        		this.getImage('/images/' + mapName + '/' + mapName+i);
    		}
    	}

    	/* Create reference to maps in Firebase Database */
    	let messagesRef = firebase.database().ref('users/' + userID + '/maps/' + mapName).orderByKey().limitToLast(100);
    	messagesRef.on('child_added', snapshot => {

      	/* Load map plot data from Firebase */
      	let mapPlotData = { text: snapshot.val(), id: snapshot.key };

      	//Only generate the list of maps once
        this.createMapList();
    })
  }

  //Attached to TEST button
  test(){
    
  }

  //Retrieve and parse all data from Firebase needed to construct a map's pins and routes
  getMapData(mapID){
    this.setState({ loadedImage: [] })
    this.setState({ mapNameField: mapID });
    mapName = mapID + "";
	
	//Store data for each type in a single string to be parsed
    var markerDataString;
    var routeDataString;

    var db = firebase.database();
    var routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/lines/');
    routeRef.orderByChild("markers").on("child_added", function (snapshot) {
        routeDataString+=snapshot.val(); 
      });
      
    routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/markers/');
    routeRef.orderByChild("markers").on("child_added", function (snapshot) {
        markerDataString+=snapshot.val(); 
      });
    
	//First 18 characters are always 'undefined' so remove them, as well as whitespace and seperators
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
    }

	if(routeDataString){
		routeDataString = routeDataString.substr(18);
		routeDataString = routeDataString.replace("(", "");
    	routeDataString = routeDataString.replace(" ", "");
    	var routeData = routeDataString;
    	routeData = routeDataString.split("+"); 

		//Route data is parsed according to + signs to seperate routes. 2D arrays and loops are needed since each route is a list of markers, and the route data is a list of routes
  		var routeDataCoordinates1 = [];
  		var routeDataCoordinates2 = [[],[],[],[],[],[],[],[],[],[],[]];

		var cntr1 = 0;
		var cntr2 = 0;

		//First parse the list of routes
  		for (var cntr1 = 0; cntr1 < routeData.length; cntr1++){
    		routeDataCoordinates1[cntr1] = routeData[cntr1].split(")"); 
			for (var cntr2 = 0; cntr2 < routeDataCoordinates1[cntr1].length; cntr2++){
        		routeDataCoordinates2[cntr1][cntr2] = routeDataCoordinates1[cntr1][cntr2].split(",");
    		}
  		}

		//Next parse the list of markers in each route
  		for (var i = 0; i < routeDataCoordinates2.length-1; ++i){  
    		for (var j = 0; j<routeDataCoordinates2[i].length-1; ++j){
      			if (j!=0){
        			routeDataCoordinates2[i][j][0] = routeDataCoordinates2[i][j][1];
        			routeDataCoordinates2[i][j][1] = routeDataCoordinates2[i][j][2];
      			}

      			var point = {lat:routeDataCoordinates2[i][j][0].replace("(", ""), lng:routeDataCoordinates2[i][j][1].replace("(", "")};
      			window.currentRouteObj.push(point);
    		}

    	window.currentRouteObj.push("new");
  		}
	}

	//Draw the map
	this.initMap();

	//Load the pictures of the map
	this.load();
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
        <button onClick={/*this.initMap*/this.test.bind(this)} className="load-button">
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
              <button onClick={this.save.bind(this)}>Save current map</button>
              :
              <button onClick={this.login}>Sign in to save current map</button>
            }
          </div>
        </div>
        <div id="side-panel" className="side-panel">
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
                    <img id={mapName} src={this.state.loadedImage[index]} alt="test image" width="25" height="25"/>
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
              +
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

	//Initialize Google Maps API when the site loads. If Google Maps API didn't load correctly, reload the page.
    if(google){
      	window.initMap = this.initMap;
      	loadJS('https://maps.googleapis.com/maps/api/js?key=AIzaSyDUl_1pB8VULv0KmItP_FuzmE4Y6qy0VeQ&libraries=drawing&callback=initMap')
    } else {
       	setTimeout(function(){
       		window.location.reload(true);
	   	},3000);
  	}
  }

  //Plot map pins and routes
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

	//Load a google map
	drawingManager.setMap(map);

	//Draw routes
    var flightPlanCoordinates = [];

    if(window.currentRouteObj[0]){
        flightPlanCoordinates = [];
        for (var i=0;i<window.currentRouteObj.length;i++){
            if (window.currentRouteObj[i]=="new"){
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

		window.currentRouteObj = [];
  	}

  	if(window.currentMarkerObj[0]){

	//Draw markers
    for (var i=0;i<window.currentMarkerObj.length-1;i++){
      var marker = new google.maps.Marker({
          position: window.currentMarkerObj[i],
          map: map,
          title: 'Hello World!'
        });
      }

      window.currentMarkerObj = []; 
  	}
	  
	//When a user draws a route or plots a pin, add it to lists to be saved
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
