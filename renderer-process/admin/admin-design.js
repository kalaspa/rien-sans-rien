exports.produceHtml = function(track){

    var date = new Date(track.date)
    var duration = new Date()
    duration.setTime(track.duration*1000)
    var pad2 = function(number){return (number < 10 ? '0' : '') + number}

    return `
    <tr>
        <td>
            <input type='checkbox' class="admin-line" data-id=${track.id} />
        </td>
        <td>
            ${track.location}
        </td>
        <td>
            ${track.sport}
        </td>
        <td>
            ${pad2(date.getDate())}/${pad2(1+date.getMonth())}/${date.getFullYear()}
        </td>
        <td>
            ${pad2(duration.getUTCHours())}:${pad2(duration.getMinutes())}:${pad2(duration.getSeconds())}
        </td>
        <td>
            <button type="button" class="settings-btn" data-id=${track.id}><img height='35px' src="icons/options.svg"/></button>
        </td>
    </tr>
    `

}

exports.produceHeader = function(){
    return `
                        <tr>
                            <th> </th>
                            <th> Locality </th>
                            <th> Sport </th>
                            <th> Date </th>
                            <th> Duration </th>
                            <th> Action </th>
                        </tr>`
}
