const {ipcRenderer} = require('electron')
const {produceHtml, produceHeader, giveDuration} = require('./dashboard-design')

const polarBtn = document.getElementById("polar-button")

var test = 1

polarBtn.addEventListener('click',(event)=>{
    ipcRenderer.send('polar-activate')
})

// TODO: Create a good comparator that can apply to numbers, dates, durations and alphabet

function sortTable(n) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("achieve-table");
    switching = true;
    // Set the sorting direction to ascending:
    dir = "asc";
    /* Make a loop that will continue until
    no switching has been done: */
    while (switching) {
        // Start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        /* Loop through all table rows (except the
        first, which contains table headers): */
        for (i = 1; i < (rows.length - 1); i++) {
            // Start by saying there should be no switching:
            shouldSwitch = false;
            /* Get the two elements you want to compare,
            one from current row and one from the next: */
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            /* Check if the two rows should switch place,
            based on the direction, asc or desc: */
            if (dir == "asc") {
                if (Number(x.innerHTML) > Number(y.innerHTML)) {
                    // If so, mark as a switch and break the loop:
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == "desc") {
                if (Number(x.innerHTML) < Number(y.innerHTML)) {
                    // If so, mark as a switch and break the loop:
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
        /* If a switch has been marked, make the switch
        and mark that a switch has been done: */
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
        // Each time a switch is done, increase this count by 1:
        switchcount ++;
        } else {
            /* If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again. */
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}

ipcRenderer.on('track-list-retrieved',(event,tracks)=>{
    var sports = {}
    var today = new Date()
    var totalDistance = 0
    var totalDuration = 0

    for (track of tracks){
        totalDistance += track.totalDistance
        totalDuration += track.duration
        if (!sports.hasOwnProperty(track.sport)){
            sports[track.sport] = {
                totalDistance : 0,
                lastYearDistance : 0,
                numberOfSessions : 0,
                lastYearNumberOfSessions : 0,
                time:0,
                lastYearTime : 0,
                longestTime: 0,
                longestDistance: 0,
            }
        }
        var date = new Date(track.date)

        if (new Date(today - date).getFullYear() == 1970){
            sports[track.sport].lastYearDistance += track.totalDistance
            sports[track.sport].lastYearNumberOfSessions += 1
            sports[track.sport].lastYearTime += track.duration
        }
        sports[track.sport].totalDistance += track.totalDistance
        sports[track.sport].numberOfSessions += 1
        sports[track.sport].time += track.duration
        sports[track.sport].longestTime = Math.max(track.duration,sports[track.sport].longestTime)
        sports[track.sport].longestDistance = Math.max(track.totalDistance,sports[track.sport].longestDistance)

    }

    var content = produceHeader()
    for (const [sport, data] of Object.entries(sports)){
        content = content + produceHtml(sport,data)
    }

    document.getElementById("achieve-table").innerHTML = content
    document.getElementById("total").innerHTML = giveDuration(totalDuration) + " and " +totalDistance.toFixed(0) + " km "

    Array.prototype.forEach.call(document.querySelectorAll(".dashboard-header"),(header)=>{
        header.addEventListener('click',(event)=>{
            var columnId = header.dataset.id
            console.log(columnId)
            sortTable(columnId)
        })
    })

})
