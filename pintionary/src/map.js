   

import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

const google = window.google;

class Map extends Component {



 
  componentDidMount(){
     
  /*  var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDUl_1pB8VULv0KmItP_FuzmE4Y6qy0VeQ&libraries=drawing&callback=initMap";
    script.async = false;
    document.body.appendChild(script);*/
    

    function initMap() {
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

        var circles = [];

      google.maps.event.addDomListener(drawingManager, 'circlecomplete', function(circle) {
        circles.push(circle);
      });

         google.maps.event.addDomListener(savebutton, 'click', function() {
        document.getElementById("savedata").value = "";
        for (var i = 0; i < circles.length; i++) {
          var circleCenter = circles[i].getCenter();
          var circleRadius = circles[i].getRadius();
          document.getElementById("savedata").value += "circle((";
          document.getElementById("savedata").value += 
            circleCenter.lat().toFixed(3) + "," + circleCenter.lng().toFixed(3);
          document.getElementById("savedata").value += "), ";
          document.getElementById("savedata").value += circleRadius.toFixed(3) + ")\n";

        }
      });
    

    
        
        }
        google.maps.event.addDomListener(window, 'load', initialize);
  }

    render() {
      return <div>
        <p>I am a map component</p>
        <div id="map" ref="map"/>
      </div>
    }

}

export default App;
