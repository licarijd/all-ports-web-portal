import React, { Component } from 'react';
import firebase, { auth, provider } from './fire.js';
import logo from './logo.png';
import searchArrow from './searcharrow.png';
import addArrow from './addarrow.png';
import addIcon from './addicon.png';
import subIcon from './subicon.png';
import saveIcon from './saveicon.png';
import deleteIcon from './deleteicon.png';
import addPhotoIcon from './addphotoicon.png';
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
import favsIcon2 from './favsicon2.png';
import './App.css';
import FileUploader from 'react-firebase-file-uploader';

const storage = firebase.storage().ref()

var mapName = "";

//Lists of all added markers and lines. Elements are added while drawing
var markers = [];
var lines = [];

//Store all data associated with a pin
var markerNames = [];
var markerDescriptions = [];
var markerNotes = [];
var markerTags = [];
var markerDates = [];

//Store all data associated with a route
var routeNames = [];
var routeDescriptions = [];
var routeNotes = [];

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
var pinName = "";
var pinDescription = "";
var pinNotes = "";
var pinTags = "";

var routeName = "";
var pinNotes = "";

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

//Populate these when data is loaded from firebase
var markerNameData = [];
var markerDescriptionData = [];
var mrkerDateData = [];
var markerNoteData = [];
var markerTagData = [];

var routeNameData = [];
var routeDistanceData = [];
var routeNoteData = [];

var pinNum;

var currentPinNumber = 0;

//Array of Google Maps objects created to plot every marker. Used for creating  unique listener for every pin.
var markerPlotRefs = [];

//If a user tries saving a marker or route before they have a map name, set this flag to true to indicate that it needs to be saved once the map is named.
var saveWhenMapSet = false;

class App extends Component {
	constructor() {
    	super();
    	this.state = {
      		user: null, 

			//A counter which increments as users upload pictures
      		currentPinPictures: 0,

			mapNameField: '',

      		//Map name input field
      		pinNameField: '',

			//Map name input field
      		pinDescriptionField: '',

			//Map name input field
      		pinNotesField: '',

			//Map name input field
      		pinTagsField: '',

			//Map name input field
      		routeNameField: '',

			//Map name input field
      		routeNotesField: '',

			//A list of all loaded images
      		loadedImage: []
    }

    this.login = this.login.bind(this); 
    this.logout = this.logout.bind(this); 
    this.handleChange = this.handleChange.bind(this);
	this.handleChangePinName = this.handleChangePinName.bind(this);
	this.handleChangePinDescription = this.handleChangePinDescription.bind(this);
	this.handleChangePinNotes = this.handleChangePinNotes.bind(this);
	this.handleChangePinTags = this.handleChangePinTags.bind(this);
	this.handleChangeRouteName = this.handleChangeRouteName.bind(this);
	this.handleChangeRouteNotes = this.handleChangeRouteNotes.bind(this);
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

  handleChangePinName(event) {
    this.setState({ pinNameField: event.target.value });
    pinName = event.target.value;
    console.log(event.target.value);
  }

  handleChangePinDescription(event) {
    this.setState({ pinDescriptionField: event.target.value });
    pinDescription = event.target.value;
    console.log(event.target.value);
  }

  handleChangePinNotes(event) {
    this.setState({ pinNotesField: event.target.value });
    pinNotes = event.target.value;
    console.log(event.target.value);
  }

  handleChangePinTags(event) {
    this.setState({ pinTagsField: event.target.value });
    pinTags = event.target.value;
    console.log(event.target.value);
  }

    //Update map name field with user input
  handleChangeRouteName(event) {
    this.setState({ routeNameField: event.target.value });
    routeName = event.target.value;
    console.log(event.target.value);
  }

  handleChangeRouteNotes(event) {
    this.setState({ routeNotesField: event.target.value });
    routeNotes = event.target.value;
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
          currentPinPictures: this.state.currentPinPictures+1
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
		this.load();
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

  
	activateSaveMapUI(){
    	var introElement = document.getElementById('save-map-popup');
    	introElement.hidden = false;
	}

	deactivateSaveMapUI(){
    	var introElement = document.getElementById('save-map-popup');
    	introElement.hidden = true;
	}


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

  savePin(pinNum) {

    /*var pinNameData;
	var pinDescriptionData;
	var pinNotesData;
	var pinTagsData;

    //Add pins and routes to lists
    for (var i = 0; i < markerNames.length; i++) {
      	var markerN = markerNames[i].position;
      	pinNameData += markerN + "+";
    }

    for (var i = 0; i < markerDescriptions.length; i++) {
      	var markerD = markerDescriptions[i].position;
      	pinDescriptionData += markerD + "+";
    }

	for (var i = 0; i < markerNotes.length; i++) {
      	var markerN = markerNotes[i].position;
      	pinNotesData += markerN + "+";
    }

	for (var i = 0; i < markerTags.length; i++) {
      	var markerT = markerTags[i].position;
      	pinTagsData += markerT + "+";
    }*/

	if (this.state.mapNameField!=""){
		console.log("BAAAAD");
	pinNum = markers.length-1;


    //Push all map data to Firebase, including a number to represent added pictures, excluding the image files
	firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerNameData" + "/" + pinNum.toString()).push(this.state.pinNameField);
	firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerDescriptionData" + "/" + pinNum.toString()).push(this.state.pinDescriptionField);
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerNotesData" + "/" + pinNum.toString()).push(this.state.pinNotesField);
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerTagsData" + "/" + pinNum.toString()).push(this.state.pinTagsField);
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName  + "/markerPicData" + "/" + pinNum.toString()).child("pics").set({pics: this.state.currentPinPictures});
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

	markerDates.push(dateAdded);
	firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerDateAddedData" + "/" + pinNum.toString()).push(dateAdded);
	//firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/likes").push(likes);
	this.save();
} else {
		console.log("GOOD");
		saveWhenMapSet = true;
		this.activateSaveMapUI();
	}
	
	
  }


  save() {
	
	if (!this.state.user){
		this.login();
	}

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
	firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/").child("markers").remove();
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markers").push(pinData);
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/lines").push(lineData);
    firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName).child("pics").set({pics: this.state.currentPinPictures});
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

	if (saveWhenMapSet!=false){
		saveWhenMapSet = false;
		this.savePin();
	}

	this.deactivateSaveMapUI();
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

    loadAllPinData(pinNum) {
	  	//Supports loadability
    	this.getImage('/images/pic000');
        
		//Get the number of pictures attached to the current map from Firebase
    	var db = firebase.database();
		var ref;

		if (publicMap) {
    		ref = db.ref(mapRef + '/markerPicData');
		} else {
			ref = db.ref('users/' + userID + '/maps/' + mapName + '/markerPicData');	
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
					this.getImage('/images/' + pMapName + '/pinData/' + pinNum + '/' +i);
				}
			}
		} else { 
			if(picCount){
				for (var i =0;i<=picCount;i++){
					this.getImage('/images/' + mapName + '/pinData/' + pinNum + '/' +i);
				}
			}
		}
  }

  //Attached to TEST button
  test(){
    
  }

  //Retrieve and parse all data from Firebase needed to construct a map's pins and routes
  getMapData(mapID){

	this.showMapUI();

	//this.showMapDetails(); 
    this.setState({ loadedImage: [] })
    this.setState({ mapNameField: mapID });
    mapName = mapID + "";
	
	//Store data for each type in a single string to be parsed
    var markerDataString;
    var routeDataString;

	var markerNameDataString;
	var markerDescriptionDataString;
	var markerNoteDataString;
	var markerTagDataString;

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

	  //Pin Names, Descriptions, and Notes
	  if (publicMap) {
    	routeRef = db.ref(mapID + '/markerDescriptionData/');
	} else {
    	routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/markerDescriptionData/');	
	}

    routeRef.orderByChild("desc").on("child_added", function (snapshot) {
        markerNameDataString+=snapshot.val(); 
      });

	  if (publicMap) {
    	routeRef = db.ref(mapID + '/markerDescriptionData/');
	} else {
    	routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/markerDescriptionData/');	
	}

    routeRef.orderByChild("desc").on("child_added", function (snapshot) {
        markerDescriptionDataString+=snapshot.val(); 
      });

	  if (publicMap) {
    	routeRef = db.ref(mapID + '/markerNotesData/');
	} else {
    	routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/markerNotesData/');	
	}

    routeRef.orderByChild("notes").on("child_added", function (snapshot) {
        markerNoteDataString+=snapshot.val(); 
      });
    
if(markerNameDataString){
    	markerDataString = markerDataString.substr(18);
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

		//Show pin info
		var createPinPanel = document.getElementById('popup-create-pin-panel');
        createPinPanel.hidden = false;
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
		<div id = "save-map-popup" className = "save-map-popup">
			<h2 id = "welcome-back-save" className = "welcome-back-save">Welcome back!
			You can now finalize details and save your map to your account</h2>
			<h2 id = "welcome-back-save" className = "welcome-back-save">Name This Map</h2>
			<input className = "name-this-map-input"
            type="text"
            value={this.state.mapNameField}
            onChange={this.handleChange}
          />
			<button id="save-map-button" className="save-map-button" onClick={this.save.bind(this)}>Save Map</button>
			<button id="cancel-save-map" className="cancel-save-map" onClick={this.deactivateSaveMapUI}>cancel</button>
		</div>
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
  		<input id="pac-input" className="controls" type="text" placeholder="Search"></input>
		<button className="share-map" onClick={this.share.bind(this)}> Share Map</button>
		{this.state.user ?
              <button  className="save-map" onClick={this.activateSaveMapUI}>Save Map</button>
              :
              <button  className="save-map" onClick={this.login}>Save Map</button>
            }
			{this.state.user ?
              <button onClick={this.logout}>Log Out</button>
              :
              <button onClick={this.login}>Ignore this button for now</button>
            }
          <img src={logo} className="App-logo" alt="logo" />
          <div className = "profile-details"  id="profile-details">
          </div>
          <div className = "popup-create-route-panel"  id="popup-create-route-panel">
			<input
            type="text"
            value={this.state.routeNameField}
            onChange={this.handleChangeRouteName}
          />
		  <input
            type="text"
            value={this.state.routeNotesField}
            onChange={this.handleChangeRouteTags}
          />
          </div>
		  <div className = "popup-create-pin-panel"  id="popup-create-pin-panel">
		  <img src = {favsIcon2} className = "favs-icon-2"/>
		  <h2 className = "place">Place</h2>
			<input className = "place-input"
            type="text"
            value={this.state.pinNameField}
            onChange={this.handleChangePinName}
          />
		  	<h2 className = "description">Description</h2>
		    <input className = "description-input"
            type="text"
            value={this.state.pinDescriptionField}
            onChange={this.handleChangePinDescription}
          />
		  <h2 className = "notes">Notes</h2>
		  <input className = "notes-input"
            type="text"
            value={this.state.pinNotesField}
            onChange={this.handleChangePinNotes}
          />
		  <div className = "photos-input">
			<form>
            <label className = "photos">Photos</label>
            {this.state.isUploading &&
              <p>Progress: {this.state.progress}</p>
            }
            {this.state.avatarURL &&
              <img src={this.state.avatarURL} />
            }
            <label>
              <img src={addPhotoIcon} className = "addphotoicon" />
                    <FileUploader
                      hidden
                      accept="image/*"
                      name="avatar"
                      filename={mapName + this.state.currentPinPictures}
                      storageRef={firebase.storage().ref('images/'+ mapName + '/pinData/' + this.state.currentPinPictures)}
                      onUploadStart={this.handleUploadStart}
                      onUploadError={this.handleUploadError}
                      onUploadSuccess={this.handleUploadSuccess}
                      onProgress={this.handleProgress}
                    />
              </label>
          </form>
		  </div>
		  <input type="image" src={saveIcon} className="save-pin" onClick={this.savePin.bind(this)}></input>
		  <input type="image" src={deleteIcon} className="delete-pin"></input>
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
	var createPinPanel = document.getElementById('popup-create-pin-panel');
    createPinPanel.hidden = true;
	var createRoutePanel = document.getElementById('popup-create-route-panel');
    createRoutePanel.hidden = true;
	var mapDetails = document.getElementById('map-details');
    mapDetails.hidden = true;
	var profileDetails = document.getElementById('profile-details');
    profileDetails.hidden = true;
	var introElement = document.getElementById('save-map-popup');
    introElement.hidden = true;

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
       drawingMode: google.maps.drawing.OverlayType.NONE,
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
     	clickable: true,
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
	controlText.style.fontFamily = 'Avenir';
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
		delPinControlUI.style.visibility = "hidden";
		delAllPinControlUI.style.visibility = "hidden";
		delAllRouteControlUI.style.visibility = "visible";	
		delRouteControlUI.style.visibility = "visible";
		revRouteControlUI.style.visibility = "visible";
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
	controlText.style.fontFamily = 'Avenir';
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
		delRouteControlUI.style.visibility = "hidden";
		delAllRouteControlUI.style.visibility = "hidden";
		revRouteControlUI.style.visibility = "hidden";
		delPinControlUI.style.visibility = "visible";
		delAllPinControlUI.style.visibility = "visible";
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
	controlText.style.fontFamily = 'Avenir';
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
	subControlUI.id = "App-sub";	
	subControlUI.className = "App-sub";	
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
	controlText.style.fontFamily = 'Avenir';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = '      ';
	subControlUI.appendChild(controlText);

	//Hide draw tools
	subControlUI.addEventListener('click', function() {
		drawingManager.setDrawingMode(google.maps.drawing.OverlayType.NONE);
		mapControlUI.style.visibility = "hidden";
		routeControlUI.style.visibility = "hidden";
		addControlUI.style.visibility = "visible";
		subControlUI.style.visibility = "hidden";
	});
	
    subModeDiv.index = 1;
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(subModeDiv);

	//Create delete Pin button
	var delPinModeDiv = document.createElement('div');
	var delPinControlDiv = delPinModeDiv;
	var delPinControlUI = document.createElement('div');	
	delPinControlUI.id = "del-pin";	
	delPinControlUI.className = "del-pin";	
	delPinControlUI.style.visibility = "hidden";
	delPinControlUI.style.width = '80px';
	delPinControlUI.style.height = '40px';
	delPinControlUI.style.borderRadius = '5px';
	delPinControlUI.style.cursor = 'pointer';
	delPinControlUI.title = 'Click to recenter the map';
	delPinControlDiv.appendChild(delPinControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	controlText.style.color = 'rgb(255,255,255)';
	controlText.style.fontFamily = 'Avenir';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = 'Undo';
	delPinControlUI.appendChild(controlText);

	//Remove the most recently added pin.
	delPinControlUI.addEventListener('click', function() {
		if (markers.length>0){
			markers[markers.length-1].setMap(null);
			markers.pop();
		}	
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
	delAllPinControlUI.style.width = '120px';
	delAllPinControlUI.style.height = '40px';
	delAllPinControlUI.style.borderRadius = '5px';
	delAllPinControlUI.style.cursor = 'pointer';
	delAllPinControlUI.title = 'Click to recenter the map';
	delAllPinControlDiv.appendChild(delAllPinControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	controlText.style.color = 'rgb(255,255,255)';
	controlText.style.fontFamily = 'Avenir';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = 'Clear All Pins';
	delAllPinControlUI.appendChild(controlText);

	//Remove all pins.
	delAllPinControlUI.addEventListener('click', function() {

		for (var i=0; i<markers.length; i++){
			markers[i].setMap(null);
		}

		markers = [];
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
	delRouteControlUI.style.width = '80px';
	delRouteControlUI.style.height = '40px';
	delRouteControlUI.style.borderRadius = '5px';
	delRouteControlUI.style.cursor = 'pointer';
	delRouteControlUI.title = 'Click to recenter the map';
	delRouteControlDiv.appendChild(delRouteControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	controlText.style.color = 'rgb(255,255,255)';
	controlText.style.fontFamily = 'Avenir';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = 'Undo';
	delRouteControlUI.appendChild(controlText);

	//Remove the most recently added route.
	delRouteControlUI.addEventListener('click', function() {
		if (lines.length>0){
			lines[lines.length-1].setMap(null);
			lines.pop();
		}	
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
	delAllRouteControlUI.style.width = '140px';
	delAllRouteControlUI.style.height = '40px';
	delRouteControlUI.style.borderRadius = '5px';
	delAllRouteControlUI.style.cursor = 'pointer';
	delAllRouteControlUI.title = 'Click to recenter the map';
	delAllRouteControlDiv.appendChild(delAllRouteControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	controlText.style.color = 'rgb(255,255,255)';
	controlText.style.fontFamily = 'Avenir';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = 'Clear All Routes';
	delAllRouteControlUI.appendChild(controlText);

	//Remove all routes.
	delAllRouteControlUI.addEventListener('click', function() {

		for (var i=0; i<lines.length; i++){
			lines[i].setMap(null);
		}

		lines = [];
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
	revRouteControlUI.style.width = '120px';
	revRouteControlUI.style.height = '40px';
	delRouteControlUI.style.borderRadius = '5px';
	revRouteControlUI.style.cursor = 'pointer';
	revRouteControlUI.title = 'Click to recenter the map';
	revRouteControlDiv.appendChild(revRouteControlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	controlText.style.color = 'rgb(255,255,255)';
	controlText.style.fontFamily = 'Avenir';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = 'Reverse Route';
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

				flightPath.addListener('click', function() {
          			map.setZoom(8);
          			map.setCenter(marker.getPosition());
        		});

        		flightPlanCoordinates = [];

            } else{
				flightPlanCoordinates.push({lat: parseFloat(window.currentRouteObj[i].lat), lng: parseFloat(window.currentRouteObj[i].lng)});
            }
        }

		window.currentRouteObj = [];
  	}

  	if(window.currentMarkerObj[0]){

	window.currentMarkerObj = window.currentMarkerObj.slice(0, window.currentMarkerObj.length/2 - 1);

	//Draw markers (only works if marker like description and notes data is present)
    for (var i=0;i<window.currentMarkerObj.length;i++){

	console.log(window.currentMarkerObj);
		
      var marker = new google.maps.Marker({
          position: window.currentMarkerObj[i],
          map: map,
          title: i.toString
        });

		//Create an object for referencing the current point
		markerPlotRefs[i] = {"title": marker.toString(), "obj": marker, "ref": i};
		
		//Add click listeners to markers to bring up info and siplay data
		markerPlotRefs[i].obj.addListener('click', function() {
			
		  //Find the reference number for the current marker
		  for (var j=0;j<markerPlotRefs.length;j++){
			  if (this === markerPlotRefs[j].obj){

				console.log(markerPlotRefs[j].ref);
			  }
		  }
		  
		   
        });

		
      }
	  console.log(markerPlotRefs)
      window.currentMarkerObj = []; 
  	}

	//When a user draws a route or plots a pin, add it to lists to be saved
    google.maps.event.addDomListener(drawingManager, 'markercomplete', function(marker) {
        markers.push(marker);
	    //this.setCreateMapUI();
	    var createPinPanel = document.getElementById('popup-create-pin-panel');
        createPinPanel.hidden = false;
		var mapsPanel = document.getElementById('popup-maps-panel');
   		mapsPanel.hidden = true;	
		delPinControlUI.style.visibility = "visible";
		delAllPinControlUI.style.visibility = "visible";
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
	    var createRoutePanel = document.getElementById('popup-create-route-panel');
        createRoutePanel.hidden = false;
		var mapsPanel = document.getElementById('popup-maps-panel');
   		mapsPanel.hidden = true;	
		delAllRouteControlUI.style.visibility = "visible";	
		delRouteControlUI.style.visibility = "visible";
		revRouteControlUI.style.visibility = "visible";
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
