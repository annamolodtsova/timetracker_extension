/*
Open a new tab, and load "window.html" into it.
*/
function openWindow() {
  console.log("injecting");
   browser.tabs.create({
     "url": "/window/window.html"
   });
}


/*
Add openMyPage() as a listener to clicks on the browser action.
*/
browser.browserAction.onClicked.addListener(openWindow);
