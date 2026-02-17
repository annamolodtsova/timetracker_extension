"use strict";


const theme_button_title = {
    light: "Switch to auto",
    dark: "Switch to light",
    auto: "Switch to dark",
};

function toggleTheme(e) {
    const current_theme = document.documentElement.getAttribute("tracker-theme");
    let new_theme = "";
    if (current_theme === "auto") {
        new_theme = "dark";
    }
    else if (current_theme === "dark") {
        new_theme = "light";
    }
    else {
        new_theme = "auto";
    }
    //setting button title
    e.target.title=theme_button_title[new_theme];
    // saving settings
    localStorage.setItem("theme", new_theme);
    // changing theme
    document.documentElement.setAttribute("tracker-theme", new_theme);
}

function main() {

    // setting default GUI theme
    let app_theme = localStorage.getItem("theme");
    if (app_theme === null) app_theme = "auto";
    document.documentElement.setAttribute("tracker-theme", app_theme);

    let CARD_AREA = document.getElementById("card-list"); //element that consists of task card, buttons and time elements on it
    //console.debug(CARD_AREA);

    const dbName = "tt_db";

    //request to open database
    let openRequest = indexedDB.open(dbName, 3);

    openRequest.onerror = (e) => {
        alert("To make this web app work you should allow it to use IndexedDB.");
    };

    /**
     * request to update database version if needed
     * @param {Event & { target: IDBOpenDBRequest }} e
     */
    openRequest.onupgradeneeded = (e) => {
        let db = e.target.result;
        let objectStore = db.createObjectStore("trackers", {
            keyPath: "id",
            autoIncrement: true
        });
    };

    /**
     * in case of success db opening function getRecords() gets db records and shows them as cards
     * in case if button to add new tracker is clicked initAddButton() adds new db record and shows it as a card
     * @param {Event & { target: IDBOpenDBRequest }} e
     */
    openRequest.onsuccess = (e) => {
        let db = e.target.result;

        db.onerror = (/** @type {Event & { target: IDBDatabase }} */ e) => {
            alert("Smth went wrong");
        }

        getRecords(db);
        initAddButton(db);
        initMenuSection(db);

        // save jobs status in case of page close or unload.
        window.addEventListener("beforeunload", (e) => {
            document.querySelectorAll(".start-pause-button[data-timer-running=true]")
                .forEach(element => element.onclick());
        });
    }

    /**
     * @param {IDBDatabase} db
     */
    function initMenuSection(db) {
        let menu_button = document.getElementById("menu-button");
        let menu_section = document.getElementById("menu-section");
        let export_button = document.getElementById("export-button");
        let import_button = document.getElementById("import-button");
        let theme_button = document.getElementById("theme-button");
        let file_input = document.getElementById("file_input");

        menu_button.onclick = () => {
            if (menu_section.classList.toggle("show")) {
                console.log("Toggle show!");
            }
            else {
                console.log("Toggle Hide!");
            }
        }
        menu_button.disabled = false;

        export_button.onclick = () => {
            export_db(db);
        }

        export_button.disabled = false;

        /**
         * @param {Event & { target: HTMLInputElement }} e
         */
        file_input.onchange = (e) => {
            if (e.target.files.length > 0) {
                let file = e.target.files[0];
                // Reset the input value to allow same file selection
                e.target.value = null;

                let reader = new FileReader();
                reader.onload = (/** @type {ProgressEvent<FileReader>} */ e) => {
                    import_db(db, e.target.result);
                };
                reader.onerror = (/** @type {ProgressEvent<FileReader>} */ e) => {
                    console.error("Error reading file: ", e);
                    alert("Error reading file!");
                };

                let confirm_result = confirm("This will replace records if they present in import file. Do you wish to continue?");
                if (confirm_result === true) {
                    //console.debug('Selected file:', file.name);
                    reader.readAsText(file);
                }
            }
        }

        import_button.onclick = () => {
            file_input.click();
        }
        import_button.disabled = false;

        // set theme toggle event
        theme_button.onclick = toggleTheme;
        theme_button.title = theme_button_title[app_theme];
        theme_button.disabled = false;

    }

    /**
     * @param {number} seconds
     * @returns {string} time string in format "hh:mm:ss"
     */
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

    /**
     * Function gets existing records from the db using openCursor() method
     * Function gets id, title, time from each record and pass them to showCard() function
     * @param {IDBDatabase} db
     */
    function getRecords(db) {
        let objectStore = db.transaction(["trackers"]).objectStore("trackers");
        objectStore.openCursor().onsuccess = (/** @type {Event & { target: IDBRequest }} */ e) => {
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

    /**
     * @param {IDBDatabase} db
     */
    function export_db(db) {

        let data_obj = {
            date_time: (new Date()).toISOString(),
            trackers: [],
        };

        let objectStore = db.transaction(["trackers"]).objectStore("trackers");
        objectStore.openCursor().onsuccess = (/** @type {Event & { target: IDBRequest }} */ e) => {
            let cursor = e.target.result;
            if (cursor) {
                data_obj.trackers.push(cursor.value);
                cursor.continue();
            }
            else if (data_obj.trackers.length > 0) {
                let json_string = JSON.stringify(data_obj, null, 4);
                let blob = new Blob([json_string], { type: 'application/json' });
                let blob_url = URL.createObjectURL(blob);
                let a = document.createElement("a");
                a.href = blob_url;
                a.download = `timetracker_export_${new Date().toISOString()}.json`;
                a.click();
                URL.revokeObjectURL(blob_url);
            }
            else {
                alert("No data to export.");
            }
        }
    }

    /**
     * @param {IDBDatabase} db
     * @param {string} import_data imported file content as string
     */
    function import_db(db, import_data) {
        let json_data = null;
        try {
            json_data = JSON.parse(import_data);
        } catch (err) {
            console.error('Invalid JSON:', err);
            alert("Error reading file! (Invalid JSON)");
        }

        let trackers_store = db.transaction(["trackers"], "readwrite").objectStore("trackers");
        if (json_data && Array.isArray(json_data.trackers)) {
            json_data.trackers.forEach((card_data) => {
                const update_req = trackers_store.put(card_data);
                update_req.onerror = (/** @type {Event & { target: IDBRequest }} */ e) => {
                    console.error("Error importing record from json to DB: ", e);
                };
            });
            // refreshing window content
            window.location.reload();
        } else {
            alert("Error reading file! (Invalid data structure)");
        }
    }


    /**
     * Function initializes addNewTracker() function by clicking the add button (id="add-button")
     * Function addNewTracker() gets text from the title input,
     * puts it to the tracker object and passes tracker object to the add request
     * In case of add request success showCard() function is initialized and displayed
     * new tracker card with given title
     * @param {IDBDatabase} db
     */
    function initAddButton(db) {
        function addNewTracker() {
            /** @type {string} */
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

        document.getElementById("title").onkeydown = (/** @type {KeyboardEvent} */ e) => {
            if (e.key == "Enter") {
                addNewTracker();
            }
        }
    }

    /**
     * Parameters are passed to the delete request in order to remove record from the database
     * In case of success appropriate card is removed from the view
     * @param {number} id id of the tracker to remove
     * @param {IDBDatabase} db
     */
    function removeTracker(id, db) {
        let delReq = db.transaction(["trackers"], "readwrite").objectStore("trackers").delete(parseInt(id));
        delReq.onsuccess = (e) => {
            document.getElementById("db_id" + id).remove();
        }
    }

    /**
     * Params: id of the tracker to update, time value, db object, element where the time updating will be applied
     * Function gets tracker record by id. If case of success time field of the tracker object is updated by adding new time value
     * New object is passed to the method put in order to update the record
     * In case of success new time is shown next the commonTimeElement element on the tracker card
     * @param {IDBDatabase} db
     * @param {number} id id of the tracker to update
     * @param {number} newTime new time value to update in seconds
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

        card.querySelector("div > div").innerText = title;

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
        cb_start_pause.setAttribute("data-timer-running", false);

        let intervalId = null;

        let hide_time = 0;

        let on_visibility_change = () => {
            if (document.hidden) {
                hide_time = Date.now();
            }
            else if (timer_running) {
                let elapsed_sec = Math.trunc((Date.now() - hide_time) / 1000);
                counter += elapsed_sec;
                subtotal_time += elapsed_sec;
            }
        }

        document.addEventListener("visibilitychange", on_visibility_change);

        cb_start_pause.onclick = () => {
            // console.debug("Start-Stop clicked");
            if (timer_running === false) {
                timer_running = true;

                cb_start_pause.setAttribute("data-timer-running", true);
                cb_start_pause.classList.toggle("start-button", false);
                cb_start_pause.classList.toggle("pause-button", true);
                cb_start_pause.title = "Pause";

                counter = 0;
                intervalId = setInterval(() => {
                    counter++;
                    subtotal_time++;

                    // Every 60 seconds save time to DB
                    if (counter % 60 === 0) updateTime(db, id, subtotal_time);

                    card_current_time.innerText = secToStr(counter);
                    card_subtotal_time.innerText = secToStr(subtotal_time);
                }, 1000);
            }
            else {
                // console.debug("Start-Stop clicked - stop");
                timer_running = false;

                cb_start_pause.setAttribute("data-timer-running", false);
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
