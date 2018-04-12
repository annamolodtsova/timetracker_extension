/*
Open a new tab, and load "window.html" into it.
*/
function openWindow() {
  console.log("injecting");
   browser.tabs.create({
     "url": "/window/window.html"
   });
}


browser.browserAction.onClicked.addListener(openWindow);
