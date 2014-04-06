/*global chrome*/
(function(){
  "use strict";

  var sendMessage, sendToServer,
      makeRequest, stringify, stringifyPrimitive, escape,

      apiHost = "https://clipsync.herokuapp.com",

      userId = null;

  // check for install
  chrome.storage.sync.get("id", function(data){
    if (data.id){
      userId = data.id;
    } else {
      chrome.tabs.create({url: "install.html"});
    }
  });

  // Base ajax request method
  makeRequest = function(url, method, data, headers, cb){
    var req = new XMLHttpRequest();
  
    if (data && method === "GET"){
      data = stringify(data); // get the query string
    } else if (data && method === "POST"){
      data = JSON.stringify(data); // all of our post data is going to be json encoded cause it's better
    } else {
      data = "";
    }
    
    req.onreadystatechange = function(){
      if (req.readyState === 4){
        if (req.status !== 200){
          return cb({status: req.status, msg: req.response}, null);
        }
        return cb(null, JSON.parse(req.response));
      }
    };

    if (method === "GET" && data){
      url += "?" + data;
    }

    req.open(method, url, true);
    
    if (method === "POST"){
      req.setRequestHeader("Content-Type", "application/json");
    }

    for (var header in headers){
      if (headers.hasOwnProperty(header)){
        req.setRequestHeader(header, headers[header]);
      }
    }

    if (method === "POST"){
      console.log("Sending data "  + data);
      req.send(data);
    } else {
      req.send();
    }
  };

  // creates a querystring from an object
  stringify = function(obj){
    return Object.keys(obj).map(function(k) {
      if(Array.isArray(obj[k])){
        return obj[k].map(function(v){
          return escape(stringifyPrimitive(k))+'='+escape(stringifyPrimitive(v));
        });
      } else {
        return escape(stringifyPrimitive(k))+'='+escape(stringifyPrimitive(obj[k]));
      }
    }).join('&');
  };
  // turns things into strings
  stringifyPrimitive = function(value){
    switch(typeof value){
      case 'string' : return value;
      case 'boolean' : return value ? 'true' : 'false';
      case 'number' : return isFinite(value) ? value : '';
      default : return '';
    }
  };

  escape = function(value){
    return encodeURIComponent(value).replace('%20', '+');
  };

  sendMessage = function(info){
    var message = info.selectionText;
    if (userId === null){
      chrome.storage.sync.get("id", function(data){
        if (data.id){
          userId = data.id;
          sendToServer(message);
        }
      });
    } else {
      sendToServer(message);
    }
  };

  sendToServer = function(message){
    var url = apiHost + "/b/message";
    makeRequest(url, "POST", {google_id: userId, message: message}, null, function(err, data){
      if (err){
        return console.log("server error", err);
      }
      return console.log("done", data);
    });
  };

  chrome.contextMenus.create({"title": "Copy to Android", contexts: ["selection"],
                              "onclick": sendMessage}, function() {
    if (chrome.extension.lastError) {
      console.log("Uh oh", chrome.extension.lastError);
    }
  });
}());
