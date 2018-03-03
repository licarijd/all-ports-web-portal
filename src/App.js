import React, { Component } from 'react';
import firebase, { auth, provider } from './fire.js';
import logo from './logo.png';
import searchArrow from './searcharrow.png';
import addArrow from './addarrow.png';
import addIcon from './addicon.png';
import subIcon from './subicon.png';
import addMapIcon from './pinicon.png';
import downAddMapIcon from './pinicondown.png';
import addRouteIcon from './routeicon.png';
import downAddRouteIcon from './routeicondown.png';
import mapFuncArrow from './mapfuncarrow.png';
import viewMapsArrow from './viewmapsarrow.png';
import viewSettingsArrow from './viewsettingsarrow.png';
import settingsIcon from './menuicon.png';
import mapsIcon from './mapicon.png';
import collectionsIcon from './collectionsicon.png';
import favsIcon from './favsicon.png';
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

//Represents whether or not the map menu is displayed
var mapDisplayActive = false;
var mapDetailsActive = false;
var addButtonDown = false;
var addMapButtonDown = false;
var addRouteButtonDown = false;

//For testing
var likes = 0;

//Keep track of the most recent camera position
var camZoom;
var camTarget;

//Represents whether the page being loaded is a public map
var publicMap;

//The full path to a public map
var mapRef = null;

//A counter of likes
var likeCount = 0;

//A map's date created
var dateCreated = "11/07/17";

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
					console.log(snapshot.key)
					console.log(mapNameSnapshots)
        	});

		}

		//console.log(mapNameSnapshots);
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

  //Show/hide GUI elements 
  dismissIntro() {
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  showMapUI() {
    var mapsPanel = document.getElementById('popup-maps-panel');

	if (mapDisplayActive === false){
		mapsPanel.hidden = false;
		mapDisplayActive = true;
	} else {
		mapsPanel.hidden = true;
		mapDisplayActive = false;
	}
  }

  showMapDetails() {
  	var mapDetails = document.getElementById('map-details');
  	mapDetails.hidden = false;
  }

  /*setCreateMapUI() {
    var createMapsPanel = document.getElementById('popup-create-map-panel');
    createMapsPanel.hidden = false;
	var mapsPanel = document.getElementById('popup-maps-panel');
    mapsPanel.hidden = true;
  }*/

  setPinDeleteUI() {
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  setRouteDeleteUI() {
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  delPinConfirmUI() {
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  delRouteConfirmUI() {
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }

  getThumnail = function(mapName){

		//Represents the thumbnail of a map on a map button
	  	var thumbnail;

    	var db = firebase.database();
		var ref = db.ref('users/' + userID + '/maps/' + mapName + '/thumbnail');
      	ref.orderByChild("thumbnail").on("child_added", function (snapshot) {
  			thumbnail = snapshot.val();
		}, function (errorObject) {
  			console.log(errorObject);
		});

		return thumbnail;
  }

  share(){
	  var shortUrl = this.hashCode(userID+mapName);
	  var publicRef = 'users/' + userID + '/maps/' + "/" + mapName;
	  firebase.database().ref('publicMaps/' + shortUrl + "/ref").push(publicRef);
  }

  hashCode = function(s){
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
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
	firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/mapName").push(mapName);
	firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/author").push(userID);
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markers").push(pinData);
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/lines").push(lineData);
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName).child("pics").set({pics: this.state.currentMapPictures});
	var dateAdded = new Date();
	var dd = dateAdded.getDate();
	var mm = dateAdded.getMonth()+1; //January is 0!

	var yyyy = dateAdded.getFullYear();
	if(dd<10){
		dd='0'+dd;
	} 
	if(mm<10){
		mm='0'+mm;
	} 
	var dateAdded = dd+'/'+mm+'/'+yyyy;
	firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/dateAdded").push(dateAdded);
	firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/likes").push(likes);
	
	
	if (!camZoom){
		camZoom = 8;
	}

	if (!camTarget){
		console.log("fill")
		camTarget = {lat: -34.397, lng: 150.644}
		var thumbnail = "https://maps.googleapis.com/maps/api/staticmap?center=-34.397,150.644&zoom=" + camZoom.toString() + "&size=385x200&key=AIzaSyB31IEUSYz_m5JLGt70rJs3ueCSx2dYv_0";
	
	} else {
		var camTargetVal = {lat: camTarget.lat(), lng: camTarget.lng()}
		var thumbnail = "https://maps.googleapis.com/maps/api/staticmap?center=" + camTarget.lat().toString() + "," + camTarget.lng().toString() + "&zoom=" + camZoom.toString() + "&size=385x200&key=AIzaSyB31IEUSYz_m5JLGt70rJs3ueCSx2dYv_0";
	
	}

	console.log(camTarget)

	firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/camZoom").push(camZoom);
  	firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/camTarget").push(camTargetVal);

	firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/thumbnail").push(thumbnail);
  }

  

  	//Parse map data to generate a list of buttons to create	
	generateButtonList(){
		console.log("generate")
		mapButtonList = mapNameSnapshots.split("|");
		mapButtonList.shift();
		console.log(mapButtonList)
	}

  load() {
	  	//Supports loadability
    	this.getImage('/images/pic000');
        
		//Get the number of pictures attached to the current map from Firebase
    	var db = firebase.database();
		var ref;

		if (publicMap) {
    		ref = db.ref(mapRef + '/pics');
		} else {
			ref = db.ref('users/' + userID + '/maps/' + mapName + '/pics');	
		}
		
      	ref.orderByChild("pics").on("child_added", function (snapshot) {
  			picCount = snapshot.val();
		}, function (errorObject) {
  			console.log(errorObject);
		});
		
		//Load each image attached to the current map
		if (publicMap) {
			ref = db.ref(mapRef + '/mapName');
			var pMapName;

			ref.orderByChild("mapName").on("child_added", function (snapshot) {
  				pMapName = snapshot.val();
			}, function (errorObject) {
  				console.log(errorObject);
			});

    		if(picCount){
				for (var i =0;i<=picCount;i++){
					this.getImage('/images/' + pMapName + '/' + pMapName+i);
				}
			}
		} else { 
			if(picCount){
				for (var i =0;i<=picCount;i++){
					this.getImage('/images/' + mapName + '/' + mapName+i);
				}
			}
		}

    	/* Create reference to maps in Firebase Database */
    	let messagesRef = firebase.database().ref('users/' + userID + '/maps/' + mapName).orderByKey().limitToLast(100);
    	messagesRef.on('child_added', snapshot => {

      	/* Load map plot data from Firebase */
      	let mapPlotData = { text: snapshot.val(), id: snapshot.key };

      	//Only generate the list of maps once
        this.createMapList();

		//console.log(mapNameSnapshots)
    })
  }

  //Attached to TEST button
  test(){
    
  }

  //Retrieve and parse all data from Firebase needed to construct a map's pins and routes
  getMapData(mapID){
	this.showMapDetails(); 
    this.setState({ loadedImage: [] })
    this.setState({ mapNameField: mapID });
    mapName = mapID + "";
	
	//Store data for each type in a single string to be parsed
    var markerDataString;
    var routeDataString;

    var db = firebase.database();
	var routeRef;

	
	console.log("mapdata")
	//Use full path for loading public maps
	if (publicMap) {
		console.log("bad")
    	routeRef = db.ref(mapID + '/lines/');
	} else {
		routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/lines/');
	}

    routeRef.orderByChild("markers").on("child_added", function (snapshot) {
        routeDataString+=snapshot.val(); 
      });
      
	if (publicMap) {
    	routeRef = db.ref(mapID + '/markers/');
	} else {
    	routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/markers/');	
	}

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

	//Set global cam variables before loading the map.
	var db = firebase.database();
	var camRef;
	if (publicMap){
    	camRef = db.ref(mapID + '/camZoom/');
	} else {
		camRef = db.ref('users/' + userID + '/maps/' + mapID + '/camZoom/');
	}
	
    routeRef.orderByChild("camZoom").on("child_added", function (snapshot) {
        camZoom=snapshot.val(); 
      });

	if (publicMap){
    	camRef = db.ref(mapID + '/camTarget/');
	} else {
		camRef = db.ref('users/' + userID + '/maps/' + mapID + '/camTarget/');
	}

    routeRef.orderByChild("camTarget").on("child_added", function (snapshot) {
        camTarget=snapshot.val(); 
      });

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
		<div className="Rectangle-3"></div>
		  <img src={addArrow} className="App-add-arrow" alt="addArrow" />
		  <img src={searchArrow} className="App-search-arrow" alt="searchArrow" />
		  <img src={viewSettingsArrow} className="App-view-settings" alt="viewSettingsArrow" />
		  <img src={viewMapsArrow} className="App-view-maps" alt="viewMapsArrow" />
		  <img src={mapFuncArrow} className="App-map-func" alt="mapFuncArrow" />
          <div className="View-your-maps-coll">View your maps, collections of and faved contents here</div>
		  <h1 className="Quick-tips-to-famili">Quick tips to familiarize you with Pintionary</h1>
		  <div className="View-your-user-profi">View your user profile and settings here</div>
		  <div className="Search-for-a-locatio">Search for a location to begin creating maps with pins and routes</div>
		  <div className="When-you-have-a-map">When you have a map with pins and routes, these options will appear on the top right</div>
		  <div className="Begin-by-adding-a-ro">Begin by adding a route or pin to your map through this floating button here</div>
          <button onClick={this.dismissIntro} className="App-intro-button">
            Okay, let's start
               </button>
        </div>	
        <button hidden onClick={this.test.bind(this)} className="load-button">
            TEST
          </button>
        <div id="top-panel" className="top-panel">
		<button className="share-map" onClick={this.share.bind(this)}> Share Map</button>
		{this.state.user ?
              <button  className="save-map" onClick={this.save.bind(this)}>Save Map</button>
              :
              <button  className="save-map" onClick={this.login}>Sign In</button>
            }
			{this.state.user ?
              <button onClick={this.logout}>Log Out</button>
              :
              <button onClick={this.login}>Ignore this button for now</button>
            }
          <img src={logo} className="App-logo" alt="logo" />
          <div className = "profile-details"  id="profile-details">
          </div>
          <div className = "popup-create-map-panel"  id="popup-create-map-panel">
			<input
            type="text"
            value={this.state.mapNameField}
            onChange={this.handleChange}
          />
		    <input
            type="text"
            value="please enter description"
            onChange={this.handleChange}
          />
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
                      onUploadError={this.handleUploadError}
                      onUploadSuccess={this.handleUploadSuccess}
                      onProgress={this.handleProgress}
                    />
              </label>
          </form>
          </div>
        </div>
        <div id="side-panel" className="side-panel">
		  <input type="image" src={settingsIcon} className="settings-button" alt="settingsIcon"/>
		  <input type="image" onClick={this.showMapUI} src={mapsIcon} className="maps-button" alt="mapsIcon" text="Maps"/>
		  <input type="image" src={collectionsIcon} className="collections-button" alt="collectionsIcon"/>
		  <input type="image" src={favsIcon} className="favs-button" alt="favsIcon"/>
          <div className = "popup-maps-panel"  id="popup-maps-panel">
            <div>
              {this.state.user && !mapsChecked ? this.load() : false
              }
            </div>
			 <div>
              {mapNameSnapshots==null ? false : this.generateButtonList()}
            </div>
            {mapButtonList.map((item, index) => {
              return (
                <div className="box" key={index}>
                  <div>
					{/*<input type="image" src={this.getThumnail(item)} onClick={() => this.getMapData(item)}>*/}
					<button className = "map-button-list" onClick={() => this.getMapData(item)}>
						<span className = "map-button-view">
							<img className = "map-thumb" src={this.getThumnail(item)}></img>
							<span className = "map-button-overlay">
								<span className = "map-name-text">{item}</span>
								<span className = "map-created-on">Created on {dateCreated}</span>
								<span className = "map-likes">{likeCount}</span>
								<img className = "map-favs" src={favsIcon}></img>
							</span>	
						</span>	      
					</button>
					{/*</input>*/}
                  </div>
                </div>
              )
            })}
          </div>
          <div  className = "map-details"  id="map-details">
          <br /><br />
          <input
            type="text"
            value={this.state.mapNameField}
            onChange={this.handleChange}
          />
          <br /><br />
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
      	loadJS('https://maps.googleapis.com/maps/api/js?key=AIzaSyAbP4svkwQIWh2S5TujdpOKLPI9plVj2s0&libraries=drawing&callback=initMap')
    } else {
       	setTimeout(function(){
       		window.location.reload(true);
	   	},3000);
  	}

	//Deactivate components
	var mapsList = document.getElementById('popup-maps-panel');
    mapsList.hidden = true;
	var createMapPanel = document.getElementById('popup-create-map-panel');
    createMapPanel.hidden = true;
	var mapDetails = document.getElementById('map-details');
    mapDetails.hidden = true;
	var profileDetails = document.getElementById('profile-details');
    profileDetails.hidden = true;

	if (window.location.href != "https://pintionary.herokuapp.com/" && window.location.href != "http://localhost:3000/"){
		publicMap = true;

		//CHANGE FOR PROD
		var shortUrlCode = window.location.href.substr(22/*33*/);
		console.log("shortUrlCode"+shortUrlCode)
		var db = firebase.database();
		var ref = db.ref('publicMaps/' + shortUrlCode + "/ref");
      	ref.orderByChild("ref").on("child_added", function (snapshot) {
  			mapRef = snapshot.val();
			  console.log("snap"+snapshot.val());
			  //this.getMapData(snapshot.val());
		}, function (errorObject) {
  			console.log(errorObject);
		});
		console.log("mapRef" + mapRef)
		if (mapRef){

			
			this.getMapData(mapRef);
		}	
		
	
	}
  }



  //Plot map pins and routes
  initMap = function () {

	//Set default cam position values if none exist
	if (!camZoom){
		camZoom = 8;
	}

	if (!camTarget){
		camTarget = {lat: -34.397, lng: 150.644}
	}
	
     var map = new google.maps.Map(document.getElementById('map'), {

	center: {lat: -34.397, lng: 150.644},
       zoom: 8
       //center: camTarget,//{lat: -34.397, lng: 150.644},
       //zoom: camZoom//8
     });

 
    var drawingManager = new google.maps.drawing.DrawingManager({
       drawingMode: google.maps.drawing.OverlayType.MARKER,
       drawingControl: false,
       drawingControlOptions: {
       position: google.maps.ControlPosition.BOTTOM_RIGHT,
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

	//Create button control for adding routes
	var routeModeDiv = document.createElement('div');
	var routeControlDiv = routeModeDiv;
	var routeControlUI = document.createElement('div');	
	routeControlUI.id = "App-add-route";	
	routeControlUI.className = "App-add-route";	
	routeControlUI.style.visibility = "hidden";
	routeControlUI.style.width = '75px';
	routeControlUI.style.height = '75px';
	routeControlUI.style.backgroundImage =  "url(" + addRouteIcon + ")";
	routeControlUI.style.cursor = 'pointer';
	routeControlUI.title = 'Click to recenter the map';
	routeControlDiv.appendChild(routeControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	routeControlUI.style.backgroundImage =  "url(" + addRouteIcon + ")";
	controlText.style.color = 'rgb(25,25,25)';
	controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = '      ';
	routeControlUI.appendChild(controlText);

	// Switch drawing type to polyline
	routeControlUI.addEventListener('click', function() {
		drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
		routeControlUI.style.backgroundImage =  "url(" + downAddRouteIcon + ")";
		mapControlUI.style.backgroundImage =  "url(" + addMapIcon + ")";
	});
	
     routeModeDiv.index = 1;
     map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(routeModeDiv);

	//Create button for adding maps
	var mapModeDiv = document.createElement('div');
	var mapControlDiv = mapModeDiv;
	var mapControlUI = document.createElement('div');	
	mapControlUI.id = "App-add-map";	
	mapControlUI.className = "App-add-map";	
	mapControlUI.style.visibility = "hidden";
	mapControlUI.style.width = '75px';
	mapControlUI.style.height = '75px';
	mapControlUI.style.backgroundImage =  "url(" + addMapIcon + ")";
	mapControlUI.style.cursor = 'pointer';
	mapControlUI.title = 'Click to recenter the map';
	mapControlDiv.appendChild(mapControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	mapControlUI.style.backgroundImage =  "url(" + addMapIcon + ")";
	controlText.style.color = 'rgb(25,25,25)';
	controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = '      ';
	mapControlUI.appendChild(controlText);

	// Switch drawing type to marker
	mapControlUI.addEventListener('click', function() {
		drawingManager.setDrawingMode(google.maps.drawing.OverlayType.MARKER);
		mapControlUI.style.backgroundImage =  "url(" + downAddMapIcon + ")";
		routeControlUI.style.backgroundImage =  "url(" + addRouteIcon + ")";
	});
	
    mapModeDiv.index = 1;
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(mapModeDiv);

	//Create button to bring up drawing tools
	var addModeDiv = document.createElement('div');
	var addControlDiv = addModeDiv;
	var addControlUI = document.createElement('div');	
	addControlUI.id = "App-add-arrow";	
	addControlUI.className = "App-add-arrow";
	addControlUI.style.width = '100px';
	addControlUI.style.height = '100px';
	addControlUI.style.backgroundImage =  "url(" + addIcon + ")";
	addControlUI.style.cursor = 'pointer';
	addControlUI.title = 'Click to recenter the map';
	addControlDiv.appendChild(addControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	addControlUI.style.backgroundImage =  "url(" + addIcon + ")";
	controlText.style.color = 'rgb(25,25,25)';
	controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = '      ';
	addControlUI.appendChild(controlText);

	//Show draw tools
	addControlUI.addEventListener('click', function() {
		mapControlUI.style.visibility = "visible";
		routeControlUI.style.visibility = "visible";
		mapControlUI.style.backgroundImage =  "url(" + addMapIcon + ")";
		routeControlUI.style.backgroundImage =  "url(" + addRouteIcon + ")";	
		subControlUI.style.visibility = "visible";	
		addControlUI.style.visibility = "hidden";
	});
	
    addModeDiv.index = 1;
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(addModeDiv);
	 
	//Create button to hide drawing tools
	var subModeDiv = document.createElement('div');
	var subControlDiv = subModeDiv;
	var subControlUI = document.createElement('div');	
	subControlUI.id = "App-add-route";	
	subControlUI.className = "App-add-arrow";	
	subControlUI.style.visibility = "hidden";
	subControlUI.style.width = '100px';
	subControlUI.style.height = '100px';
	subControlUI.style.backgroundImage =  "url(" + subIcon + ")";
	subControlUI.style.cursor = 'pointer';
	subControlUI.title = 'Click to recenter the map';
	subControlDiv.appendChild(subControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	subControlUI.style.backgroundImage =  "url(" + subIcon + ")";
	controlText.style.color = 'rgb(25,25,25)';
	controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = '      ';
	subControlUI.appendChild(controlText);

	//Hide draw tools
	subControlUI.addEventListener('click', function() {
		drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
		mapControlUI.style.visibility = "hidden";
		routeControlUI.style.visibility = "hidden";
		addControlUI.style.visibility = "visible";
		subControlUI.style.visibility = "hidden";
	});
	
    routeModeDiv.index = 1;
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(routeModeDiv);

	//Create delete Pin button
	var delPinModeDiv = document.createElement('div');
	var delPinControlDiv = delPinModeDiv;
	var delPinControlUI = document.createElement('div');	
	delPinControlUI.id = "del-pin";	
	delPinControlUI.className = "del-pin";	
	delPinControlUI.style.visibility = "hidden";
	delPinControlUI.style.width = '75px';
	delPinControlUI.style.height = '75px';
	delPinControlUI.style.cursor = 'pointer';
	delPinControlUI.title = 'Click to recenter the map';
	delPinControlDiv.appendChild(delPinControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	controlText.style.color = 'rgb(25,25,25)';
	controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = 'Undo';
	delPinControlUI.appendChild(controlText);

	//Remove the most recently added pin.
	delPinControlUI.addEventListener('click', function() {
		markers[markers.length-1].setMap(null);
	  	markers.pop();
	});
	
     delPinModeDiv.index = 1;
     map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(delPinModeDiv);

	//Create delete all Pins button
	var delAllPinModeDiv = document.createElement('div');
	var delAllPinControlDiv = delAllPinModeDiv;
	var delAllPinControlUI = document.createElement('div');	
	delAllPinControlUI.id = "del-all-pins";	
	delAllPinControlUI.className = "del-all-pins";	
	delAllPinControlUI.style.visibility = "hidden";
	delAllPinControlUI.style.width = '75px';
	delAllPinControlUI.style.height = '75px';
	delAllPinControlUI.style.cursor = 'pointer';
	delAllPinControlUI.title = 'Click to recenter the map';
	delAllPinControlDiv.appendChild(delAllPinControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	controlText.style.color = 'rgb(25,25,25)';
	controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = 'Clear Pins';
	delAllPinControlUI.appendChild(controlText);

	//Remove all pins.
	delAllPinControlUI.addEventListener('click', function() {

		for (var i=0; i<markers.length; i++){
			markers[markers.length].setMap(null);
	  		markers.pop();
		}
	});
	
     delAllPinModeDiv.index = 1;
     map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(delAllPinModeDiv);

	//Create delete Route button
	var delRouteModeDiv = document.createElement('div');
	var delRouteControlDiv = delRouteModeDiv;
	var delRouteControlUI = document.createElement('div');	
	delRouteControlUI.id = "del-route";	
	delRouteControlUI.className = "del-route";	
	delRouteControlUI.style.visibility = "hidden";
	delRouteControlUI.style.width = '75px';
	delRouteControlUI.style.height = '75px';
	delRouteControlUI.style.cursor = 'pointer';
	delRouteControlUI.title = 'Click to recenter the map';
	delRouteControlDiv.appendChild(delPinControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	controlText.style.color = 'rgb(25,25,25)';
	controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = 'Undo';
	delRouteControlDiv.appendChild(controlText);

	//Remove the most recently added route.
	delPinControlUI.addEventListener('click', function() {
		lines[lines.length-1].setMap(null);
	  	markers.pop();
	});
	
    delRouteModeDiv.index = 1;
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(delRouteModeDiv);

	//Create delete all Routes button
	var delAllRouteModeDiv = document.createElement('div');
	var delAllRouteControlDiv = delAllRouteModeDiv;
	var delAllRouteControlUI = document.createElement('div');	
	delAllRouteControlUI.id = "del-all-routes";	
	delAllRouteControlUI.className = "del-all-routes";	
	delAllRouteControlUI.style.visibility = "hidden";
	delAllRouteControlUI.style.width = '75px';
	delAllRouteControlUI.style.height = '75px';
	delAllRouteControlUI.style.cursor = 'pointer';
	delAllRouteControlUI.title = 'Click to recenter the map';
	delAllRouteControlDiv.appendChild(delAllPinControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	controlText.style.color = 'rgb(25,25,25)';
	controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = 'Clear Pins';
	delAllRouteControlUI.appendChild(controlText);

	//Remove all routes.
	delAllRouteControlUI.addEventListener('click', function() {

		for (var i=0; i<lines.length; i++){
			lines[lines.length].setMap(null);
	  		lines.pop();
		}
	});
	
    delAllRouteModeDiv.index = 1;
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(delAllRouteModeDiv);

	//Create reverse Route button
	var revRouteModeDiv = document.createElement('div');
	var revRouteControlDiv = revRouteModeDiv;
	var revRouteControlUI = document.createElement('div');	
	revRouteControlUI.id = "rev-route";	
	revRouteControlUI.className = "rev-route";	
	revRouteControlUI.style.visibility = "hidden";
	revRouteControlUI.style.width = '75px';
	revRouteControlUI.style.height = '75px';
	revRouteControlUI.style.cursor = 'pointer';
	revRouteControlUI.title = 'Click to recenter the map';
	revRouteControlDiv.appendChild(revRouteControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	controlText.style.color = 'rgb(25,25,25)';
	controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = 'Clear Pins';
	revRouteControlUI.appendChild(controlText);

	//Reverse route
	delAllRouteControlUI.addEventListener('click', function() {

		lines = lines.reverse();
	});
	
    revRouteModeDiv.index = 1;
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(revRouteModeDiv);

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
	    //this.setCreateMapUI();
	    var createMapsPanel = document.getElementById('popup-create-map-panel');
        createMapsPanel.hidden = false;
		var mapsPanel = document.getElementById('popup-maps-panel');
   		mapsPanel.hidden = true;
	    //Track camera position
	    camZoom = map.getZoom();
	    camTarget = map.getCenter();
	    //drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);

	   //To remove: markers[markers.length].setMap(null);
	  // markers.pop

	  //To remove all, loop this
    });

    google.maps.event.addDomListener(drawingManager, 'polylinecomplete', function(line) {
        lines.push(line);
	    //this.setCreateMapUI();
	    var createMapsPanel = document.getElementById('popup-create-map-panel');
        createMapsPanel.hidden = false;
		var mapsPanel = document.getElementById('popup-maps-panel');
   		mapsPanel.hidden = true;
	    //Track camera position
	    camZoom = map.getZoom();
	    camTarget = map.getCenter();
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
