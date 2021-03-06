/**
* @author Aidan Andrews
* @email aa275@uowmail.edu.au
* @ngdoc controller
* @name visualisations.controller:bubbleChartCtrl
* @description Generates and displays a bubble chart visualisation.
*/

(function () {

	'use strict'

	angular
	.module('visualisations')
	.controller('bubbleChartCtrl', bubbleChartCtrl);

	/* @ngInject */
	function bubbleChartCtrl ($routeParams, analysisService, bsLoadingOverlayService) {
		var vm = this;

		// Scrolls to the top of the page
		document.body.scrollTop = 0; // For Chrome, Safari and Opera 
	    document.documentElement.scrollTop = 0; // For IE and Firefox

	    var bcSlideout = new Slideout({
	    	'panel': document.querySelector('#bcPanel'),
	    	'menu': document.querySelector('#bcMenu'),
	    	'padding': 256,
	    	'tolerance': 70
	    });

	    vm.toggleOptions = toggleOptions;
	    vm.updateFontScale = updateFontScale;
	    vm.setCicleColour = setCicleColour;
	    vm.updateToLinearScale = updateToLinearScale;
	    vm.updateToPowScale = updateToPowScale;

	    vm.textColour = '#000000';
	    vm.bubbleColour1 = '#e4e4d9';
	    vm.bubbleColour2 = '#4676fa';
	    vm.bgColour = '#ffffff';
	    vm.fontScale = {
	    	value: 14
	    };
	    vm.powScale = {
	    	value: 2
	    };
	    vm.selectedScale = 'linear';

	    vm.textColourChange;

	    var analysisType = $routeParams.type;
	    var id = $routeParams.id;

	    var dataNodes = [];
	    var responseData = [];

	    var width = document.querySelector("#graph").clientWidth;
	    var height = document.querySelector("#graph").clientHeight;
	    var maxRelevance = 0;
	    var minRelevance = 100;

	    function toggleOptions() {
	    	bcSlideout.toggle();
	    }

	    var svg = d3.select("#graph")
	    .append("svg")
	    .attr("width", width)
	    .attr("height", height)
	    .attr("class", "graph-svg-component")
	    .call(d3.zoom().on("zoom", function () {
	    	svg.attr("transform", d3.event.transform)
	    }))
	    .append("g");

	    vm.circleColourOptions = [
	    { name: "Misty Meadow", minCol: "#e4e4d9", maxCol: "#215f00" }, 
	    { name: "Kyoto", minCol: "#c21500", maxCol: "#ffc500" }, 
	    { name: "Pinot Noir", minCol: "#182848", maxCol: "#4b6cb7" }, 
	    { name: "Miake", minCol: "#0ABFBC", maxCol: "#FC354C" }, 
	    { name: "Calm Darya", minCol: "#5f2c82", maxCol: "#49a09d" },
	    { name: "Electric Violet", minCol: "#8E54E9", maxCol: "#4776E6" },
	    { name: "Sunrise", minCol: "#F09819", maxCol: "#FF512F" }
	    ];

	    vm.selectedCicleColour = vm.circleColourOptions[0];

	    activate();

		///////////////////////////

		function activate() {
			bsLoadingOverlayService.start({referenceId: 'bubble-chart'});	// Start animated loading overlay
			analysisService.readWatsonAnalysis(id)
			.then(function(data) {
				if(analysisType === 'concepts') {
					data.concepts.forEach(function(concept){
						var text = concept.text.charAt(0).toUpperCase() + concept.text.slice(1);	// Capitalise first letter
						maxRelevance = (concept.relevance > maxRelevance ? concept.relevance : maxRelevance);
						minRelevance = (concept.relevance < minRelevance ? concept.relevance : minRelevance);
						dataNodes.push({text: text, radius: concept.relevance*100, relevance: concept.relevance, dbpedia_resource: concept.dbpedia_resource});
					});
				} else if(analysisType === 'keywords') {
					data.keywords.forEach(function(keyword){
						var text = keyword.text.charAt(0).toUpperCase() + keyword.text.slice(1);	// Capitalise first letter
						maxRelevance = (keyword.relevance > maxRelevance ? keyword.relevance : maxRelevance);
						minRelevance = (keyword.relevance < minRelevance ? keyword.relevance : minRelevance);
						dataNodes.push({text: text, radius: keyword.relevance*100, relevance: keyword.relevance});
					});
				} else if(analysisType === 'entities') {
					data.entities.forEach(function(entity){
						var text = entity.text.charAt(0).toUpperCase() + entity.text.slice(1);	// Capitalise first letter
						maxRelevance = (entity.relevance > maxRelevance ? entity.relevance : maxRelevance);
						minRelevance = (entity.relevance < minRelevance ? entity.relevance : minRelevance);
						dataNodes.push({text: text, radius: entity.relevance*100, count: entity.count, type: entity.type, relevance: entity.relevance});
					});
				}

				responseData = {nodes: dataNodes};
				drawChart(responseData);
			}, function(err) {
				bsLoadingOverlayService.stop({referenceId: 'bubble-chart'});	// If error, stop animated loading overlay
			}); 
		}

		var node;
		var simulation;
		var forceCollide;
		var legendSvg;

		function drawChart(data) {

			forceCollide = d3.forceCollide( function(d){ return d.radius + 1; }).iterations(16);

			simulation = d3.forceSimulation()
			.force("link", d3.forceLink().id(function(d) { return d.index }))
			.force("collide", forceCollide)
			.force("charge", d3.forceManyBody().strength(1))
			.force("center", d3.forceCenter(width / 2, height / 2))
			.force("y", d3.forceY(0))
			.force("x", d3.forceX(0));

			var div = d3.select("#bcPanel").append("div")	
			.attr("class", "tooltip")				
			.style("opacity", 0)
			.style("background", "#fff")
			.style("padding", "10px")
			.style("border-radius", "10px")
			.style("font-weight", 600);

			node = svg.append("g")
			.attr("class", "nodes")
			.selectAll("circle")
			.data(data.nodes)
			.enter()
			.append("circle")
			.attr("r", function(d){ return d.radius; })
			.style("cursor", "pointer")
			.on("mouseover", function(d) {		
				div.transition()		
				.duration(200)		
				.style("opacity", .9);
				if(analysisType === 'concepts') {
					div.html("Concept: " + d.text + "<br/>Relevance: " + d3.format(".2%")(d.relevance) + "<br/>DBpedia Resource: <a href='" + d.dbpedia_resource + "' target='_blank'>" + d.dbpedia_resource + "</a>")	
					.style("left", width/2 + "px")		
					.style("transform", "translate(-50%, 0)")		
					.style("top", 10 + "px")
					.style("background", "#fafafa")
					.style("border", "1px solid #000");
				} else if (analysisType === 'keywords') {
					div.html("Keyword: " + d.text + "<br/>Relevance: " + d3.format(".2%")(d.relevance))
					.style("left", width/2 + "px")		
					.style("transform", "translate(-50%, 0)")		
					.style("top", 10 + "px")
					.style("background", "#fafafa")
					.style("border", "1px solid #000");
				} else if (analysisType === 'entities') {
					div.html("Entity: " + d.text + "<br/>Count: " + d.count + "<br/>Type: " + d.type + "<br/>Relevance: " + d3.format(".2%")(d.relevance))
					.style("left", width/2 + "px")		
					.style("transform", "translate(-50%, 0)")		
					.style("top", 10 + "px")
					.style("background", "#fafafa")
					.style("border", "1px solid #000");
				}
				
			})					
			.on("mouseout", function(d) {		
				div.transition()		
				.duration(500)		
				.delay(3000)
				.style("opacity", 0);	
			})
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended));   

			var textLabel = svg.selectAll(".mytext")
			.data(data.nodes)
			.enter()
			.append("text")
			.text(function (d) { return d.text; })
			.attr("text-anchor", "middle")
			.attr("fill", "#000")
			.attr("font-family", "Arial")
			.attr("font-size", (function (d) { return d.radius*vm.fontScale.value/50; }))
			.attr("pointer-events", "none");

			var linear = d3.scaleLinear()
			.domain([minRelevance*100, maxRelevance*100])
			.range([vm.bubbleColour1, vm.bubbleColour2]);

			var translateLegend = "translate(" + (width/2 - 160) + "," + (height - 200) + ")";

			legendSvg = d3.select("#svg-legend")
			.attr("width", 320)
			.attr("height", 100)
			.attr("transform", translateLegend);

			legendSvg.append("g")
			.attr("class", "svg-legend-class")
			.attr("width", 320)
			.attr("height", 100)
			.attr("transform", "translate(0,25)");

			var legendLinear = d3.legendColor()
			.shapeWidth(30)
			.cells(10)
			.orient('horizontal')
			.scale(linear)
			.title("Relevance (%)");

			legendSvg.select(".svg-legend-class")
			.call(legendLinear);

			var ticked = function() {
				node
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });
				textLabel
				.attr("x", function(d){ return d.x; })
				.attr("y", function (d) {return d.y; });
			}

			simulation
			.nodes(data.nodes)
			.on("tick", ticked);

			function dragstarted(d) {
				if (!d3.event.active) simulation.alphaTarget(0.3).restart();
				d.fx = d.x;
				d.fy = d.y;
			}

			function dragged(d) {
				d.fx = d3.event.x;
				d.fy = d3.event.y;
			}

			function dragended(d) {
				if (!d3.event.active) simulation.alphaTarget(0);
				d.fx = null;
				d.fy = null;
			} 

			setCicleColour();
			bsLoadingOverlayService.stop({referenceId: 'bubble-chart'});	// Stop animated loading overlay
		}

		function setCicleColour() {
			var colours = d3.scaleLinear()
			.domain([minRelevance, maxRelevance])
			.range([vm.bubbleColour1, vm.bubbleColour2]);

			svg.selectAll("circle").style("fill", function(d) { return colours(d.relevance) });

			var linear = d3.scaleLinear()
			.domain([minRelevance*100, maxRelevance*100])
			.range([vm.bubbleColour1, vm.bubbleColour2]);

			var legendLinear = d3.legendColor()
			.shapeWidth(30)
			.cells(10)
			.orient('horizontal')
			.scale(linear)
			.title("Relevance (%)");

			legendSvg.select(".svg-legend-class")
			.call(legendLinear);
		}

		vm.bgColourOptions = { format:'hexString', case:'lower' };
		vm.textColourOptions = { format:'hexString', case:'lower' };
		vm.bubbleColourOptions1 = { format:'hexString', case:'lower' };
		vm.bubbleColourOptions2 = { format:'hexString', case:'lower' };

		vm.bgColourChange = { onChange: function(api, color) { document.querySelector(".graph-svg-component").style.background = color; } };
		vm.textColourChange = {	onChange: function(api, color, $event) { svg.selectAll("text").style("fill", color); } };
		vm.bubbleColourChange1 = { onChange: function() { setCicleColour(); } };
		vm.bubbleColourChange2 = { onChange: function() { setCicleColour(); } };

		function updateFontScale() { 
			svg.selectAll("text").style("font-size", function(d) { 
				return d.radius*vm.fontScale.value/50; 
			})
		}

		function updateToLinearScale() { 
			if(vm.selectedScale === 'linear') {
				var linearScale = d3.scaleLinear()
				.domain([0, 1])
				.range([0, 100]);

				var colours = d3.scaleLinear()
				.domain([minRelevance, maxRelevance])
				.range([vm.bubbleColour1, vm.bubbleColour2]);

				svg.selectAll("circle").style("fill", function(d) { return colours(d.relevance); });

				node
				.each(function(d) {
					d.radius = linearScale(d.relevance);
				})
				.transition()
				.duration(500)
				.attr("r", function(d) { return d.radius; });
				forceCollide.radius(function(d) { return d.radius; });

				updateFontScale()

				var linear = d3.scaleLinear()
				.domain([minRelevance*100, maxRelevance*100])
				.range([vm.bubbleColour1, vm.bubbleColour2]);

				var legendLinear = d3.legendColor()
				.shapeWidth(30)
				.cells(10)
				.orient('horizontal')
				.scale(linear)
				.title("Relevance (%)");

				legendSvg.select(".svg-legend-class")
				.call(legendLinear);

				simulation.alphaTarget(0.3).restart();
			}
		}

		function updateToPowScale() { 
			vm.selectedScale = 'power';
			if(vm.powScale.value) {
				var powerScale = d3.scalePow().exponent(vm.powScale.value)
				.domain([0, 1])
				.range([0, 100]);

				var colours = d3.scalePow().exponent(vm.powScale.value)
				.domain([minRelevance, maxRelevance])
				.range([vm.bubbleColour1, vm.bubbleColour2]);

				svg.selectAll("circle").style("fill", function(d) { return colours(d.relevance); });

				node
				.each(function(d) {
					d.radius = powerScale(d.relevance);
				})
				.transition()
				.duration(500)
				.attr("r", function(d) { return d.radius; });

				forceCollide.radius(function(d) { return d.radius; });

				updateFontScale()

				var legPower = d3.scalePow().exponent(vm.powScale.value)
				.domain([minRelevance*100, maxRelevance*100])
				.range([vm.bubbleColour1, vm.bubbleColour2]);

				var legendPower = d3.legendColor()
				.shapeWidth(30)
				.cells(10)
				.orient('horizontal')
				.scale(legPower)
				.title("Relevance (%)");

				legendSvg.select(".svg-legend-class")
				.call(legendPower);

				simulation.alphaTarget(0.3).restart();
			}
		}

	}

})();
