var margin = { top: 20, right: 20, bottom: 20, left: 20 };
width = 800 - margin.left - margin.right,
	height = 500 - margin.top - margin.bottom,
	centered = null;


var svg = d3.select("#map").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

tooltip = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);




queue()
	.defer(d3.json, '/data')
	.defer(d3.json, '/map')
	.await(ready);



function ready(error, data, us) {
	console.log(data)

	var counties = topojson.feature(us, us.objects.counties);

	var parser = d3.time.format("%m/%d/%Y").parse
	var dateToString = d3.time.format("%m/%d/%Y")

	rates = []
	dates = []

	svg.append("rect")
		.attr("class", "background")
		.attr("width", width)
		.attr("height", height)
		.on("click", zoomState);

	if (data[0]["date"]) {

		data.forEach(function (d) {
			d.date = parser(d.date);
			d.id = +d.id;
			d.value = +d.value;
			rates.push(+d.value)
			dates.push(d.date);
		});

		var dataByCountyByDate = d3.nest()
			.key(function (d) { return d.id; })
			.key(function (d) { return d.date; })
			.map(data);

		counties.features.forEach(function (county) {
			county.properties.days = dataByCountyByDate[+county.id]
		});

		console.log(counties.features)

		var valueRange = d3.extent(rates)

		var dateRange = d3.extent(dates)

		var color = d3.scale.quantize()
			.domain(valueRange)
			.range(["#ffe6e6", "#fcd2d2", "#ffa6a6", "#fc7474", "#fa4343", "#a10808", "#6e0909", "#3b0101"]);

		var projection = d3.geo.albersUsa()
			.scale(1070)
			.translate([width / 2, height / 2]);

		var path = d3.geo.path()
			.projection(projection);

		var countyShapes = svg.selectAll(".county")
			.data(counties.features)
			.enter()
			.append("path")
			.attr("class", "county")
			.attr("d", path);

		countyShapes
			.on("mouseover", function (d) {
				d3.select(this)
					// .transition()
					// .duration(1)
					.style("stroke", "black")
				tooltip.transition()
				tooltip.transition()
					.duration(100)
					.style("opacity", 1);
				tooltip.html(
					"<p><strong>" + d.properties.days[dateRange[0]][0].county + ", " + d.properties.days[dateRange[0]][0].state + "</strong></p>" +
					"<table><tbody><tr><td class='wide'>Cases on starting date:</td><td>" + d.properties.days[dateRange[0]][0].value + "</td></tr>" +
					"<tr><td>Cases on final date:</td><td>" + d.properties.days[dateRange[1]][0].value + "</td></tr>" + "</td></tr></tbody></table>"
				)
					.style("left", (d3.event.pageX + 15) + "px")
					.style("top", (d3.event.pageY - 28) + "px");
			})
			.on("mouseout", function (d) {
				d3.select(this)
					// .transition()
					// .duration(1)
					.style("stroke", "transparent")
				tooltip.transition()
					.duration(200)
					.style("opacity", 0);
			})
			.on("click", zoomState);


		var stateBorder = svg.append("path")
			.datum(topojson.feature(us, us.objects.states, function (a, b) { return a !== b; }))
			.attr("class", "states")
			.attr("d", path);



		var legend = svg.selectAll('g.legenditem')
			.data(color.range())
			.enter()
			.append('g').attr('class', 'legendEntry')
			.attr('transform', 'translate(' + (width - 25) + ',' + (height - 200) + ')')
			.text('Legend')
			;

		legend
			.append('rect')
			.attr("x", width - 780)
			.attr("y", function (d, i) {
				return i * 20;
			})
			.attr("width", 10)
			.attr("height", 10)
			.style("stroke", "black")
			.style("stroke-width", 1)
			.style("fill", function (d) { return d; });

		legend
			.append('text')
			.attr("x", width - 765)
			.attr("y", function (d, i) {
				return i * 20;
			})
			.attr("dy", "0.8em")
			.text(function (d, i) {
				var extent = color.invertExtent(d);
				var format = d3.format("0.0f");
				return format(+extent[0]) + " - " + format(+extent[1]);
			});

		function update(date) {
			d3.select(".currentday").text(dateToString(date));
			countyShapes.style("fill", function (d) {
				return color(d.properties.days && d.properties.days[date][0].value)
			});
		}



		var slider = d3.select(".slider")
			.append("input")
			.attr("id", "timeslide")
			.attr("type", "range")
			.attr("width", "100%")
			.attr("min", moment(dateRange[0]).unix())
			.attr("max", moment(dateRange[1]).unix())
			.attr("step", 60 * 60 * 24)
			.on("input", function () {
				var date = new Date(this.value * 1000);
				update(date);
			})
			.on("change", function () {
				var date = new Date(this.value * 1000);
				update(date);
			})


		// var button = d3.select(".button")
		// 	.append("input")
		// 	.attr("type", "button")
		// 	.attr("value", "Play")
		// 	.on("click", function () { document.getElementById("timeslide").stepUp(1) })

		// var button = d3.select("button")
		// .on("click", d3.select(".slider").stepUp());

		// function playSlider() {
		// d3.select(".slider")
		// d3.select("input")
		// if (d3.select("input").value < moment(dateRange[1]).unix()) {
		// d3.select("input").stepUp()
		// }
		// }


		function zoomState(d) {
			var x, y, k;

			if (d && centered !== d) {
				var centroid = path.centroid(d);
				x = centroid[0];
				y = centroid[1];
				k = 4;
				centered = d;
			} else {
				x = width / 2;
				y = height / 2;
				k = 1;
				centered = null;
			}

			countyShapes.selectAll("path")
				.classed("active", centered && function (d) { return d === centered; });

			countyShapes.transition()
				.duration(750)
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
			// .style("stroke-width", 1.5 / k + "px");


			// stateBorder.selectAll("path")
			// .classed("active", centered && function(d) { return d === centered; });

			stateBorder.transition()
				.duration(750)
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
			// .style("stroke-width", 1.5 / k + "px");


		}




		update(dateRange[0]);

	} else {
		data.forEach(function (d) {
			d.id = +d.id;
			d.value = +d.value;
			rates.push(+d.value);
		});

		var dataByCounty = d3.nest()
			.key(function (d) { return d.id; })
			.map(data);

		counties.features.forEach(function (county) {
			county.properties = dataByCounty[+county.id]
		});

		var valueRange = d3.extent(rates)

		var color = d3.scale.quantize()
			.domain(valueRange)
			.range(["#ffe6e6", "#fcd2d2", "#ffa6a6", "#fc7474", "#fa4343", "#a10808", "#6e0909", "#3b0101"]);


		var projection = d3.geo.albersUsa()
			.translate([width / 2, height / 2]);

		var path = d3.geo.path()
			.projection(projection);

		var countyShapes = svg.selectAll(".county")
			.data(counties.features)
			.enter()
			.append("path")
			.attr("class", "county")
			.attr("d", path)



		countyShapes
			.on("mouseover", function (d) {
				d3.select(this)
					// .transition()
					// .duration(100)
					.style("stroke", "black")
				tooltip.transition()
					.duration(100)
					.style("opacity", 1);
				tooltip.html(
					"<p><strong>" + d.properties[0].county + ", " + d.properties[0].state + "</strong></p>" +
					"<tr><td>Cases: </td><td>" + d.properties[0].value + "</td></tr>" + "</td></tr></tbody></table>"
				)
					.style("left", (d3.event.pageX + 15) + "px")
					.style("top", (d3.event.pageY - 28) + "px");
			})
			.on("mouseout", function (d) {
				d3.select(this)
					// .transition()
					// .duration(100)
					.style("stroke", "transparent")
				tooltip.transition()
					.duration(200)
					.style("opacity", 0);
			})
			.on("click", zoomState);

		svg.append("path")
			.datum(topojson.feature(us, us.objects.states, function (a, b) { return a !== b; }))
			.attr("class", "states")
			.attr("d", path)
			.style("stroke", "white");





		var legend = svg.selectAll('g.legenditem')
			.data(color.range())
			.enter()
			.append('g').attr('class', 'legendEntry')
			.attr('transform', 'translate(' + (width - 25) + ',' + (height - 200) + ')')
			.text('Legend')
			;

		legend
			.append('rect')
			.attr("x", width - 780)
			.attr("y", function (d, i) {
				return i * 20;
			})
			.attr("width", 10)
			.attr("height", 10)
			.style("stroke", "black")
			.style("stroke-width", 1)
			.style("fill", function (d) { return d; });


		legend
			.append('text')
			.attr("x", width - 765)
			.attr("y", function (d, i) {
				return i * 20;
			})
			.attr("dy", "0.8em")
			.text(function (d, i) {
				var extent = color.invertExtent(d);
				var format = d3.format("0.0f");
				return format(+extent[0]) + " - " + format(+extent[1]);
			});

		countyShapes.style("fill", function (d) {
			return color(d.properties && d.properties[0].value)
		});

		function zoomState(d) {
			var x, y, k;

			if (d && centered !== d) {
				var centroid = path.centroid(d);
				x = centroid[0];
				y = centroid[1];
				k = 4;
				centered = d;
			} else {
				x = width / 2;
				y = height / 2;
				k = 1;
				centered = null;
			}

			countyShapes.selectAll("path")
				.classed("active", centered && function (d) { return d === centered; });

			countyShapes.transition()
				.duration(750)
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
			// .style("stroke-width", 1.5 / k + "px");


			// stateBorder.selectAll("path")
			// .classed("active", centered && function(d) { return d === centered; });

			stateBorder.transition()
				.duration(750)
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
			// .style("stroke-width", 1.5 / k + "px");


		}



	}
}

d3.select(self.frameElement).style("height", "685px");