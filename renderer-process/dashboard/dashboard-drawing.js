const d3 = require('d3')

var maxY = function(bins){
    return bins.reduce((max, p) => p.length > max ? p.length : max, bins[0].length);
}

var minX = function(tracks){
    return tracks.reduce((min, p) => new Date(p.date) < min ? new Date(p.date) : min, new Date(tracks[0].date));
}

exports.drawGraph = function(tracks){

    d3.select("svg").remove()

    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 50, bottom: 30, left: 50},
    width = 1800 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

    // set the ranges
    var x = d3.scaleTime()
        .domain([minX(tracks), new Date()])
        .rangeRound([0, width]);

    // set the parameters for the histogram
    var histogram = d3.histogram()
        .value(function(d) { return new Date(d.date); })
        .domain(x.domain())
        .thresholds(x.ticks(d3.timeMonth));

    // group the data for the bars
    var bins = histogram(tracks);

    var y = d3.scaleLinear()
        .domain([0,maxY(bins)])
        .range([height, 0]);

    var svg = d3.select("#activity-graph").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // append the bar rectangles to the svg element
    svg.selectAll("rect")
        .data(bins)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 1)
        .attr("transform", function(d) {
            return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
        .attr("height", function(d) { return height - y(d.length); });

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

}
