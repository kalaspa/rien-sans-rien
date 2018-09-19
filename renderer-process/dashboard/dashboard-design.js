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

exports.produceHtml = function(sport,data){

    return `
        <tr>
            <td>
                ${sport}
            </td>
            <td>
                ${data.numberOfSessions}
            </td>
            <td>
                ${giveDuration(data.time)}
            </td>
            <td>
                ${(data.totalDistance).toFixed(0)}
            </td>
        </tr>
        `

}


exports.produceHeader = function(){
    return `
        <tr>
            <th> Sport </th>
            <th> Number of sessions </th>
            <th> Time spent </th>
            <th> Total distance (km) </th>
        </tr>
        `
}
