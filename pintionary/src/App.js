import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

const google = window.google;


var markers = [];
var lines = [];

class App extends Component {

  pinMode = true;

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

  authenticate(){
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
  }

  //Render introduction overlay when web app starts
  render() {
    return (
      <div id = "interctable">  
            
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
             <button  onClick={this.dismissIntro} className="load-button">
                load
            </button>
             <button id="clear" onClick={this.save} className="save-button">
                clear
            </button>
            <button  onClick={this.dismissIntro} className="sign-in-button">
                sign-n
            </button>
          </div> 
          <div id = "tools">
            <button  onClick={this.dismissIntro} className="add-pin">
                add pin
            </button>
             <button  onClick={this.dismissIntro} className="add-route">
                add route
            </button>
          </div>  

      </div>   
    );
  }

  componentDidMount(){

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
