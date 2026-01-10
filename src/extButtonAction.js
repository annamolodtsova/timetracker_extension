/*
Open a new tab, and load "window.html" into it.
*/

// Workaround for chrome based browsers
if (typeof browser === "undefined") {
  var browser = chrome;
}

function openWindow() {
  console.log("injecting");
   browser.tabs.create({
     "url": "/window/window.html",
   });
}

browser.action.onClicked.addListener(openWindow);

