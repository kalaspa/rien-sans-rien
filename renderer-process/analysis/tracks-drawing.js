const d3 = require('d3')
const {screen} = require('electron').remote

function getMin(data,key) {
    return data.reduce((min, p) => p[key] < min ? p[key] : min, data[0][key]);
}
function getMax(data,key) {
    return data.reduce((max, p) => p[key] > max ? p[key] : max, data[0][key]);
}

let started = {}
let svg

var margin = {top: 40, right: 40, bottom: 40, left: 40},
    width = screen.getPrimaryDisplay().size.width / 2 - margin.left - margin.right,
    height = screen.getPrimaryDisplay().size.height / 1.5 - margin.top - margin.bottom;

exports.parseTime = function(trackPoints){

    var pad2 = function(number){return (number < 10 ? '0' : '') + number}
    var parseTime = d3.timeParse("%H:%M:%S")

    duration = new Date()
    for (trackPoint of trackPoints){
        duration.setTime(trackPoint.time*1000)
        aux = pad2(duration.getUTCHours())+':'+pad2(duration.getMinutes())+':'+pad2(duration.getSeconds())
        trackPoint.time = parseTime(aux)
    }
}

var init = function(trackPoints,key){

    var x = d3.scaleTime()
        .range([0, width])
        .domain(d3.extent(trackPoints, function(d) { return d.time; }))

    var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0,getMax(trackPoints,key)]);

    var line = d3.line()
        .defined(function(d) { return d; })
        .x(function(d) { return x(d.time) })
        .y(function(d) { return y(d[key])})

    svg.datum(trackPoints)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
            .tickFormat(d3.timeFormat("%H:%M:%S")))

    svg.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y));

    svg.append("path")
        .attr("transform","translate(0, -1000)")
        .transition()
        .attr("transform","translate(0, 0)")
        .duration(1000)
        .attr("id","data-"+key)
        .attr("class", "line")
        .attr("d", line)

}

var update = function(trackPoints,key){

    var t = d3.transition()
      .duration(1000);

    var path = d3.selectAll("#data-"+key).data([trackPoints]);

    var x = d3.scaleTime()
        .range([0, width])
        .domain(d3.extent(trackPoints, function(d) { return d.time; }))

    var y = d3.scaleLinear()
        .range([height, 0])
        .domain([getMin(trackPoints,key),getMax(trackPoints,key)]);

    var line = d3.line()
        .defined(function(d) { return d; })
        .x(function(d) { return x(d.time) })
        .y(function(d) { return y(d[key])})

    d3.selectAll(".axis--x")
        .call(d3.axisBottom(x)
            .tickFormat(d3.timeFormat("%H:%M:%S")))

    path.transition(t)
        .attr('d', line)

    path.enter().append('path')
        .attr("id","data-"+key)
        .attr("class", "line").attr('d',line)

    path.exit().remove()
}

exports.take = function(trackPoints,key){
    if (Object.keys(started).length == 0){
        svg = d3.select("#graph").append("svg")

        svg.attr("transform","translate(0, -1000)")
            .transition()
            .attr("transform","translate(0, 0)")
            .duration(1000)
    }
    if (started.hasOwnProperty(key)){
        update(trackPoints,key)
    }
    else {
        init(trackPoints,key)
        started[key] = true
    }
}

exports.hide = function(key){
    var t = d3.transition()
      .duration(1000);

    var path = d3.selectAll("#data-"+key).data([]);

    path.exit()
        .transition()
        .attr("transform","translate(0, -1000)")
        .remove()

    delete started[key]
}

exports.clear = function(){
    svg = d3.select("svg")
        .transition()
        .attr("transform","translate(0, -1000)")
        .duration(1000)
        .remove()
    started = {}
}
