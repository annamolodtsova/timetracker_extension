"use strict";

function main() {

    var CARD_AREA = document.getElementById("card-list"); //element that consists of task card, buttons and time elements on it
    //console.debug(CARD_AREA);

    const dbName = "tt_db";

    //request to open database
    var request = indexedDB.open(dbName, 3);

    request.onerror = (e) => {
        alert("To make this web app work you should allow it to use IndexedDB.");
    };

    //request to update database version if needed
    request.onupgradeneeded = (e) => {
        var db = e.target.result;
        var objectStore = db.createObjectStore("trackers", {
            keyPath: "id",
            autoIncrement: true
        });
    };

    //in case of success db opening function getRecords() gets db records and shows them as cards
    //in case if button to add new travker is clicked initAddButton() adds new db record and shows it as a card
    request.onsuccess = (e) => {
        var db = e.target.result;

        db.onerror = (e) => {
            alert("Smth went wrong");
        }

        getRecords(db);
        initAddButton(db);
    }

    /*
    Params: db object
    Function gets existing records from the db using openCursor() method
    Function gets id, title, time from each record and pass them to showCard() function
    */
    function getRecords(db) {
        var objectStore = db.transaction(["trackers"]).objectStore("trackers");
        objectStore.openCursor().onsuccess = (e) => {
            var cursor = e.target.result;
            if (cursor) {
                var id = cursor.key;
                var title = cursor.value.title;
                var time = convertTime(cursor.value.time);
                showCard(id, title, time, db);
                cursor.continue();
            }
        }
    }

    /*
    Params: db object
    Function initialises addNewTracker() function by clicking the add button (id="add-button")
    Function addNewTracker() gets text from the title input,
    puts it to the tracker object and passes tracker object to the add request
    In case of add request success showCard() function is initialised and dosplays
    new tracker card with given title
    */
    function initAddButton(db) {
        function addNewTracker() {
            var name = document.getElementById("title").value;
            //console.debug("new name", name);
            var tracker = {
                title: name,
                time: 0
            }
            var addReq = db.transaction(["trackers"], "readwrite").objectStore("trackers").add(tracker);
            addReq.onsuccess = (e) => {
                var id = e.target.result;
                if (tracker.title != "") {
                    showCard(id, tracker.title, tracker.time);
                    document.getElementById("title").value = "";
                    //console.debug(document.getElementById("title").value);
                } else {
                    alert("Please enter title for your tracker.");
                }
            }
        }

        var addButton = document.getElementById("add-button");
        addButton.onclick = addNewTracker;
    }

    /*
    Params: id of the tracker to remove, db object
    Parameters are passed to the delete request in order to remove record from the database
    In case of success appropriate card is removed from the view
    */
    function removeTracker(id, db) {
        var delReq = db.transaction(["trackers"], "readwrite").objectStore("trackers").delete(parseInt(id));
        delReq.onsuccess = (e) => {
            document.getElementById("db_id" + id).remove();
        }
    }

    /*
    Params: id of the trakcer to update, time value, db object, element where the time updating will be applied
    Function gets tracker record by id. If case of success time field of the tracker object is updated by adding new time value
    New object is passed to the method put in order to update the record
    In case of success new time is shown next the commonTimeElement element on the tracker card
    */
    function updateTime(id, newTime, db, commonTimeElement) {
        console.debug("Id: ", id);
        console.debug("New time: ", newTime);
        console.debug("DB: ", db);
        var objectStoreReq = db.transaction(['trackers'], "readwrite").objectStore('trackers').get(parseInt(id));

        objectStoreReq.onsuccess = (e) => {
            var data = e.target.result;
            console.debug("This is data ", data);
            data.time += parseInt(newTime);
            console.debug("This is updated data ", data);
            var updateReq = db.transaction(["trackers"], "readwrite").objectStore("trackers").put(data);
            console.log("The transaction that originated this request is " + updateReq.transaction);
            updateReq.onsuccess = (e) => {
                commonTimeElement.innerText = convertTime(data.time);
            };
        }
    }

    /*
    Params: seconds value
    Function for converting value given in seconds to the format "hh:mm:ss"
    Retruns string in format "hh:mm:ss"
    */
    function convertTime(seconds) {
        //seconds = 100000;
        var days = parseInt(seconds / 86400);
        var leftSeconds = seconds % 86400;
        var hours = parseInt(leftSeconds / 3600);
        leftSeconds = seconds % 3600;
        var minutes = parseInt(leftSeconds / 60);
        leftSeconds = seconds % 60;
        //console.debug(days + " days " + hours + ":" + minutes + ":" + leftSeconds);
        var timeString = hours + ":" + minutes + ":" + leftSeconds;
        return timeString;
    }

    /*
    Params: id of the tracker to show, title of the tracker object, time of the tracker object, db object
    Function initialises all DOM elements that should be displayed within the CARD_AREA and arranges them in appropriate order
    Function realises buttonStart onclick, buttonPause onclick and buttonRemove onclick event handlers:
    Untill the buttonStart is clicked buttonPause is disabled and buttonStart enabled
    When buttonStart is clicked buttonStart becomes disabled and buttonPause enabled, setInterval() function which updates
    currentTimeElement every 1000 milliseconds is initialised
    When buttonPause is clicked buttonStart becomes enabled and buttonPause disabled, setInterval() function work is stoped by clearInterval() function
    updateTime() function is call happens and currentTimeElement text is set to "0:0:0"
    removeTracker button click initialises removeTracker() function
    */
    function showCard(id, title, time, db) {
        console.log("title = ", title, "time = ", time);
        console.debug("tt-list element ", CARD_AREA);
        var counter = 0;
        var cardLi = document.createElement("li");
        cardLi.id = "db_id" + id;
        var cardDiv = document.createElement("div");
        var trackerName = document.createElement("div");
        trackerName.innerText = title;
        var timeSection = document.createElement("section");
        timeSection.className = "time-section";
        var buttonSection = document.createElement("section");
        buttonSection.className = "tt-button-section";
        var commonTimeDiv = document.createElement("div");
        commonTimeDiv.innerText = "Common spent: ";
        var commonTimeElement = document.createElement("time");
        commonTimeElement.innerText = time;
        var currentTimeDiv = document.createElement("div");
        currentTimeDiv.innerText = "Current progress: ";
        var currentTimeElement = document.createElement("time");
        currentTimeElement.innerText = "0:0:0";
        var buttonStart = document.createElement("button");
        buttonStart.setAttribute("type", "button");
        buttonStart.className = "button-left";
        buttonStart.innerText = "Start";
        buttonStart.onclick = () => {
            buttonStart.disabled = true;
            //console.debug("При нажатии на старт кнопка старт " + buttonStart.disabled);
            buttonPause.disabled = false;
            //console.debug("При нажатии на старт кнопка стоп " + buttonPause.disabled);
            counter = 0;
            var intervalId = setInterval(() => {
                counter++;
                currentTimeElement.innerText = convertTime(counter);
            }, 1000);
            buttonPause.onclick = () => {
                clearInterval(intervalId);
                buttonStart.disabled = false;
                //console.debug("При нажатии на стоп кнопка старт " + buttonStart.disabled);
                buttonPause.disabled = true;
                //console.debug("При нажатии на стоп кнопка старт " + buttonPause.disabled);
                updateTime(id, counter, db, commonTimeElement);
                currentTimeElement.innerText = "0:0:0";
            }
        }
        var buttonPause = document.createElement("button");
        buttonPause.setAttribute("type", "button");
        buttonPause.className = "button-left";
        buttonPause.innerText = "Pause";
        buttonPause.disabled = true;
        var buttonRemove = document.createElement("button");
        buttonRemove.setAttribute("type", "button");
        buttonRemove.className = "button-right";
        buttonRemove.innerText = "Remove";
        buttonRemove.onclick = () => {
            removeTracker(id, db);
        }
        CARD_AREA.appendChild(cardLi);
        cardLi.appendChild(cardDiv);
        cardDiv.appendChild(trackerName);
        cardDiv.appendChild(timeSection);
        cardDiv.appendChild(buttonSection);
        timeSection.appendChild(commonTimeDiv);
        timeSection.appendChild(currentTimeDiv);
        buttonSection.appendChild(buttonStart);
        buttonSection.appendChild(buttonPause);
        buttonSection.appendChild(buttonRemove);
        currentTimeDiv.appendChild(currentTimeElement);
        commonTimeDiv.appendChild(commonTimeElement);
    }
}

main();
