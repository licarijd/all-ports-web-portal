import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {

  //Dismiss overlay when user clicks "get started" button
  dismissIntro(){
    var introElement = document.getElementById('intro');
    introElement.hidden = true;
  }
    
  //Render introduction overlay when web app starts
  render() {
    return (
      <div id = "intro">
        <img src={logo} className="App-logo" alt="logo" />
        <div  className="dimmed"></div>
        <body>
          <h1 className="App-intro">Quick tips to familiarize you with Pintionary</h1>
          <button  onClick={this.dismissIntro} className="App-intro-button">
          Okay, let's start
        </button>
        </body>       
      </div>
    );
  }
}

export default App;
