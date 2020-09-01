// Code for chart is wrapped inside a function so that it resizes the chart based on window size.
function makeResponsive() {
	// If SVG area is not empty when browser loads, remove and replace with a resized version of chart
	var svgArea = d3.select('body').select('svg');

	// Clear SVG if it is not empty
	if (!svgArea.empty()) {
		svgArea.remove();
	}

	// Set up svg width and height for chart
	var svgWidth = 980;
	var svgHeight = 600;

	// Set up margins
	var margin = {
		top: 20,
		right: 40,
		bottom: 90,
		left: 100
	};

	// Define dimensions of the chart area
	var width = svgWidth - margin.left - margin.right;
	var height = svgHeight - margin.top - margin.bottom;

	// Create an SVG element/wrapper - select body, append SVG area and  set the dimensions
	var svg = d3.select('#scatter').append('svg').attr('width', svgWidth).attr('height', svgHeight);

	// Append group element and set margins - shift (translate) by left and top margins using transform
	var chartGroup = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

	// Base axes
	var selectedXAxis = 'poverty';
	var selectedYAxis = 'healthcare';

	// Function for updating x and y scales upon click on axis labels
	function xScale(loadedData, selectedXAxis) {
		// scale function for selectedXAxis
		var xLinearScale = d3
			.scaleLinear()
			.domain([
				d3.min(loadedData, (d) => d[selectedXAxis]) * 0.8,
				d3.max(loadedData, (d) => d[selectedXAxis]) * 1.2
			])
			.range([ 0, width ]);
		return xLinearScale;
	}

	function yScale(loadedData, selectedYAxis) {
		// scale functions for selectedYAxis
		var yLinearScale = d3
			.scaleLinear()
			.domain([
				d3.min(loadedData, (d) => d[selectedYAxis]) * 0.8,
				d3.max(loadedData, (d) => d[selectedYAxis]) * 1.2
			])
			.range([ height, 0 ]);
		return yLinearScale;
	}

	// Functions for updating x and y axes upon click on axis labels
	function renderXAxes(newXScale, xAxis) {
		var bottomAxis = d3.axisBottom(newXScale);
		xAxis.transition().duration(1000).call(bottomAxis);
		return xAxis;
	}

	function renderYAxes(newYScale, yAxis) {
		var leftAxis = d3.axisLeft(newYScale);
		yAxis.transition().duration(1000).call(leftAxis);
		return yAxis;
	}

	// Function for updating circles group with a transition to new circles
	function renderCircles(circlesGroup, newXScale, selectedXAxis, newYScale, selectedYAxis) {
		circlesGroup
			.transition()
			.duration(1000)
			.attr('cx', (d) => newXScale(d[selectedXAxis]))
			.attr('cy', (d) => newYScale(d[selectedYAxis]));
		return circlesGroup;
	}

	// Function for updating text group with a transition to new text
	function renderText(textGroup, newXScale, selectedXAxis, newYScale, selectedYAxis) {
		textGroup
			.transition()
			.duration(1000)
			.attr('x', (d) => newXScale(d[selectedXAxis]))
			.attr('y', (d) => newYScale(d[selectedYAxis]))
			.attr('text-anchor', 'middle');

		return textGroup;
	}

	// Function for updating circles group with new tooltip
	function updateToolTip(selectedXAxis, selectedYAxis, circlesGroup, textGroup) {
		if (selectedXAxis === 'poverty') {
			var xLabel = 'Poverty (%)';
		} else if (selectedXAxis === 'age') {
			var xLabel = 'Age (Median)';
		} else {
			var xLabel = 'Household Income (Median)';
		}
		if (selectedYAxis === 'healthcare') {
			var yLabel = 'Lacks Healthcare (%)';
		} else if (selectedYAxis === 'obesity') {
			var yLabel = 'Obese (%)';
		} else {
			var yLabel = 'Smokes (%)';
		}

		// Initialize tooltip
		var toolTip = d3.tip().attr('class', 'tooltip').offset([ 90, 90 ]).html(function(d) {
			return `<strong>${d.abbr}</strong><br>${xLabel} ${d[selectedXAxis]}<br>${yLabel} ${d[selectedYAxis]}`;
		});

		// Create circles tooltip in the chart
		circlesGroup.call(toolTip);
		// Create event listeners to display and hide the circles tooltip
		circlesGroup
			.on('mouseover', function(data) {
				toolTip.show(data, this);
			})
			.on('mouseout', function(data) {
				toolTip.hide(data);
			});

		// Create text tooltip in the chart
		textGroup.call(toolTip);
		// Create event listeners to display and hide the text tooltip
		textGroup
			.on('mouseover', function(data) {
				toolTip.show(data, this);
			})
			.on('mouseout', function(data) {
				toolTip.hide(data);
			});
		return circlesGroup;
	}

	// Import the data
	d3.csv('assets/data/data.csv').then(function(loadedData) {
		loadedData.forEach(function(data) {
			data.poverty = +data.poverty;
			data.age = +data.age;
			data.income = +data.income;
			data.healthcare = +data.healthcare;
			data.obesity = +data.obesity;
			data.smokes = +data.smokes;
		});

		// Create xLinearScale & yLinearScale
		var xLinearScale = xScale(loadedData, selectedXAxis);
		var yLinearScale = yScale(loadedData, selectedYAxis);

		// Create axis functions
		var bottomAxis = d3.axisBottom(xLinearScale);
		var leftAxis = d3.axisLeft(yLinearScale);

		// Append x and y axes to the chart
		var xAxis = chartGroup
			.append('g')
			.classed('x-axis', true)
			.attr('transform', `translate(0, ${height})`)
			.call(bottomAxis);

		var yAxis = chartGroup.append('g').classed('y-axis', true).call(leftAxis);

		// Create and append initial circles
		var circlesGroup = chartGroup
			.selectAll('.stateCircle')
			.data(loadedData)
			.enter()
			.append('circle')
			.attr('cx', (d) => xLinearScale(d[selectedXAxis]))
			.attr('cy', (d) => yLinearScale(d[selectedYAxis]))
			.attr('class', 'stateCircle')
			.attr('r', 15)
			.attr('opacity', '.75');

		// Append text to circles
		var textGroup = chartGroup
			.selectAll('.stateText')
			.data(loadedData)
			.enter()
			.append('text')
			.attr('x', (d) => xLinearScale(d[selectedXAxis]))
			.attr('y', (d) => yLinearScale(d[selectedYAxis] * 0.98))
			.text((d) => d.abbr)
			.attr('class', 'stateText')
			.attr('font-size', '12px')
			.attr('text-anchor', 'middle')
			.attr('fill', 'white');

		// Create a group for 3 xAxis Labels; poverty, age, and income
		var xLabelsGroup = chartGroup.append('g').attr('transform', `translate(${width / 2}, ${height + 20})`);
		var povertyLabel = xLabelsGroup
			.append('text')
			.attr('x', 0)
			.attr('y', 20)
			.attr('value', 'poverty')
			.classed('active', true)
			.text('Poverty (%)');

		var ageLabel = xLabelsGroup
			.append('text')
			.attr('x', 0)
			.attr('y', 40)
			.attr('value', 'age')
			.classed('inactive', true)
			.text('Age (Median)');

		var incomeLabel = xLabelsGroup
			.append('text')
			.attr('x', 0)
			.attr('y', 60)
			.attr('value', 'income')
			.classed('inactive', true)
			.text('Household Income (Median)');

		// Create a group for 3 yAxis labels; healthcare, smokes, and obesity
		var yLabelsGroup = chartGroup.append('g').attr('transform', `translate(-25, ${height / 2})`);
		// Append yAxis
		var healthcareLabel = yLabelsGroup
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', -30)
			.attr('x', 0)
			.attr('value', 'healthcare')
			.attr('dy', '1em')
			.classed('axis-text', true)
			.classed('active', true)
			.text('Lacks Healthcare (%)');

		var smokesLabel = yLabelsGroup
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', -50)
			.attr('x', 0)
			.attr('value', 'smokes')
			.attr('dy', '1em')
			.classed('axis-text', true)
			.classed('inactive', true)
			.text('Smokes (%)');

		var obesityLabel = yLabelsGroup
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', -70)
			.attr('x', 0)
			.attr('value', 'obesity')
			.attr('dy', '1em')
			.classed('axis-text', true)
			.classed('inactive', true)
			.text('Obese (%)');

		// updateToolTip function for the selection
		var circlesGroup = updateToolTip(selectedXAxis, selectedYAxis, circlesGroup, textGroup);

		// xAxis labels event listener
		xLabelsGroup.selectAll('text').on('click', function() {
			// Get value of selection
			var value = d3.select(this).attr('value');
			if (value !== selectedXAxis) {
				// Replaces selectedXAxis with value
				selectedXAxis = value;
				// Updates xScale for new data
				xLinearScale = xScale(loadedData, selectedXAxis);
				// Updates xAxis with transition
				xAxis = renderXAxes(xLinearScale, xAxis);
				// Updates circles with new values
				circlesGroup = renderCircles(circlesGroup, xLinearScale, selectedXAxis, yLinearScale, selectedYAxis);
				// Updates text with new values
				textGroup = renderText(textGroup, xLinearScale, selectedXAxis, yLinearScale, selectedYAxis);
				// Updates tooltips with new information
				circlesGroup = updateToolTip(selectedXAxis, selectedYAxis, circlesGroup, textGroup);
				// Changes classes to change bold text
				if (selectedXAxis === 'poverty') {
					povertyLabel.classed('active', true).classed('inactive', false);
					ageLabel.classed('active', false).classed('inactive', true);
					incomeLabel.classed('active', false).classed('inactive', true);
				} else if (selectedXAxis === 'age') {
					povertyLabel.classed('active', false).classed('inactive', true);
					ageLabel.classed('active', true).classed('inactive', false);
					incomeLabel.classed('active', false).classed('inactive', true);
				} else {
					povertyLabel.classed('active', false).classed('inactive', true);
					ageLabel.classed('active', false).classed('inactive', true);
					incomeLabel.classed('active', true).classed('inactive', false);
				}
			}
		});

		// yAxis labels event listener
		yLabelsGroup.selectAll('text').on('click', function() {
			// Get value of selection
			var value = d3.select(this).attr('value');
			if (value !== selectedYAxis) {
				// Replaces selectedYAxis with value
				selectedYAxis = value;
				// Updates yScale for new data
				yLinearScale = yScale(loadedData, selectedYAxis);
				// Updates yAxis with transition
				yAxis = renderYAxes(yLinearScale, yAxis);
				// Updates circles with new values
				circlesGroup = renderCircles(circlesGroup, xLinearScale, selectedXAxis, yLinearScale, selectedYAxis);
				// Updates text with new values
				textGroup = renderText(textGroup, xLinearScale, selectedXAxis, yLinearScale, selectedYAxis);
				// Updates tooltips with new information
				circlesGroup = updateToolTip(selectedXAxis, selectedYAxis, circlesGroup, textGroup);
				// Changes classes to change bold text
				if (selectedYAxis === 'healthcare') {
					healthcareLabel.classed('active', true).classed('inactive', false);
					obesityLabel.classed('active', false).classed('inactive', true);
					smokesLabel.classed('active', false).classed('inactive', true);
				} else if (selectedYAxis === 'obesity') {
					healthcareLabel.classed('active', false).classed('inactive', true);
					obesityLabel.classed('active', true).classed('inactive', false);
					smokesLabel.classed('active', false).classed('inactive', true);
				} else {
					healthcareLabel.classed('active', false).classed('inactive', true);
					obesityLabel.classed('active', false).classed('inactive', true);
					smokesLabel.classed('active', true).classed('inactive', false);
				}
			}
		});
	});
}
// When browser loads, makeResponsive() is called
makeResponsive();

// When browser window is resized, makeResponsive() is Called
d3.select(window).on('resize', makeResponsive);
