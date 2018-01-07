import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <div>
        <img src={logo} className="App-logo" alt="logo" />
        <div  className="dimmed"></div>
        <body>
          <h1 className="App-intro">Quick tips to familiarize you with Pintionary</h1>
          <button className="App-intro-button">
          Okay, let's start
        </button >
        </body>       
      </div>
    );
  }
}

export default App;
