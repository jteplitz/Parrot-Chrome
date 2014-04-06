/*globals chrome*/
(function(){
  "use strict";
  var getAuthToken,
      makeRequest, stringify, stringifyPrimitive, escape,

      apiHost = "https://clipsync.herokuapp.com";


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

  getAuthToken = function(){
    chrome.identity.getAuthToken({'interactive': true}, function(token) {
      if (chrome.extension.lastError) {
        console.log("Uh oh", chrome.extension.lastError);
      }
      console.log("got token", token);
      
      var url = "https://www.googleapis.com/oauth2/v1/userinfo";
      makeRequest(url, "GET", {access_token: token}, null, function(err, data){
        if (err){
          return console.log("AWWW :(", err);
        }

        var id = data.id;

        // save their id
        chrome.storage.sync.set({"id": data.id}, function(err){
          console.log("error", err);
        });

        // register the browser
        var url = apiHost + "/b/register";
        var postData = {
          google_id: id
        };
        makeRequest(url, "POST", postData, null, function(err, data){
          if (err){
            return console.log("AWWWWWW :((", err);
          }
          
          console.log("done", data);
          if (data.appInstalled){
            document.getElementById("text").innerText = "You're ready to go. Just right click on selected text and hit send to Android. :)";
          } else {
            document.getElementById("text").innerText = "You're almost there. Install the app on your phone first.";
          }
        });
      });
    });
  };

  getAuthToken();

}());
