"use strict";

function main() {

    let CARD_AREA = document.getElementById("card-list"); //element that consists of task card, buttons and time elements on it
    //console.debug(CARD_AREA);

    const dbName = "tt_db";

    //request to open database
    let openRequest = indexedDB.open(dbName, 3);

    openRequest.onerror = (e) => {
        alert("To make this web app work you should allow it to use IndexedDB.");
    };

    //request to update database version if needed
    openRequest.onupgradeneeded = (e) => {
        let db = e.target.result;
        let objectStore = db.createObjectStore("trackers", {
            keyPath: "id",
            autoIncrement: true
        });
    };

    //in case of success db opening function getRecords() gets db records and shows them as cards
    //in case if button to add new travker is clicked initAddButton() adds new db record and shows it as a card
    openRequest.onsuccess = (e) => {
        let db = e.target.result;

        db.onerror = (e) => {
            alert("Smth went wrong");
        }

        getRecords(db);
        initAddButton(db);
    }

    function secToStr(seconds) {
        //let days = Math.floor(seconds / 86400);
        let hours = Math.floor(seconds / 3600);
        let minutes = Math.floor((seconds % 3600) / 60);
        let leftSeconds = seconds % 60;
        //console.debug(days + " days " + hours + ":" + minutes + ":" + leftSeconds);
        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(leftSeconds).padStart(2, '0');
        //var timeString = hours + ":" + minutes + ":" + leftSeconds;

        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }

    /*
    Params: db object
    Function gets existing records from the db using openCursor() method
    Function gets id, title, time from each record and pass them to showCard() function
    */
    function getRecords(db) {
        let objectStore = db.transaction(["trackers"]).objectStore("trackers");
        objectStore.openCursor().onsuccess = (e) => {
            let cursor = e.target.result;
            if (cursor) {
                let id = cursor.key;
                let title = cursor.value.title;
                let time = cursor.value.time;
                addCard(id, title, time, db);
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
            let name = document.getElementById("title").value;
            if (name.trim().length === 0) {
                alert("Please enter title for your tracker.");
            }
            else {
                //console.debug("new name", name);
                let tracker = {
                    title: name,
                    time: 0
                }
                let addReq = db.transaction(["trackers"], "readwrite").objectStore("trackers").add(tracker);
                addReq.onsuccess = (e) => {
                    let id = e.target.result;
                    addCard(id, tracker.title, tracker.time, db);
                    document.getElementById("title").value = "";
                }
            }
        }

        let addButton = document.getElementById("add-button");
        addButton.onclick = addNewTracker;
        addButton.disabled = false;

        document.getElementById("title").onkeydown = (e) => {
            if (e.key == "Enter") {
                addNewTracker();
            }
        }
    }

    /*
    Params: id of the tracker to remove, db object
    Parameters are passed to the delete request in order to remove record from the database
    In case of success appropriate card is removed from the view
    */
    function removeTracker(id, db) {
        let delReq = db.transaction(["trackers"], "readwrite").objectStore("trackers").delete(parseInt(id));
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
    function updateTime(db, id, newTime) {
        let objectStoreReq = db.transaction(['trackers'], "readwrite").objectStore('trackers').get(parseInt(id));

        objectStoreReq.onsuccess = (e) => {
            let data = e.target.result;
            data.time = parseInt(newTime);
            let updateReq = db.transaction(["trackers"], "readwrite").objectStore("trackers").put(data);
            updateReq.onsuccess = (e) => {
                console.debug("Update successful.")
            };
        }
    }


    function addCard(id, title, c_time, db) {

        let card = document.getElementById("counter_tmpl").content.firstElementChild.cloneNode(true);
        //console.debug("Calculated card ID ", ("db_id" + id));
        card.id = "db_id" + id;
        //console.debug("Creating card ID ", card.id);

        let counter = 0;
        let subtotal_time = c_time;
        
        card.querySelector("div > div").innerText= title;

        let card_common_time = card.querySelector(".common-time");
        card_common_time.innerText = secToStr(subtotal_time);

        let card_subtotal_time = card.querySelector(".subtotal-time");
        card_subtotal_time.innerText = secToStr(subtotal_time);

        let card_current_time = card.querySelector(".current-time");
        card_current_time.innerText = "00:00:00";

        let cb_start_pause = card.querySelector(".start-pause-button");
        let cb_remove = card.querySelector(".remove-button");
        let cb_reset = card.querySelector(".reset-button");

        let timer_running = false;
        let intervalId = null;

        let hide_time = 0;
        let hide_counter_state = 0;
        let hide_subtotal_time_state = 0;
        
        let on_visibility_change = () => {
            if (document.hidden) {
                hide_time = Date.now();
                hide_counter_state = counter;
                hide_subtotal_time_state = subtotal_time;
            }
            else if (timer_running) {
                let elapsed_sec = Math.trunc((Date.now() - hide_time) / 1000);
                counter += elapsed_sec;
                subtotal_time += elapsed_sec;
            }
        }

        document.addEventListener("visibilitychange", on_visibility_change);

        cb_start_pause.onclick = () => {
            if (timer_running === false) {
                timer_running = true;
                cb_start_pause.classList.toggle("start-button", false);
                cb_start_pause.classList.toggle("pause-button", true);
                cb_start_pause.title = "Pause";

                counter = 0;
                intervalId = setInterval(() => {
                    counter++;
                    subtotal_time++;
                    card_current_time.innerText = secToStr(counter);
                    card_subtotal_time.innerText = secToStr(subtotal_time);
                }, 1000);
            }
            else {
                timer_running = false;
                cb_start_pause.classList.toggle("pause-button", false);
                cb_start_pause.classList.toggle("start-button", true);
                cb_start_pause.title = "Start";
                clearInterval(intervalId);
                counter = 0;
                
                updateTime(db, id, subtotal_time);
                card_common_time.innerText = secToStr(subtotal_time);
                card_subtotal_time.innerText = secToStr(subtotal_time);
                card_current_time.innerText = "00:00:00";
            } 
        }

        cb_reset.onclick = () => {
            timer_running = false;
            cb_start_pause.classList.toggle("pause-button", false);
            cb_start_pause.classList.toggle("start-button", true);
            cb_start_pause.title = "Start";
            clearInterval(intervalId);
            counter = 0;
            subtotal_time = 0;
            updateTime(db, id, 0);
            card_common_time.innerText = "00:00:00";
            card_subtotal_time.innerText = "00:00:00";
            card_current_time.innerText = "00:00:00";
        }

        cb_remove.onclick = () => {
            document.removeEventListener("visibilitychange", on_visibility_change);
            clearInterval(intervalId);
            removeTracker(id, db);
        }

        CARD_AREA.appendChild(card);
    }

}

main();
