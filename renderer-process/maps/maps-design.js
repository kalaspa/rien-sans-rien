const {icons} = require('./../icons')

exports.produceHtml = function(track){

    var date = new Date(track.date)
    var duration = new Date()
    duration.setTime(track.duration*1000)
    var pad2 = function(number){return (number < 10 ? '0' : '') + number}


    return `
    <tr>
        <td>
            <label class="onoffswitch">
                <input type="checkbox" class="map-switch" data-id="${track.id}">
                <span><span data-on="yes" data-off="no"></span> </span>
            </label>
        </td>
        <td><img height='16' src=${icons[track.sport]}/></td>
        <td>${track.location}</td>
        <td>${pad2(date.getDate())}/${pad2(1+date.getMonth())}/${date.getFullYear()}</td>
    </tr>
    `

}
