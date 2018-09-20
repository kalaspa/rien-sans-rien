var giveDuration = function(time){
    var duration = new Date()
    duration.setTime(time*1000)
    var pad2 = function(number){return (number < 10 ? '0' : '') + number}

    var goodTime = duration.getMonth() > 0 ? pad2(duration.getMonth()) + " m " : ''
    goodTime += duration.getDate() > 1 ? pad2(duration.getDate()-1) + " d " : ''
    goodTime += pad2(duration.getUTCHours())
    goodTime += ":" + pad2(duration.getMinutes())
    goodTime += ":" + pad2(duration.getSeconds())

    return goodTime
}

exports.giveDuration = giveDuration

exports.produceHtml = function(sport,data){

    return `
        <tr>
            <td>
                ${sport}
            </td>
            <td>
                ${data.lastYearNumberOfSessions}
            </td>
            <td>
                ${data.numberOfSessions}
            </td>
            <td>
                ${giveDuration(data.longestTime)}
            </td>
            <td>
                ${giveDuration(data.lastYearTime)}
            </td>
            <td>
                ${giveDuration(data.time)}
            </td>
            <td>
                ${data.longestDistance}
            </td>
            <td>
                ${(data.lastYearDistance).toFixed(0)}
            </td>
            <td>
                ${(data.totalDistance).toFixed(0)}
            </td>
        </tr>
        `

}

exports.produceHeader = function(){
    return `<tr>
        <th class='dashboard-header' data-id='0'> Sport </th>
        <th class='dashboard-header' data-id='1'> Last year number of sessions </th>
        <th class='dashboard-header' data-id='2'> All time number of sessions </th>
        <th class='dashboard-header' data-id='3'> Longest session (time) </th>
        <th class='dashboard-header' data-id='4'> Last year time spent </th>
        <th class='dashboard-header' data-id='5'> All time time spent </th>
        <th class='dashboard-header' data-id='6'> Longest session (distance) </th>
        <th class='dashboard-header' data-id='7'> Last year distance (km) </th>
        <th class='dashboard-header' data-id='8'> All time distance (km) </th>
    </tr>`
}
