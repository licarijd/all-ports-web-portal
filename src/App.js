/*Developed by Justin Licari*/

/*TODO:
- fix search
- save and reference pictures by map name, user id and timestamp. This referencing will make it easier to modifying
- handle uploading pictures for pins
- handle loading pictures for pins
- only upload pictures after 'save pin' is clicked
- adding pins to exiting maps doesn't save description and pin data*/

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

//The name of the currently referenced map, set by either loading an existing map or by entering a name for a new map.
var mapName = "";

//Lists of all new markers and lines added to the current map via drawing tools.
var markers = [];
var lines = [];

//First and final co-ordinates of a route are stored for route direction
var routeStarts = [];
var routeFinishes = [];

//Represents a retrieved snapshot of the number of pictures attached to a map
var picCount = null;

//A reference to google object from the Maps API
const google = window.google;

//Global variables representing retrieved routes and markers for a particular map
window.currentRouteObj = [];
window.currentMarkerObj = [];

//A list of all of a user's map snapshots from Firebase
var mapNameSnapshots = null;

//uid from Firebse
var userID;

//A list of all of a user's maps from Firebase
var mapButtonList = [];

//Represents if the map list has been checked at the start of the program
var mapsChecked = false;

//Represents whether or not UI elements related to creating/modifying maps is displayed
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

//Route's and pins are orgnized according to the order they re created/modified/loaded from firebase.
var pinNum;
var routeNum;

//Array of Google Maps objects created to plot every marker. Used for creating  unique listener for every pin.
var markerPlotRefs = [];

//Used to reference 'this' in initMap.
var thisRef;

//If a user tries saving a marker or route before they have a map name, set this flag to true to indicate that it needs to be saved once the map is named.
var saveWhenMapSet = false;

//References the pin which the info in the pin panel corresponds to. -1 indicates that no pin is referenced
var currentPinRef = -1;

//Same for routes
var currentRouteRef = -1;

//Represents the distance of a route that has just been plotted
var currentRouteDistance;

class App extends Component {
	constructor() {
    	super();
    	this.state = {
      		user: null, 

			//A counter which increments as users upload pictures
      		currentPinPictures: 0,

			//User input fields
			mapNameField: '',
      		pinNameField: '',
      		pinDescriptionField: '',
      		pinNotesField: '',
      		pinTagsField: '',
      		routeNameField: '',
      		routeNotesField: '',
			routeTagsField: '',
			routeDistanceField: 0,

			//A list of all loaded images
      		loadedImage: []
    }

	this.savePin = this.savePin.bind(this);
	this.saveRoute = this.saveRoute.bind(this);
	this.save = this.save.bind(this);
    this.login = this.login.bind(this); 
    this.logout = this.logout.bind(this); 
	this.setPinFormData = this.setPinFormData.bind(this); 
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
					console.log(mapNameSnapshots)
        	});
		}
  }

 //Update state variables based on user input 
 handleChange(event) {
    this.setState({ mapNameField: event.target.value });
    mapName = event.target.value;
  }

  handleChangePinName(event) {
    this.setState({ pinNameField: event.target.value });
  }

  handleChangePinDescription(event) {
    this.setState({ pinDescriptionField: event.target.value });
  }

  handleChangePinNotes(event) {
    this.setState({ pinNotesField: event.target.value });
  }

  handleChangePinTags(event) {
    this.setState({ pinTagsField: event.target.value });
  }

  handleChangeRouteName(event) {
    this.setState({ routeNameField: event.target.value });
  }

  handleChangeRouteNotes(event) {
    this.setState({ routeNotesField: event.target.value });
  }

  //Gets an image via firebase URL and loads it into an element. Both JPG and PNG images are supported.
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

  //UI methods deal with activating/deactivating dom elements
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

  //Retrieve thumbnail image for a particular map from firebase.
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

  //Generate a code which can be used to construct a short URL that references a map. The ref is stored in a public database section. NOT YET SUPPORTED
  share(){
	  var shortUrl = this.hashCode(userID+mapName);
	  var publicRef = 'users/' + userID + '/maps/' + "/" + mapName;
	  firebase.database().ref('publicMaps/' + shortUrl + "/ref").push(publicRef);
  }

  hashCode = function(s){
  	  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
  }

  saveRoute(routeNum){
		//Save the map before saving route data associated with it
		if (this.state.mapNameField!=""){

			routeNum = lines.length-1;
			var lineData;

			for (var i = 0; i < lines.length; i++) {
				var line = lines[i].getPath().getArray();
				lineData += line + "+";
			}

			//Clear the current state of the route data for the current map. By writing the current state of route data, we can handle deletion and updating.
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/").child("routeNameData").remove();
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/").child("routeDistanceData").remove();
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/").child("routeNotesData").remove();

			//If a route is being referenced and the route already has data associated with it, update that data with the input fields.
			if (currentRouteRef>=0){
				if (routeNameData[currentRouteRef]){
					routeNameData[currentRouteRef] = this.state.routeNameField;
				}

				if (routeDistanceData[currentRouteRef]){
					routeDistanceData[currentRouteRef] = this.state.routeDistanceField;
				}

				if (routeNoteData[currentRouteRef]){
					routeNoteData[currentRouteRef] = this.state.routeNotesField;
				}
			} 

			for (var i = 0;i<routeNameData.length;i++){
				firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/routeNameData").push(routeNameData[i]);
			}

			for (var i = 0;i<routeDistanceData.length;i++){
				firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/routeDistanceData").push(routeDistanceData[i]);
			}

			for (var i = 0;i<routeNoteData.length;i++){
				firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/routeNotesData").push(routeNoteData[i]);
			}

			//If no route is being referenced, then it is a new route.
			if (this.state.routeNameField!="" && currentRouteRef<0){
				routeNameData.push(this.state.routeNameField);
				firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/routeNameData").push(this.state.routeNameField);

				//Push description and notes data if they exist. If not, set a default message.
				firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/routeDistanceData").push(this.state.routeDistance);
				

				if (this.state.routeNotesField!=""){
					firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/routeNotesData").push(this.state.routeNotesField);
				} else {
					firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/routeNotesData").push("Please enter notes");
				}
			}

			//Push the state of all current pins
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/").child("lines").remove();
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/lines").push(lineData);

			this.setState({
				routeNameField: ""
			});
			this.setState({
				routeDistanceField: ""
			});
			this.setState({
				routeNotesField: ""
			});
		
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/routeTagsData").push(this.state.routeTagsField);
			
			//Refresh the map, retrieve the data and plot it
			this.load();
			this.generateButtonList();
			this.getMapData(mapName);
			var mapsPanel = document.getElementById('popup-maps-panel');
			mapsPanel.hidden = true;

	//Prompt users to create a map if they haven't already
	} else {
		saveWhenMapSet = true;
		this.activateSaveMapUI();
	}
  }

  //Save the state of the current list of pins
  savePin(pinNum) {
	  	if(!this.state.user){
			  this.login();
		  }

		//Save the map before saving pin data associated with it
		if (this.state.mapNameField!=""){

			pinNum = markers.length-1;
			var pinData;

			//Clear the current state of the pin data for the current map. By writing the current state of pin data, we can handle deletion and updating.
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/").child("markerNameData").remove();
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/").child("markerDescriptionData").remove();
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/").child("markerNotesData").remove();

			//If a pin is being referenced and the pin already has data associated with it, update that data with the input fields.
			if (currentPinRef>=0){
				if (markerNameData[currentPinRef]){
					markerNameData[currentPinRef] = this.state.pinNameField;
				}

				if (markerDescriptionData[currentPinRef]){
					markerDescriptionData[currentPinRef] = this.state.pinDescriptionField;
				}

				if (markerNoteData[currentPinRef]){
					markerNoteData[currentPinRef] = this.state.pinNotesField;
				}
			} 

			for (var i = 0;i<markerNameData.length;i++){
				firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerNameData").push(markerNameData[i]);
			}

			for (var i = 0;i<markerDescriptionData.length -1;i++){
				firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerDescriptionData").push(markerDescriptionData[i]);
			}

			for (var i = 0;i<markerNoteData.length - 1;i++){
				firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerNotesData").push(markerNoteData[i]);
			}

			//If no pin is being referenced, then it is a new pin.
			if (this.state.pinNameField!="" && currentPinRef<0){
				markerNameData.push(this.state.pinNameField);
				firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerNameData").push(this.state.pinNameField);

				//Push description and notes data if they exist. If not, set a default message.
				if (this.state.pinDescriptionField!=""){
					firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerDescriptionData").push(this.state.pinDescriptionField);
				} else {
					firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerDescriptionData").push("Please enter a description");
				}

				if (this.state.pinNotesField!=""){
					firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerNotesData").push(this.state.pinNotesField);
				} else {
					firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerNotesData").push("Please enter notes");
				}
			}

			//Add pins and routes to lists
			for (var i = 0; i < markers.length; i++) {
				var marker = markers[i].position;
				if (markerNameData[i]&&markerNameData[i]!=""){
					pinData += marker + "+";

				}
			}

			//Push the state of all current pins
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/").child("markers").remove();
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markers").push(pinData);

			this.setState({
				pinNameField: ""
			});
			this.setState({
				pinDescriptionField: ""
			});
			this.setState({
				pinNotesField: ""
			});
		
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerTagsData").push(this.state.pinTagsField);
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName  + "/markerPicData").child("pics").set({pics: this.state.currentPinPictures});
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

			//markerDates.push(dateAdded);
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/markerDateAddedData").push(dateAdded);
			
			//Retrieve the data and plot it
			if (saveWhenMapSet===true){
				saveWhenMapSet = false;
				this.save();
			}
			
			//Refresh the map, retrieve the data and plot it
			this.load();
			this.generateButtonList();
			this.getMapData(mapName);
			var mapsPanel = document.getElementById('popup-maps-panel');
			mapsPanel.hidden = true;

	//Prompt users to create a map if they haven't already
	} else {
		saveWhenMapSet = true;
		this.activateSaveMapUI();
	}
  }

  //Handle save data related to maps, exclusive of pins and routes
  save() {
	  if (this.state.mapNameField!=""){

			//Push all map data to Firebase, including a number to represent added pictures, excluding the image files
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/mapName").push(mapName);
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/author").push(userID);
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
			
			//Cam data is used to position the map's view upon reloading
			if (!camZoom){
				camZoom = 8;
			}

			if (!camTarget){
				camTarget = {lat: -34.397, lng: 150.644}
				var thumbnail = "https://maps.googleapis.com/maps/api/staticmap?center=-34.397,150.644&zoom=" + camZoom.toString() + "&size=385x200&key=AIzaSyB31IEUSYz_m5JLGt70rJs3ueCSx2dYv_0";
			
			} else {
				var camTargetVal = {lat: camTarget.lat(), lng: camTarget.lng()}
				var thumbnail = "https://maps.googleapis.com/maps/api/staticmap?center=" + camTarget.lat().toString() + "," + camTarget.lng().toString() + "&zoom=" + camZoom.toString() + "&size=385x200&key=AIzaSyB31IEUSYz_m5JLGt70rJs3ueCSx2dYv_0";
			
			}

			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/camZoom").push(camZoom);
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/camTarget").push(camTargetVal);
			firebase.database().ref('users/' + userID + '/maps/' + "/" + mapName + "/thumbnail").push(thumbnail);

			this.deactivateSaveMapUI();
	  }
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

  //Retrieve and parse all data from Firebase needed to construct a map's pins and routes
  getMapData(mapID){

	this.showMapUI(); 
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

	var routeNameDataString;
	var routeDistanceDataString;
	var routeNoteDataString;
	var routeTagDataString;

    var db = firebase.database();
	var routeRef;

	//Use different (public) path for loading public maps
	if (publicMap) {
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

	//Retrieve pin/route Names, Descriptions, and Notes
	if (publicMap) {
    	routeRef = db.ref(mapID + '/markerNameData/');
	} else {
    	routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/markerNameData/');	
	}

    routeRef.orderByChild("name").on("child_added", function (snapshot) {
        markerNameDataString+=snapshot.val()+("+"); 
    });

	if (publicMap) {
    	routeRef = db.ref(mapID + '/routeNameData/');
	} else {
    	routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/routeNameData/');	
	}

    routeRef.orderByChild("name").on("child_added", function (snapshot) {
        routeNameDataString+=snapshot.val()+("+"); 
    });

	if (publicMap) {
    	routeRef = db.ref(mapID + '/markerDescriptionData/');
	} else {
    	routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/markerDescriptionData/');	
	}

    routeRef.orderByChild("desc").on("child_added", function (snapshot) {
        markerDescriptionDataString+=snapshot.val()+("+"); 
    });
	
	if (publicMap) {
    	routeRef = db.ref(mapID + '/routeDistanceData/');
	} else {
    	routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/routeDistanceData/');	
	}

    routeRef.orderByChild("desc").on("child_added", function (snapshot) {
        routeDistanceDataString+=snapshot.val()+("+"); 
    });

	if (publicMap) {
    	routeRef = db.ref(mapID + '/markerNotesData/');
	} else {
    	routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/markerNotesData/');	
	}

    routeRef.orderByChild("notes").on("child_added", function (snapshot) {
        markerNoteDataString+=snapshot.val()+("+"); 
    });

	if (publicMap) {
    	routeRef = db.ref(mapID + '/routeNotesData/');
	} else {
    	routeRef = db.ref('users/' + userID + '/maps/' + mapID + '/routeNotesData/');	
	}

    routeRef.orderByChild("notes").on("child_added", function (snapshot) {
        routeNoteDataString+=snapshot.val()+("+"); 
    });
    
	//If firebase data exists for a given attribute, set global references to it and update the form with the first pin's info
	if(markerNameDataString){
    	markerNameDataString = markerNameDataString.substr(9);
    	markerNameData = markerNameDataString.split("+"); 
		markerNameData.pop();

		//By defalut, start by showing pin info for the first pin added to the loaded map
		var createPinPanel = document.getElementById('popup-create-pin-panel');
        createPinPanel.hidden = false;
		this.setPinFormData(0);
    }

	if(markerDescriptionDataString){
    	markerDescriptionDataString = markerDescriptionDataString.substr(9);
    	markerDescriptionData = markerDescriptionDataString.split("+"); //Show pin info for the first pin
		var createPinPanel = document.getElementById('popup-create-pin-panel');
        createPinPanel.hidden = false;
		this.setPinFormData(0);
    }

	//First 9 characters are always 'undefined' so remove them, as well as whitespace and seperators
	if(markerNoteDataString){
    	markerNoteDataString = markerNoteDataString.substr(9);
    	markerNoteData = markerNoteDataString.split("+"); //Show pin info for the first pin
		var createPinPanel = document.getElementById('popup-create-pin-panel');
        createPinPanel.hidden = false;
		this.setPinFormData(0);
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

	//Draw the map
	this.initMap();

	//Load the pictures of the map
	this.load();
  }

  //Update the pin form and state variables
  setPinFormData(currentPinNumber){
	  currentPinRef = currentPinNumber;
	  this.setState({
			pinNameField: markerNameData[currentPinNumber]
	  });
	  this.setState({
			pinDescriptionField: markerDescriptionData[currentPinNumber]
	  });
	  this.setState({
			pinNotesField: markerNoteData[currentPinNumber]
	  });
  }

    //Update the routeform and state variables
  setRouteFormData(currentRouteNumber){
	  currentRouteRef = currentRouteNumber;
	  this.setState({
			routeNameField: routeNameData[currentRouteNumber]
	  });
	  this.setState({
			routeDistanceField: routeDistanceData[currentRouteNumber]
	  });
	  this.setState({
			routeNotesField: routeNoteData[currentRouteNumber]
	  });
  }

  //Update the route state variable
  setRouteDistance(){
	  this.setState({
			routeDistance: currentRouteDistance
	  });
  }

  clearFormData(){
	  this.setState({
			pinNameField: ""
	  });
	  this.setState({
			pinDescriptionField: ""
	  });
	  this.setState({
			pinNotesField: ""
	  });

	  this.setState({
			routeNameField: ""
	  });
	  this.setState({
			routeDistance: 0
	  });
	  this.setState({
			routeNotesField: ""
	  });
  }
  
  //Render introduction overlay when web app starts
  render() {
    return (
      <div id="interctable">
		<div id = "save-map-popup" className = "save-map-popup">
			<h2 id = "welcome-back-save" className = "welcome-back-save">Welcome back!
			You can now finalize details and save your map to your account</h2>
			<h2 id = "welcome-back-save" className = "welcome-back-save">Name This Map</h2>
			<input className = "name-this-map-input"
            type="text"
            value={this.state.mapNameField}
            onChange={this.handleChange}
          />
			<button id="save-map-button" className="save-map-button" onClick={this.savePin.bind(this)}>Save Map</button>
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

		{/*If a user tries to save and isn't logged in, prompt login. If they are, activate the save map UI*/
			this.state.user ?
              <button  className="save-map" onClick={this.activateSaveMapUI}>Save Map</button>
              :
              <button  className="save-map" onClick={this.login}>Save Map</button>
            }
			{/*Logout button provided for testing*/
			this.state.user ?
              <button onClick={this.logout}>Log Out</button>
              :
              <button onClick={this.login}>Ignore this button for now</button>
            }
          <img src={logo} className="App-logo" alt="logo" />
          <div className = "profile-details"  id="profile-details">
          </div>
          <div className = "popup-create-route-panel"  id="popup-create-route-panel">
			<img src = {favsIcon2} className = "favs-icon-2"/>
			<h2 className = "route">Place</h2>
				<input className = "route-input"
					type="text"
					value={this.state.routeNameField}
					onChange={this.handleChangeRouteName}
				/>
			<h2 className = "distance">Distance</h2>
			<h2 className = "distance-data">{this.state.routeDistance}km</h2>
			<h2 className = "notes-route">Notes</h2>
				<input className = "notes-input-route"
					type="text"
					value={this.state.routeNotesField}
					onChange={this.handleChangeRouteNotes}
				/>
			<input type="image" src={saveIcon} className="save-pin" onClick={this.saveRoute.bind(this)}></input>
			<input type="image" src={deleteIcon} className="delete-pin"></input>
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
					{/*currently, uploaded pictures are attached to the current map. TODO: attach to current pin. 
					They are organized by the order in which they are uploaded(currentPictures). TODO: add timestamp*/}
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
					{/*A button is generated for every loaded map name. Clicking a button will load it's map*/}
					<button className = "map-button-list" onClick={() => this.getMapData(item)}>
						<span className = "map-button-view">
							<img className = "map-thumb" src={this.getThumnail(item)}></img>
							<span className = "map-button-overlay">
								<span className = "map-name-text">{item}</span>
								<span className = "map-created-on">Created on {dateCreated}</span>
								<span className = "map-likes">{likes}</span>
								<img className = "map-favs" src={favsIcon}></img>
							</span>	
						</span>	      
					</button>
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
			{/*TODO: display a pin's pictures*/}
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
	  thisRef = this;
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

	//Handle loading public maps.
	if (window.location.href != "https://pintionary.herokuapp.com/" && window.location.href != "http://localhost:3000/"){
		publicMap = true;

		//CHANGE FOR PROD. Checks if the page is loading a shortURL
		var shortUrlCode = window.location.href.substr(22/*33*/);
		console.log("shortUrlCode"+shortUrlCode)
		var db = firebase.database();
		var ref = db.ref('publicMaps/' + shortUrlCode + "/ref");
      	ref.orderByChild("ref").on("child_added", function (snapshot) {
  			mapRef = snapshot.val();
		}, function (errorObject) {
  			console.log(errorObject);
		});
		if (mapRef){
			this.getMapData(mapRef);
		}	
	}
  }

  //Plot map pins and routes
  //Attached to TEST button
  test(){
    console.log("TEST");
  }

  //Load the Google Map 
  initMap = function() {

	//Every time a new map is loaded, maps is cleared and updated with the latest firebase data
	markers = [];

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
     });

	//Allow drawing on the map
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

	//Switch drawing type to marker
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
		var createPinPanel = document.getElementById('popup-create-pin-panel');
        createPinPanel.hidden = true;
		var createRoutePanel = document.getElementById('popup-create-route-panel');
        createRoutePanel.hidden = true;
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

		thisRef.clearFormData();

		var createPinPanel = document.getElementById('popup-create-pin-panel');
        createPinPanel.hidden = true;

		if (markers.length>0){
			markers[markers.length-1].setMap(null);
			markers.pop();
		}	

		if (markerNameData.length>0){
			markerNameData.pop();
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

		thisRef.clearFormData();

		var createPinPanel = document.getElementById('popup-create-pin-panel');
        createPinPanel.hidden = true;

		for (var i=0; i<markers.length; i++){
			markers[i].setMap(null);
		}

		markers = [];
		markerNameData = [];
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

		thisRef.clearFormData();

		var createRoutePanel = document.getElementById('popup-create-route-panel');
        createRoutePanel.hidden = true;

		if (lines.length>0){
			lines[lines.length-1].setMap(null);
			lines.pop();
		}

		if (routeNameData.length>0){
			routeNameData.pop();
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

		thisRef.clearFormData();

		var createRoutePanel = document.getElementById('popup-create-route-panel');
        createRoutePanel.hidden = true;

		for (var i=0; i<lines.length; i++){
			lines[i].setMap(null);
		}

		lines = [];
		routeNameData = [];
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

	//TODO: reverse route
	revRouteControlUI.addEventListener('click', function() {
		
		console.log("before rev: " + lines[lines.length-1].getPath().getArray());
		var tmp = lines[lines.length-1].getPath().getArray().reverse();
		console.log("after rev: start : " + tmp[0] + " finish: " + tmp[tmp.length-1]);

		//Set start and finish
		routeStarts[routeStarts.length-1] = tmp[0];
		routeFinishes[routeFinishes.length-1] = tmp[tmp.length-1];

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

	//Draw markers (only works if marker like description and notes data is present)
	var tmpInfo = markerNameData;
    for (var i=0;i<window.currentMarkerObj.length-1;i++){
	var display = tmpInfo[i].toString();

	  //Create the info window for pins containing the location name
	  var contentString = '<div id="content">'+
            '<div id="siteNotice">'+ display + 
            '</div>'+
            '</div>';

        var infowindow = new google.maps.InfoWindow({
          content: contentString
        });
		
      var marker = new google.maps.Marker({
          position: window.currentMarkerObj[i],
          map: map,
          title: i.toString
        });

		markers.push(marker);
		infowindow.open(map, marker);

		//Create an object for referencing the current point. Pass this to be used as a reference inside of the listener
		markerPlotRefs[i] = {"title": marker.toString(), "obj": marker, "ref": i, "_this": this};
		
		//Add click listeners to markers to bring up info and siplay data
		markerPlotRefs[i].obj.addListener('click', function() {
			
		  //Find the reference number for the current marker
		  for (var j=0;j<markerPlotRefs.length;j++){
			  if (this === markerPlotRefs[j].obj){

				//Call outer functions referencing outer 'this'
				markerPlotRefs[j]._this.setPinFormData(j);
				thisRef.setRouteDistance();
			  }
		  }
        });
      }
      window.currentMarkerObj = []; 
  	}

	//When a user draws a route or plots a pin/route, add it to lists to be saved
    google.maps.event.addDomListener(drawingManager, 'markercomplete', function(marker) {
		currentPinRef = -1;
		//If a user didn't name their pin, get rid of it
		if (markers.length > 0 && !markerNameData[markers.length-1] || markerNameData[markers.length-1] == ""){
			
			markers[markers.length - 1].setMap(null);
			markers.pop();
		}
        markers.push(marker);
	    var createPinPanel = document.getElementById('popup-create-pin-panel');
        createPinPanel.hidden = false;
		var createRoutePanel = document.getElementById('popup-create-route-panel');
        createRoutePanel.hidden = true;
		var mapsPanel = document.getElementById('popup-maps-panel');
   		mapsPanel.hidden = true;	
		delPinControlUI.style.visibility = "visible";
		delAllPinControlUI.style.visibility = "visible";

	    //Track camera position
	    camZoom = map.getZoom();
	    camTarget = map.getCenter();
    });

    google.maps.event.addDomListener(drawingManager, 'polylinecomplete', function(line) {
		currentRouteRef = -1;

		//If a user didn't name their route, get rid of it
		if (lines.length > 0 && !routeNameData[lines.length-1] || routeNameData[lines.length-1] == ""){
			lines[lines.length - 1].setMap(null);
			lines.pop();
		}
        lines.push(line);

		//Get the route distance to one decimal place.
		currentRouteDistance = Math.round(google.maps.geometry.spherical.computeLength(line.getPath()) * 10) / 10;
		thisRef.setRouteDistance();
		
		//Set start and finish
		var tmp = lines[lines.length-1].getPath().getArray();
		routeStarts.push(tmp[0]);
		routeFinishes.push(tmp[tmp.length-1]);

		var createPinPanel = document.getElementById('popup-create-pin-panel');
        createPinPanel.hidden = true;
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
