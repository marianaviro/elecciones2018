/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
let scrollVis = function() {
	// constants to define the size
	// and margins of the vis area.
	let width = 810;
	let height = 600;
	let margin = { top: 0, left: 30, bottom: 40, right: 10 };

	var dimensions = {
		height: 600,
		width: 810,
		margin_left: 34,
		margin_top: 0,
		margin_right: 10,
		margin_bottom: 40
	};

	const { margin_bottom, margin_left, margin_right } = dimensions;

	// Keep track of which visualization
	// we are on and which was the last
	// index activated. When user scrolls
	// quickly, we want to call all the
	// activate functions that they pass.
	let lastIndex = -1;
	let activeIndex = 0;

	// Sizing for the grid visualization
	let squareSize = 6;
	let squarePad = 2;
	let numPerRow = width / (squareSize + squarePad);

	// main svg used for visualization
	let svg = null;

	// d3 selection that will be used
	// for displaying visualizations
	let g = null;

	// When scrolling to a new section
	// the activation function for that
	// section is called.
	let activateFunctions = [];
	// If a section has an update function
	// then it is called while scrolling
	// through the section with the current
	// progress through the section.
	let updateFunctions = [];

	var colors = d3.scaleOrdinal(d3.schemeCategory20);

	var yScale = d3
		.scaleLinear()
		//.domain([0, yMax])
		.range([dimensions.height - dimensions.margin_top, dimensions.margin_bottom]);

	var xScale = d3
		.scaleBand()
		//.domain(xDomain)
		.range([dimensions.margin_left + 30, dimensions.width - dimensions.margin_right]);

	var parser = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ');
	var first_day = parser('2017-12-02T18:00:00.477Z');
	var last_day = parser('2017-12-05T18:00:00.514Z');

	var xScaleTime = d3
		.scaleTime()
		.domain([first_day, last_day])
		.rangeRound([0 + margin_left, width - margin_right]);

	var yScaleLine = d3
		.scaleLinear()
		//.domain([0, yMax])
		.range([height - margin_bottom, 0]);

	var yAxis = d3.axisLeft().scale(yScale);
	var xAxis = d3.axisBottom().scale(xScaleTime);

	/**
	 * chart
	 *
	 * @param selection - the current d3 selection(s)
	 *  to draw the visualization in. For this
	 *  example, we will be drawing it in #vis
	 */
	var chart = function(selection) {
		selection.each(function(rawData) {
			// create svg and give it a width and height
			svg = d3
				.select(this)
				.selectAll('svg')
				.data([0]);
			var svgE = svg.enter().append('svg');
			// @v4 use merge to combine enter and existing selection
			svg = svg.merge(svgE);

			svg
				.append('defs')
				.append('filter')
				.attr('id', 'greyscale')
				.append('feColorMatrix')
				.attr('type', 'matrix')
				.attr(
					'values',
					`0 1 0 0 0
                  0 1 0 0 0
                  0 1 0 0 0
                  0 1 0 1 0 `
				);

			svg.attr('width', width + margin.left + margin.right);
			svg.attr('height', height + margin.top + margin.bottom);

			svg.append('g');

			// this group element will be used to contain all
			// other elements.
			g = svg
				.select('g')
				.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
				.attr('class', 'nodes');

			setupVis(rawData);
		});
	};

	/**
	 * setupVis - creates initial elements for all
	 * sections of the visualization.
	 *
	 * @param wordData - data object for each word.
	 * @param fillerCounts - nested data that includes
	 *  element for each filler word type.
	 * @param histData - binned histogram data
	 */
	var setupVis = function(rawData) {
		const retweets = rawData[0];
		const datos = rawData[1];

		// count openvis title
		g
			.append('text')
			.attr('class', 'title vis-title')
			.attr('x', width / 2)
			.attr('y', height / 3)
			.text('¿Quién sigue a quién?');

		g
			.append('text')
			.attr('class', 'sub-title vis-title')
			.attr('x', width / 2)
			.attr('y', height / 3 + height / 5)
			.text('Las redes entre los candidatos');

		g.selectAll('.vis-title').attr('opacity', 0);

		var yMax = d3.max(retweets, d => d.cuenta_retweets);
		yScale.domain([0, yMax]);

		var xDomain = retweets.map(d => d.twitter_handle);
		xScale.domain(xDomain);

		var yAxis = d3.axisLeft().scale(yScale);
		g
			.append('g')
			.attr('id', 'eje_y')
			.attr('transform', `translate(${dimensions.margin_left},${dimensions.margin_top})`)
			.call(yAxis)
			.attr('opacity', 0);

		g
			.append('g')
			.attr('id', 'eje_x')
			.attr('transform', `translate(${margin_left - 19},${height - 52})`)
			.call(xAxis)
			.attr('opapcity', 0);

		let bars = g
			.append('g')
			.classed('bars', true)
			.selectAll('rect')
			.data(retweets, d => d.twitter_handle);

		let barsE = bars
			.enter()
			.append('rect')
			.classed('bar', true);

		bars = bars
			.merge(barsE)
			.attr('x', d => xScale(d.twitter_handle))
			.attr('fill', d => colors(d.twitter_handle))
			.attr('y', d => {
				return dimensions.margin_top + yScale(d.cuenta_retweets);
			})
			.attr('height', (d, i) => {
				return dimensions.height - yScale(d.cuenta_retweets) - dimensions.margin_top;
			})
			.attr('width', 10)
			.attr('opacity', 0);

		let images = g
			.append('g')
			.classed('images', true)
			.selectAll('image')
			.data(retweets, d => d.twitter_handle);

		let imagesE = images
			.enter()
			.append('svg:image')
			.classed('image', true);

		// Tip
		var tip = d3
			.tip()
			.attr('class', 'd3-tip arriba')
			.offset([-10, 0])
			.html(d => `<strong>${d.name} - ${d.twitter_handle} - ${d.cuenta_retweets} retweets</strong>`);
		g.call(tip);

		images = images
			.merge(imagesE)
			.attr('xlink:href', d => d.photo_url)
			.attr('x', d => xScale(d.twitter_handle) - 15)
			.attr('y', d => {
				return dimensions.margin_top + yScale(d.cuenta_retweets) - 40;
			})
			.attr('width', 40)
			.attr('height', 40)
			.attr('opacity', 0)
			.on('mouseover', tip.show)
			.on('mouseout', tip.hide);

		let circles = g
			.append('g')
			.classed('circles', true)
			.selectAll('circle')
			.data(retweets, d => d.twitter_handle);

		let circlesE = circles
			.enter()
			.append('circle')
			.classed('circle', true);

		circles = circles
			.merge(circlesE)
			.attr('cx', d => xScale(d.twitter_handle) + 5)
			.attr('cy', d => {
				return dimensions.margin_top + yScale(d.cuenta_retweets) - 20;
			})
			.attr('r', 18)
			.attr('fill', 'transparent')
			.attr('stroke', d => colors(d.twitter_handle))
			.attr('stroke-width', 3.4)
			.attr('opacity', 0)
			.on('mouseover', tip.show)
			.on('mouseout', tip.hide);

		g
			.append('text')
			.attr('id', 'retweets_label')
			.attr('transform', 'rotate(-90)')
			.attr('y', 0 - margin_left)
			.attr('x', 0 - height / 2)
			.attr('dy', '1em')
			.style('text-anchor', 'middle')
			.text('# de Retweets')
			.attr('opacity', 0);

		g
			.append('text')
			.attr('id', 'seguidores_label')
			.attr('transform', 'rotate(-90)')
			.attr('y', 0 - margin_left)
			.attr('x', 0 - height / 2)
			.attr('dy', '1em')
			.style('text-anchor', 'middle')
			.text('# de Seguidores Ganados')
			.attr('opacity', 0);

		g
			.append('text')
			.attr('id', 'tiempo_label')
			.attr('y', margin_left + width / 2 + 136)
			.attr('x', height + 150)
			.attr('dy', '1em')
			.style('text-anchor', 'middle')
			.text('Últimos 3 dias')
			.attr('opacity', 0);

		//Line chart

		var yMaxLine = d3.max(datos, candidato => {
			var max = 0;
			candidato.growth.map(hora_seguidores => {
				if (hora_seguidores.cambio > max) {
					max = hora_seguidores.cambio;
				}
			});
			return max;
		});

		var min = d3.min(datos, candidato => {
			var min = 0;
			candidato.growth.map(hora_seguidores => {
				if (hora_seguidores.cambio < min) {
					min = hora_seguidores.cambio;
				}
			});
			return min;
		});
		yScaleLine.domain([min, yMaxLine]);

		let lines = g.append('g').classed('lines', true);

		datos.map(candidato => {
			var seguidores = d3
				.line()
				.x(d => {
					return xScaleTime(d.date);
				})
				.y(d => yScaleLine(d.cambio));

			lines
				.append('path')
				.datum(candidato.growth)
				.attr('id', 'cantidad')
				.attr('fill', 'none')
				.attr('stroke', colors(candidato.twitter_handle))
				.attr('stroke-width', 5)
				.attr('d', seguidores)
				.classed('line', true)
				.attr('opacity', 0);
			// .on('mouseover', tip.show)
			// .on('mouseout', tip.hide);
		});

		setupSections();
	};

	/**
	 * setupSections - each section is activated
	 * by a separate function. Here we associate
	 * these functions to the sections based on
	 * the section's index.
	 *
	 */
	var setupSections = function() {
		// activateFunctions are called each
		// time the active section changes
		activateFunctions[0] = showTitle;
		activateFunctions[1] = showBarGraph;
		activateFunctions[2] = showLineChart;

		// updateFunctions are called while
		// in a particular section to update
		// the scroll progress in that section.
		// Most sections do not need to be updated
		// for all scrolling and so are set to
		// no-op functions.
		for (var i = 0; i < 9; i++) {
			updateFunctions[i] = function() {};
		}
	};

	/**
	 * ACTIVATE FUNCTIONS
	 *
	 * These will be called their
	 * section is scrolled to.
	 *
	 * General pattern is to ensure
	 * all content for the current section
	 * is transitioned in, while hiding
	 * the content for the previous section
	 * as well as the next section (as the
	 * user may be scrolling up or down).
	 *
	 */

	/**
	 * showTitle - initial title
	 *
	 * hides: count title
	 * (no previous step to hide)
	 * shows: intro title
	 *
	 */
	function showTitle() {
		g
			.selectAll('.bar')
			.transition()
			.duration(600)
			.attr('opacity', 0);

		g
			.selectAll('.image')
			.transition()
			.duration(600)
			.attr('opacity', 0);

		g
			.selectAll('.circle')
			.transition()
			.duration(600)
			.attr('opacity', 0);

		g
			.selectAll('.line')
			.transition()
			.duration(600)
			.attr('opacity', 0);

		g
			.select('#eje_y')
			.transition()
			.duration(600)
			.attr('opacity', 0);

		g
			.select('#eje_x')
			.transition()
			.duration(600)
			.attr('opacity', 0);

		g
			.select('#retweets_label')
			.transition()
			.duration(600)
			.attr('opacity', 0);

		g
			.select('#seguidores_label')
			.transition()
			.duration(600)
			.attr('opacity', 0);

		g
			.select('#tiempo_label')
			.transition()
			.duration(600)
			.attr('opacity', 0);
	}

	function showBarGraph() {
		g
			.selectAll('.bar')
			.transition()
			.duration(600)
			.attr('opacity', 1);

		g
			.selectAll('.image')
			.transition()
			.duration(600)
			.attr('y', d => {
				return dimensions.margin_top + yScale(d.cuenta_retweets) - 40;
			})
			.attr('opacity', 1);

		g
			.selectAll('.circle')
			.transition()
			.duration(600)
			.attr('cy', d => {
				return dimensions.margin_top + yScale(d.cuenta_retweets) - 20;
			})
			.attr('opacity', 1);

		g
			.select('#retweets_label')
			.transition()
			.duration(600)
			.attr('opacity', 1);

		g
			.selectAll('.line')
			.transition()
			.duration(600)
			.attr('opacity', 0);

		yAxis.scale(yScale);

		g
			.select('#eje_y')
			.transition()
			.duration(600)
			.call(yAxis);

		g
			.select('#eje_y')
			.transition()
			.duration(600)
			.attr('opacity', 1);

		g
			.select('#eje_x')
			.transition()
			.duration(600)
			.attr('opacity', 0);

		g
			.select('#seguidores_label')
			.transition()
			.duration(600)
			.attr('opacity', 0);

		g
			.select('#tiempo_label')
			.transition()
			.duration(600)
			.attr('opacity', 0);
	}

	function showLineChart() {
		g
			.selectAll('.bar')
			.transition()
			.duration(0)
			.attr('opacity', 0);

		g
			.select('#retweets_label')
			.transition()
			.duration(600)
			.attr('opacity', 0);

		g
			.select('#seguidores_label')
			.transition()
			.duration(600)
			.attr('opacity', 1);

		g
			.selectAll('.image')
			.transition()
			.duration(600)
			.attr('y', 600)
			.attr('opacity', 1);

		g
			.selectAll('.circle')
			.transition()
			.duration(600)
			.attr('cy', 620)
			.attr('opacity', 1);

		// Poner line chart:
		g
			.selectAll('.line')
			.transition()
			.duration(600)
			.attr('opacity', 1);

		g
			.select('#tiempo_label')
			.transition()
			.duration(600)
			.attr('opacity', 1);

		yAxis.scale(yScaleLine);
		xAxis.scale(xScaleTime);

		g
			.select('#eje_y')
			.transition()
			.duration(600)
			.call(yAxis)
			.attr('opacity', 1);

		g
			.select('#eje_x')
			.transition()
			.duration(600)
			.attr('opacity', 1)
			.call(xAxis);
	}

	function highlightRobledo(edges) {
		// Higlight JERobledo
		g
			.selectAll('.node image')
			.filter(d => d.screenName === 'JERobledo')
			.classed('greyed', false)
			.transition()
			.duration(600)
			.attr('x', -30)
			.attr('y', -30)
			.attr('width', 60)
			.attr('height', 60)
			.attr('opacity', 1);

		//Highlight JERobledo followers
		g
			.selectAll('.node image')
			.filter(d => isFollower(d, 'JERobledo', edges))
			.classed('greyed', false)
			.transition()
			.duration(600)
			.attr('x', -22)
			.attr('y', -22)
			.attr('width', 44)
			.attr('height', 44)
			.attr('opacity', 1);

		//Hide others
		g
			.selectAll('.node image')
			.filter(d => !isFollower(d, 'JERobledo', edges))
			.filter(d => d.screenName !== 'JERobledo')
			.classed('greyed', true)
			.transition()
			.duration(600)
			.attr('x', -20)
			.attr('y', -20)
			.attr('width', 40)
			.attr('height', 40)
			.attr('opacity', 0.7);

		//Highlight JERobledo links
		g
			.selectAll('.link')
			.transition()
			.duration(600)
			.attr('opacity', d => (d.target.screenName === 'JERobledo' ? 1 : 0));

		g
			.select('.y-axis')
			.transition()
			.duration(600)
			.attr('opacity', 1);
	}

	function highlightMlucia(graphNodes, edges) {
		//Reset Y-Axis
		y.domain([
			d3.min(graphNodes, d => countFollowers(d, edges)),
			d3.max(graphNodes, d => countFollowers(d, edges))
		]);

		yAxis.tickFormat(function(d) {
			return d !== d3.max(graphNodes, d => countFollowers(d, edges)) ? '\xa0' + d : d + ' seguidores';
		});

		g
			.select('.y-axis')
			.transition()
			.duration(600)
			.call(customYAxis);

		g
			.selectAll('.node')
			.transition()
			.duration(600)
			.attr('transform', d => `translate(${politicalX(d)}, ${followersY(d, edges)})`);

		g
			.selectAll('.link')
			.transition()
			.duration(0)
			.attr('opacity', 0)
			.attr('x1', d => politicalX(d.source))
			.attr('y1', d => followersY(d.source, edges))
			.attr('x2', d => politicalX(d.target))
			.attr('y2', d => followersY(d.target, edges));

		// Higlight JERobledo
		g
			.selectAll('.node image')
			.filter(d => d.screenName === 'mluciaramirez')
			.classed('greyed', false)
			.transition()
			.duration(600)
			.attr('x', -30)
			.attr('y', -30)
			.attr('width', 60)
			.attr('height', 60)
			.attr('opacity', 1);

		//Highlight JERobledo followers
		g
			.selectAll('.node image')
			.filter(d => isFollower(d, 'mluciaramirez', edges))
			.classed('greyed', false)
			.transition()
			.duration(600)
			.attr('x', -22)
			.attr('y', -22)
			.attr('width', 44)
			.attr('height', 44)
			.attr('opacity', 1);

		//Hide others
		g
			.selectAll('.node image')
			.filter(d => !isFollower(d, 'mluciaramirez', edges))
			.filter(d => d.screenName !== 'mluciaramirez')
			.classed('greyed', true)
			.transition()
			.duration(600)
			.attr('x', -20)
			.attr('y', -20)
			.attr('width', 40)
			.attr('height', 40)
			.attr('opacity', 0.7);

		//Highlight JERobledo links
		g
			.selectAll('.link')
			.transition()
			.duration(600)
			.attr('opacity', d => (d.target.screenName === 'mluciaramirez' ? 1 : 0));

		g
			.select('.y-axis')
			.transition()
			.duration(600)
			.attr('opacity', 1);
	}

	function changeAxisToFollowers(graphNodes, edges) {
		// Restore all
		g
			.selectAll('.node image')
			.classed('greyed', false)
			.transition()
			.duration(0)
			.attr('x', -20)
			.attr('y', -20)
			.attr('width', 40)
			.attr('height', 40)
			.attr('opacity', 1);

		//Hide all links
		g
			.selectAll('.link')
			.transition()
			.duration(0)
			.attr('opacity', 0);

		y.domain([
			d3.min(graphNodes, d => countFollowing(d, edges)),
			d3.max(graphNodes, d => countFollowing(d, edges))
		]);

		yAxis.tickFormat(function(d) {
			return this.parentNode.nextSibling ? '\xa0' + d : d + ' siguiendo';
		});

		g
			.select('.y-axis')
			.transition()
			.duration(600)
			.attr('opacity', 1)
			.call(customYAxis);

		g
			.selectAll('.node')
			.transition()
			.duration(600)
			.attr('transform', d => `translate(${politicalX(d)}, ${followingY(d, edges)})`);

		g
			.selectAll('.link')
			.transition()
			.duration(0)
			.attr('opacity', 0)
			.attr('x1', d => politicalX(d.source))
			.attr('y1', d => followingY(d.source, edges))
			.attr('x2', d => politicalX(d.target))
			.attr('y2', d => followingY(d.target, edges));
	}

	function highlightVargas() {
		//Hide links
		g
			.selectAll('.link')
			.transition()
			.duration(0)
			.attr('opacity', 0);

		//Highlight Vargas
		g
			.selectAll('.node image')
			.filter(d => d.screenName === 'German_Vargas')
			.classed('greyed', false)
			.transition()
			.duration(600)
			.attr('x', -30)
			.attr('y', -30)
			.attr('width', 60)
			.attr('height', 60)
			.attr('opacity', 1);

		g
			.selectAll('.node image')
			.filter(d => d.screenName !== 'German_Vargas')
			.classed('greyed', true)
			.transition()
			.duration(600)
			.attr('x', -20)
			.attr('y', -20)
			.attr('width', 40)
			.attr('height', 40)
			.attr('opacity', 0.7);
	}

	function highlightHolmes(edges) {
		// Higlight CarlosHolmesTru
		g
			.selectAll('.node image')
			.filter(d => d.screenName === 'CarlosHolmesTru')
			.classed('greyed', false)
			.transition()
			.duration(600)
			.attr('x', -30)
			.attr('y', -30)
			.attr('width', 60)
			.attr('height', 60)
			.attr('opacity', 1);

		//Highlight CarlosHolmesTru following
		g
			.selectAll('.node image')
			.filter(d => isFollowedBy(d, 'CarlosHolmesTru', edges))
			.classed('greyed', false)
			.transition()
			.duration(600)
			.attr('x', -22)
			.attr('y', -22)
			.attr('width', 44)
			.attr('height', 44)
			.attr('opacity', 1);

		//Hide others
		g
			.selectAll('.node image')
			.filter(d => !isFollowedBy(d, 'CarlosHolmesTru', edges))
			.filter(d => d.screenName !== 'CarlosHolmesTru')
			.classed('greyed', true)
			.transition()
			.duration(600)
			.attr('x', -20)
			.attr('y', -20)
			.attr('width', 40)
			.attr('height', 40)
			.attr('opacity', 0.7);

		//Highlight CarlosHolmesTru links
		g
			.selectAll('.link')
			.transition()
			.duration(600)
			.attr('opacity', d => (d.source.screenName === 'CarlosHolmesTru' ? 1 : 0));
	}

	/**
	 * DATA FUNCTIONS
	 *
	 * Used to coerce the data into the
	 * formats we need to visualize
	 *
	 */

	function customYAxis(g) {
		g.call(yAxis);
		g.select('.domain').remove();
		g
			.selectAll('.tick:not(:first-of-type) line')
			.attr('stroke', '#777')
			.attr('stroke-dasharray', '2,2');
		g
			.selectAll('.tick text')
			.attr('x', 4)
			.attr('dy', -4);
	}

	function isFollower(node, targetScreenName, edges) {
		return (
			edges
				.filter(e => e.target.screenName === targetScreenName)
				.find(e => e.source.screenName === node.screenName) !== undefined
		);
	}

	function isFollowedBy(node, sourceScreenName, edges) {
		return (
			edges
				.filter(e => e.source.screenName === sourceScreenName)
				.find(e => e.target.screenName === node.screenName) !== undefined
		);
	}

	function countFollowing(candidate, edges) {
		return edges.filter(e => e.source.screenName === candidate.screenName).length;
	}

	function politicalX(candidate) {
		return x(candidate.politicalIndex);
	}

	function followingY(candidate, edges) {
		return y(countFollowing(candidate, edges));
	}

	function followersY(candidate, edges) {
		return y(countFollowers(candidate, edges));
	}

	function countFollowers(candidate, edges) {
		return edges.filter(e => e.target.screenName === candidate.screenName).length;
	}

	/**
	 * EVENT HANDLERS
	 *
	 * Used for interactions with various of the page elements
	 *
	 */

	/**
	 * activate -
	 *
	 * @param index - index of the activated section
	 */
	chart.activate = function(index) {
		activeIndex = index;
		let sign = activeIndex - lastIndex < 0 ? -1 : 1;
		let scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
		scrolledSections.forEach(function(i) {
			activateFunctions[i]();
		});
		lastIndex = activeIndex;
	};

	/**
	 * update
	 *
	 * @param index
	 * @param progress
	 */
	chart.update = function(index, progress) {
		updateFunctions[index](progress);
	};

	// return chart function
	return chart;
};

/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(data) {
	// create a new plot and
	// display it
	var plot = scrollVis();
	d3
		.select('#vis')
		.datum(data)
		.call(plot);

	// setup scroll functionality
	var scroll = scroller().container(d3.select('#graphic'));

	// pass in .step selection as the steps
	scroll(d3.selectAll('.step'));

	// setup event handling
	scroll.on('active', function(index) {
		// highlight current step text
		d3.selectAll('.step').style('opacity', function(d, i) {
			return i === index ? 1 : 0.1;
		});

		// activate current section
		plot.activate(index);
	});

	scroll.on('progress', function(index, progress) {
		d3
			.select('.tooltip')
			.transition()
			.duration(0)
			.style('opacity', 0);

		plot.update(index, progress);
	});
}

// const ROOT_URL = 'http://localhost:6001';
const ROOT_URL = 'https://api_twitter.fabioespinosa.com';

d3
	.queue()
	.defer(d3.json, `${ROOT_URL}/viz_retweets`)
	.defer(d3.json, `${ROOT_URL}/candidate_growth`)
	.awaitAll((error, results) => {
		results[1].forEach(candidato => {
			candidato.growth = candidato.growth.slice(27);
			for (var i = 0; i < candidato.growth.length; i++) {
				if (i === 0 || i === 1 || i === 2 || i === 3) {
					candidato.growth[i].cambio = 0;
				} else {
					candidato.growth[i].cambio = candidato.growth[i].count - candidato.growth[i - 2].count;
					// candidato.growth[i].cambio = candidato.growth[i].cambio < 0 ? 0 : candidato.growth[i].cambio;
				}
			}
			candidato.growth = candidato.growth.slice(4);
			candidato.growth.forEach(fecha_seguidores => {
				fecha_seguidores.date = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')(fecha_seguidores.date);
			});
		});

		display(results);
	});
