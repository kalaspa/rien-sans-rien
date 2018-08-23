exports.produceHtml = function(track){

    var date = new Date(track.date)
    var duration = new Date()
    duration.setTime(track.duration*1000)

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
            ${date.getDate()}/${1+date.getMonth()}/${date.getFullYear()}
        </td>
        <td>
            ${duration.getUTCHours()}:${duration.getMinutes()}:${duration.getSeconds()}
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
