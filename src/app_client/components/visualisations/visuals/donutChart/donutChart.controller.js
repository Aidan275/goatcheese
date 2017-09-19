/**
* @author Ben Rogers
* @email bjr342@uowmail.edu.au
* @ngdoc controller
* @name visualisations.controller:donutChartCtrl
* @description Controller for the donut chart visualisation
*/

(function () {

	angular
	.module('visualisations')
	.controller('donutChartCtrl', donutChartCtrl);

	/* @ngInject */
	function donutChartCtrl ($routeParams, analysisService, NgTableParams, bsLoadingOverlayService) {
		var vm = this;

		var analysisType = $routeParams.type; 
		var analysisId = $routeParams.id;
		var responseData = [];

		analysisData = [];
		var sortData = [];

		activate();

		///////////////////////////

		function activate() {
			bsLoadingOverlayService.start({referenceId: 'donut-chart'});	// Start animated loading overlay
			analysisService.readWatsonAnalysis(analysisId) //gets id from url
			.then(function(data) {	
			switch (analysisType) {
				case 'concepts':
					data.concepts.forEach(function(concept){
						var relevance = concept.relevance*100;
						var text = concept.text.charAt(0).toUpperCase() + concept.text.slice(1);  // Capitalise first letter 
						responseData.push({relevance: concept.relevance, text: text, dbpedia_resource: concept.dbpedia_resource});
					});
					sortRelevance(); 
					checkLength();
				break;
				case 'keywords':
					data.keywords.forEach(function(keyword){
						var relevance = keyword.relevance*100;
						var text = keyword.text.charAt(0).toUpperCase() + keyword.text.slice(1);  // Capitalise first letter
						responseData.push({relevance: keyword.relevance, text: text});
					});

					sortRelevance();
					checkLength();
				break;
      		}
      		
				
			}, function(err) {
				bsLoadingOverlayService.stop({referenceId: 'donut-chart'});	// If error, stop animated loading overlay
			}); 
		}

	    /**
	    * @ngdoc function
	    * @name checkLength
	    * @methodOf visualisations.controller:donutChartCtrl
	    * @description Checks if there are more than 10 elements to be drawn, if so it trims
	    * and will take the top 10 elements and then reverse them so they are in descending order.
	    * This functinon is called when drawing a keyword or concept analysis, the function then calls the drawChart function
	    */
	    function checkLength() {
	      if(responseData.length > 10) {
	        sortData = responseData.slice((responseData.length-10), responseData.length);
	        sortData.reverse();
	       // drawChart(sortData);
	       drawFancy(sortData);                    
	      }else {
	        responseData.reverse();
	        //drawChart(responseData);
	        drawFancy(responseData);
	      } 
	    }

	    /**
	    * @ngdoc function
	    * @name sortRelevance
	    * @methodOf visualisations.controller:donutChartCtrl
	    * @description Function sorts the analysis data in ascending order on relevance. Function is used
	    * when drawing keyword and concept analysis
	    * @returns {array} The sorted array
	    */    
	    function sortRelevance() {
	      responseData.sort(function (a, b) {
	        return a.relevance - b.relevance;
	      });
	    }

	    function roundUp() {

	    }

		function drawChart(data) {

		var tooltip = d3.select('#chart')            
		  .append('div')                             
		  .attr('class', 'tooltip');                 

		tooltip.append('div')                        
		  .attr('class', 'label');                   

		tooltip.append('div')                        
		  .attr('class', 'count');                   

		tooltip.append('div')                        
		  .attr('class', 'percent');                 


  		var width = 720;
        var height = 720;
        var radius = Math.min(width, height) / 2;

        var color = d3.scaleOrdinal(d3.schemeCategory20c);

        var svg = d3.select('#chart')
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .append('g')
          .attr('transform', 'translate(' + (width / 2) + 
            ',' + (height / 2) + ')');

          var donutWidth = 150;

		var arc = d3.arc()
          .innerRadius(radius - donutWidth)
          .outerRadius(radius);

        var pie = d3.pie()
          .value(function(d) { return d.relevance; })
          .sort(null);	


        var legendRectSize = 25;
        var legendSpacing = 8;
        
        var path = svg.selectAll('path')
          .data(pie(data))
          .enter()
          .append('path')
          .attr('d', arc)
          .attr('fill', function(d, i) { 
            return color(d.data.text);
          });

          var div = d3.select("path").append("div").attr("class", "tooltip");

		path.on('mouseover', function(d) {
		 tooltip
                .style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY - 70 + "px")
                .style("display", "block")
                .html((d.data.text) + "<br>" + (d.data.relevance) + "%");
        tooltip.select('.label').html(d.data.text);
        tooltip.select('.count').html(d.data.relevance);
		});
        
		path.on('mouseout', function() {
		  tooltip.style('display', 'none');
		});

		var legend = svg.selectAll('.legend')
		  .data(color.domain())
		  .enter()
		  .append('g')
		  .attr('class', 'legend')
		  .attr('transform', function(d, i) {
		    var height = legendRectSize + legendSpacing;
		    var offset =  height * color.domain().length / 2;
		    var horz = -2 * legendRectSize;
		    var vert = i * height - offset;
		    return 'translate(' + horz + ',' + vert + ')';
		  });
		        
		legend.append('rect')
		  .attr('width', legendRectSize)
		  .attr('height', legendRectSize)
		  .style('fill', color)
		  .style('stroke', color);
		        
		legend.append('text')
		  .attr('x', legendRectSize + legendSpacing)
		  .attr('y', legendRectSize - legendSpacing)
		  .text(function(d) { return d; });

		}

		function drawFancy(data) {
			console.log(data);
			var donut = donutChart(data)
	        .width(960)
	        .height(500)
	        .cornerRadius(3) // sets how rounded the corners are on each slice
	        .padAngle(0.015) // effectively dictates the gap between slices
	        .variable(data.relevance)
	        .category(data.text);

	        d3.select('#chart')
	        	.datum(data)
	        	.call(donut);
		}

		function donutChart(data) {

			var width,
			        height,
			        margin = {top: 10, right: 10, bottom: 10, left: 10},
			        colour = d3.scaleOrdinal(d3.schemeCategory20c), // colour scheme
			        variable, // value in data that will dictate proportions on chart
			        category, // compare data by
			        padAngle, // effectively dictates the gap between slices
			        floatFormat = d3.format('.4r'),
			        cornerRadius, // sets how rounded the corners are on each slice
			        percentFormat = d3.format(',.2%');
			        console.log(data);

			function chart(selection){
				console.log(selection);
		        selection.each(function(data) {
		       
		            // generate chart

		            // ===========================================================================================
		            // Set up constructors for making donut. See https://github.com/d3/d3-shape/blob/master/README.md
		            var radius = Math.min(width, height) / 2;
		            console.log(data);
		            // creates a new pie generator
		            var pie = d3.pie()
		                .value(function(d) { return floatFormat(d.relevance); })
		                .sort(null);

		            // contructs and arc generator. This will be used for the donut. The difference between outer and inner
		            // radius will dictate the thickness of the donut
		            var arc = d3.arc()
		                .outerRadius(radius * 0.8)
		                .innerRadius(radius * 0.6)
		                .cornerRadius(cornerRadius)
		                .padAngle(padAngle);

		            // this arc is used for aligning the text labels
		            var outerArc = d3.arc()
		                .outerRadius(radius * 0.9)
		                .innerRadius(radius * 0.9);
		            // ===========================================================================================

		            // ===========================================================================================
		            // append the svg object to the selection
		            var svg = selection.append('svg')
		                .attr('width', width + margin.left + margin.right)
		                .attr('height', height + margin.top + margin.bottom)
		              .append('g')
		                .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
		            // ===========================================================================================

		            // ===========================================================================================
		            // g elements to keep elements within svg modular
		            svg.append('g').attr('class', 'slices');
		            svg.append('g').attr('class', 'labelName');
		            svg.append('g').attr('class', 'lines');
		            // ===========================================================================================

		            // ===========================================================================================
		            // add and colour the donut slices
		            var path = svg.select('.slices')
		                .datum(data).selectAll('path')
		                .data(pie)
		              .enter().append('path')
		                .attr('fill', function(d) {return colour(d.data.text); })
		                .attr('d', arc);

		             
		            // ===========================================================================================

		            // ===========================================================================================
		            // add text labels
		            var label = svg.select('.labelName').selectAll('text')
		                .data(pie)
		              .enter().append('text')
		                .attr('dy', '.35em')
		                .html(function(d) {
		                    // add "key: value" for given category. Number inside tspan is bolded in stylesheet.
		                    return d.data.text + ': <tspan>' + percentFormat(d.data.relevance) + '</tspan>';
		                })
		                .attr('transform', function(d) {

		                    // effectively computes the centre of the slice.
		                    // see https://github.com/d3/d3-shape/blob/master/README.md#arc_centroid
		                    var pos = outerArc.centroid(d);

		                    // changes the point to be on left or right depending on where label is.
		                    pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
		                    return 'translate(' + pos + ')';
		                })
		                .style('text-anchor', function(d) {
		                    // if slice centre is on the left, anchor text to start, otherwise anchor to end
		                    return (midAngle(d)) < Math.PI ? 'start' : 'end';
		                });
		            // ===========================================================================================

		            // ===========================================================================================
		            // add lines connecting labels to slice. A polyline creates straight lines connecting several points
		            var polyline = svg.select('.lines')
		                .selectAll('polyline')
		                .data(pie)
		              .enter().append('polyline')
		                .attr('points', function(d) {

		                    // see label transform function for explanations of these three lines.
		                    var pos = outerArc.centroid(d);
		                    pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
		                    return [arc.centroid(d), outerArc.centroid(d), pos]
		                });
		            // ===========================================================================================

		            // ===========================================================================================
		            // add tooltip to mouse events on slices and labels
		            d3.selectAll('.labelName text, .slices path').call(toolTip);
		            // ===========================================================================================

		            // ===========================================================================================
		            // Functions

		            // calculates the angle for the middle of a slice
		            function midAngle(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; }

		            // function that creates and adds the tool tip to a selected element
		            function toolTip(selection) {

		                // add tooltip (svg circle element) when mouse enters label or slice
		                selection.on('mouseenter', function (data) {

		                    svg.append('text')
		                        .attr('class', 'toolCircle')
		                        .attr('dy', -15) // hard-coded. can adjust this to adjust text vertical alignment in tooltip
		                        .html(toolTipHTML(data)) // add text to the circle.
		                        .style('font-size', '.9em')
		                        .style('text-anchor', 'middle'); // centres text in tooltip

		                    svg.append('circle')
		                        .attr('class', 'toolCircle')
		                        .attr('r', radius * 0.55) // radius of tooltip circle
		                        .style('fill', colour(data.data.text)) // colour based on category mouse is over
		                        .style('fill-opacity', 0.35);

		                });

		                // remove the tooltip when mouse leaves the slice/label
		                selection.on('mouseout', function () {
		                    d3.selectAll('.toolCircle').remove();
		                });
		            }

		            // function to create the HTML string for the tool tip. Loops through each key in data object
		            // and returns the html string key: value
		            function toolTipHTML(data) {

		                var tip = '',
		                    i   = 0;

		                for (var key in data.data) {

		                    // if value is a number, format it as a percentage
		                    var value = (!isNaN(parseFloat(data.data[key]))) ? percentFormat(data.data[key]) : data.data[key];

		                    // leave off 'dy' attr for first tspan so the 'dy' attr on text element works. The 'dy' attr on
		                    // tspan effectively imitates a line break.
		                    if (i === 0) tip += '<tspan x="0">' + key + ': ' + value + '</tspan>';
		                    else tip += '<tspan x="0" dy="1.2em">' + key + ': ' + value + '</tspan>';
		                    i++;
		                }

		                return tip;
		            }
		            // ===========================================================================================
	        	});
	    	}

			// getter and setter functions. See Mike Bostocks post "Towards Reusable Charts" for a tutorial on how this works.
		    chart.width = function(value) {
		        if (!arguments.length) return width;
		        width = value;
		        return chart;
		    };

		    chart.height = function(value) {
		        if (!arguments.length) return height;
		        height = value;
		        return chart;
		    };

		    chart.margin = function(value) {
		        if (!arguments.length) return margin;
		        margin = value;
		        return chart;
		    };

		    chart.radius = function(value) {
		        if (!arguments.length) return radius;
		        radius = value;
		        return chart;
		    };

		    chart.padAngle = function(value) {
		        if (!arguments.length) return padAngle;
		        padAngle = value;
		        return chart;
		    };

		    chart.cornerRadius = function(value) {
		        if (!arguments.length) return cornerRadius;
		        cornerRadius = value;
		        return chart;
		    };

		    chart.colour = function(value) {
		        if (!arguments.length) return colour;
		        colour = value;
		        return chart;
		    };

		    chart.variable = function(value) {
		        if (!arguments.length) return variable;
		        variable = value;
		        return chart;
		    };

		    chart.category = function(value) {
		        if (!arguments.length) return category;
		        category = value;
		        return chart;
		    };

		    return chart;
		}
	}
})();
