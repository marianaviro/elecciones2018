/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
let scrollVis = function () {
    // constants to define the size
    // and margins of the vis area.
    let width = 710;
    let height = 500;
    let margin = {top: 0, left: 20, bottom: 40, right: 10};
    let mainNodeR = 27;
    let neighNodeR = 20;
    let nodeR = 15;

    let exploring = false;

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

    //Node tooltip
    const tooltipDiv = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    const x = d3.scaleLinear()
    //.padding(0.5)
        .range([50, width - 50])
        .domain([0, 100]);

    const y = d3.scaleLinear()
    //.padding(0.5)
        .range([height - 50, 50]);

    const yAxis = d3.axisRight(y)
        .tickSize(width)
        .tickFormat(function (d) {
            return this.parentNode.nextSibling
                ? "\xa0" + d
                : d + " seguidores";
        });

    const simulation = d3.forceSimulation()
        .force('link', d3.forceLink()
            .id(d => d.screenName));

    /**
     * chart
     *
     * @param selection - the current d3 selection(s)
     *  to draw the visualization in. For this
     *  example, we will be drawing it in #vis
     */
    var chart = function (selection) {
        selection.each(function (rawData) {
            // create svg and give it a width and height
            svg = d3.select(this)
                .selectAll('svg')
                .data([0]);
            var svgE = svg.enter()
                .append('svg');
            // @v4 use merge to combine enter and existing selection
            svg = svg.merge(svgE);

            svg.append('defs')
                .append('filter')
                .attr('id', 'greyscale')
                .append('feColorMatrix')
                .attr('type', 'matrix')
                .attr('values', `0 1 0 0 0
                  0 1 0 0 0
                  0 1 0 0 0
                  0 1 0 1 0 `);

            svg.select('defs')
                .append('marker')
                .attrs({'id':'arrowhead',
                    'viewBox':'-0 -5 10 10',
                    'refX':30,
                    'refY':0,
                    'orient':'auto',
                    'markerWidth':13,
                    'markerHeight':13,
                    'xoverflow':'visible'})
                .append('svg:polyline')
                .attr('points', '0,-2 4,0 0,2')
                .attr('stroke', 'black')
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round')
                .attr('fill', 'none')
                .attr('stroke-width', 1);

            svg.attr('width', width + margin.left + margin.right);
            svg.attr('height', height + margin.top + margin.bottom);

            svg.append('g');

            // this group element will be used to contain all
            // other elements.
            g = svg.select('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

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
    var setupVis = function (rawData) {

        const graphNodes = rawData[0];
        const edges = rawData[1];

        // count openvis title
        g.append('text')
            .attr('class', 'title vis-title')
            .attr('x', width / 2)
            .attr('y', height / 5)
            .text('¿QUIÉN SIGUE A QUIÉN?');

        g.append('text')
            .attr('class', 'sub-title vis-title')
            .attr('x', width / 2)
            .attr('y', (height / 5) + (height / 10))
            .text('Las redes entre los candidatos');

        g.selectAll('.vis-title')
            .attr('opacity', 0);

        simulation
            .nodes(graphNodes);
        //.on('tick', ticked);

        simulation.force('link')
            .links(edges);

        y.domain([d3.min(graphNodes, n => countFollowers(n, edges)), d3.max(graphNodes, n => countFollowers(n, edges))]);

        g.append('g')
            .classed('y-axis', true)
            .attr('opacity', 0)
            .call(customYAxis);

        //graph links
        let links = g.append('g')
            .classed('links', true)
            .selectAll('line')
            .data(edges);

        const linksE = links.enter()
            .append('line')
            .classed('link', true);

        links = links.merge(linksE)
            .style('stroke', 'black')
            .attr('stroke-width', 1)
            .attr('opacity', 0)
            .attr('marker-end', 'url(#arrowhead)')
            .attr('x1', d => politicalX(d.source))
            .attr('y1', d => followersY(d.source, edges))
            .attr('x2', d => politicalX(d.target))
            .attr('y2', d => followersY(d.target, edges));

        let nodes = g.append('g')
            .classed('nodes', true)
            .selectAll('.node')
            .data(graphNodes, d => d.screenName);

        const nodesE = nodes.enter()
            .append('g')
            .attr('id', d => d.screenName)
            .classed('node', true);

        nodes = nodes.merge(nodesE)
            .attr('transform', d => `translate(${politicalX(d)}, ${y(countFollowers(d, edges))})`);

        nodes
            .append('image')
            .attr('opacity', 0)
            .attr('xlink:href', d => d.img.replace('normal', 'bigger'))
            .attr('x', 0 - nodeR)
            .attr('y', 0 - nodeR)
            .attr('width', nodeR * 2)
            .attr('height', nodeR * 2);

        setupSections(graphNodes, edges);

    };

    /**
     * setupSections - each section is activated
     * by a separate function. Here we associate
     * these functions to the sections based on
     * the section's index.
     *
     */
    var setupSections = function (graphNodes, edges) {
        // activateFunctions are called each
        // time the active section changes
        activateFunctions[0] = showTitle;
        activateFunctions[1] = showGraph.bind(this, edges);
        activateFunctions[2] = highlightTimoAndRamos.bind(this, edges);
        activateFunctions[3] = highlightRobledo.bind(this, edges);
        activateFunctions[4] = highlightMlucia.bind(this, graphNodes, edges);
        activateFunctions[5] = changeAxisToFollowers.bind(this, graphNodes, edges);
        activateFunctions[6] = highlightVargas;
        activateFunctions[7] = highlightHolmes.bind(this, graphNodes, edges);
        activateFunctions[8] = explore.bind(this, graphNodes, edges);

        // updateFunctions are called while
        // in a particular section to update
        // the scroll progress in that section.
        // Most sections do not need to be updated
        // for all scrolling and so are set to
        // no-op functions.
        for (var i = 0; i < 9; i++) {
            updateFunctions[i] = function () {
            };
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

        //Hide tooltip
        tooltipDiv.transition()
            .duration(0)
            .style('opacity', 0);

        //Hide graph
        g.select('.y-axis')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.link')
            .on('mouseover', null)
            .on('mouseout', null)
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.node')
            .on('mouseover', null)
            .on('mouseout', null)
            .select('image')
            .transition(0)
            .duration(600)
            .attr('opacity', 0);

        //Show title
        g.selectAll('.vis-title')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);

    }

    function showGraph(edges) {

        exploring = true;

        //Hide tooltip
        tooltipDiv.transition()
            .duration(0)
            .style('opacity', 0);

        //Hide title
        g.selectAll('.vis-title')
            .transition()
            .duration(600)
            .attr('opacity', 0);

        //Hide links
        g.selectAll('.link')
            .transition()
            .duration(600)
            .attr('opacity', 0);

        //Show nodes
        g.selectAll('.node')
            .on('mouseover', (d, i, nodes) => onMouseOverFollowingGraph(d, i, nodes, edges))
            .on('mouseout', onMouseOutFollowersGraph)
            .select('image')
            .classed('greyed', false)
            .transition()
            .duration(600)
            .attr('opacity', 1)
            .attr('x', 0 - nodeR)
            .attr('y', 0 - nodeR)
            .attr('width', nodeR * 2)
            .attr('height', nodeR * 2);

        //Show axis
        g.select('.y-axis')
            .transition()
            .duration(600)
            .attr('opacity', 1);
    }

    function highlightTimoAndRamos(edges) {

        exploring = false;

        //Hide tooltip
        tooltipDiv.transition()
            .duration(0)
            .style('opacity', 0);

        // Higlight TimoFARC
        g.selectAll('.node')
            .filter(d => d.screenName === 'TimoFARC' || d.screenName === 'LuisAlfreRamos')
            .on('mouseover', (d) => onMouseOverPresenting(d))
            .on('mouseout', () => onMouseOutPresenting())
            .select('image')
            .classed('greyed', false)
            .transition()
            .duration(600)
            .attr('x', 0 - mainNodeR)
            .attr('y', 0 - mainNodeR)
            .attr('width', mainNodeR * 2)
            .attr('height', mainNodeR * 2)
            .attr('opacity', 1);

        //Highlight TimoFARC followers
        g.selectAll('.node')
            .filter(d => isFollower(d, 'TimoFARC', edges) || isFollower(d, 'LuisAlfreRamos', edges))
            .on('mouseover', (d) => onMouseOverPresenting(d))
            .on('mouseout', () => onMouseOutPresenting())
            .select('image')
            .classed('greyed', false)
            .transition()
            .duration(600)
            .attr('x', 0 - neighNodeR)
            .attr('y', 0 - neighNodeR)
            .attr('width', neighNodeR * 2)
            .attr('height', neighNodeR * 2)
            .attr('opacity', 1);

        //Hide others
        g.selectAll('.node')
            .filter(d => !isFollower(d, 'TimoFARC', edges) && !isFollower(d, 'LuisAlfreRamos', edges))
            .filter(d => d.screenName !== 'TimoFARC' && d.screenName !== 'LuisAlfreRamos')
            .on('mouseover', null)
            .on('mouseout', null)
            .select('image')
            .classed('greyed', true)
            .transition()
            .duration(600)
            .attr('x', 0 - nodeR)
            .attr('y', 0 - nodeR)
            .attr('width', nodeR * 2)
            .attr('height', nodeR * 2)
            .attr('opacity', 0.7);

        //Highlight TimoFARC links
        g.selectAll('.link')
            .transition()
            .duration(600)
            .attr('opacity', d => d.target.screenName === 'TimoFARC' || d.target.screenName === 'LuisAlfreRamos' ? 1 : 0);

        g.select('.y-axis')
            .transition()
            .duration(600)
            .attr('opacity', 1);

    }

    function highlightRobledo(edges) {

        //Hide tooltip
        tooltipDiv.transition()
            .duration(0)
            .style('opacity', 0);

        // Higlight JERobledo
        higlightNodeAndFollowers('JERobledo', edges);

        g.select('.y-axis')
            .transition()
            .duration(600)
            .attr('opacity', 1);

    }

    function highlightMlucia(graphNodes, edges) {

        exploring = false;

        //Hide tooltip
        tooltipDiv.transition()
            .duration(0)
            .style('opacity', 0);

        //Reset Y-Axis
        y.domain([d3.min(graphNodes, d => countFollowers(d, edges)), d3.max(graphNodes, d => countFollowers(d, edges))]);

        yAxis.tickFormat(function (d) {
            return d !== d3.max(graphNodes, d => countFollowers(d, edges))
                ? "\xa0" + d
                : d + " seguidores";
        });

        g.select('.y-axis')
            .transition()
            .duration(600)
            .call(customYAxis);

        //Replace nodes and edges
        g.selectAll('.node')
            .transition()
            .duration(600)
            .attr('transform', d => `translate(${politicalX(d)}, ${followersY(d, edges)})`);

        g.selectAll('.link')
            .transition()
            .duration(0)
            .attr('opacity', 0)
            .attr('x1', d => politicalX(d.source))
            .attr('y1', d => followersY(d.source, edges))
            .attr('x2', d => politicalX(d.target))
            .attr('y2', d => followersY(d.target, edges));

        higlightNodeAndFollowers('mluciaramirez', edges);

        g.select('.y-axis')
            .transition()
            .duration(600)
            .attr('opacity', 1);
    }

    function changeAxisToFollowers(graphNodes, edges) {

        exploring = true;

        //Hide tooltip
        tooltipDiv.transition()
            .duration(0)
            .style('opacity', 0);

        // Restore all
        g.selectAll('.node image')
            .classed('greyed', false)
            .transition()
            .duration(0)
            .attr('x', 0 - nodeR)
            .attr('y', 0 - nodeR)
            .attr('width', nodeR * 2)
            .attr('height', nodeR * 2)
            .attr('opacity', nodeR * 2);

        //Hide all links
        g.selectAll('.link')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        y.domain([d3.min(graphNodes, d => countFollowing(d, edges)), d3.max(graphNodes, d => countFollowing(d, edges))]);

        yAxis.tickFormat(function (d) {
            return this.parentNode.nextSibling
                ? "\xa0" + d
                : d + " siguiendo";
        });

        g.select('.y-axis')
            .transition()
            .duration(600)
            .attr('opacity', 1)
            .call(customYAxis);

        g.selectAll('.node')
            .on('mouseover', (d, i, nodes) => onMouseOverFollowingGraph(d, i, nodes, edges))
            .on('mouseout', onMouseOutFollowersGraph)
            .transition()
            .duration(600)
            .attr('transform', d => `translate(${politicalX(d)}, ${followingY(d, edges)})`);

        g.selectAll('.link')
            .transition()
            .duration(0)
            .attr('opacity', 0)
            .attr('x1', d => politicalX(d.source))
            .attr('y1', d => followingY(d.source, edges))
            .attr('x2', d => politicalX(d.target))
            .attr('y2', d => followingY(d.target, edges));
    }

    function highlightVargas() {
        exploring = false;
        //Hide tooltip
        tooltipDiv.transition()
            .duration(0)
            .style('opacity', 0);

        highlightNodeAndFollowing('German_Vargas', []);
    }

    function highlightHolmes(graphNodes, edges) {

        exploring = false;

        //Hide tooltip
        tooltipDiv.transition()
            .duration(0)
            .style('opacity', 0);

        //Reset axis
        y.domain([d3.min(graphNodes, d => countFollowing(d, edges)), d3.max(graphNodes, d => countFollowing(d, edges))]);

        yAxis.tickFormat(function (d) {
            return this.parentNode.nextSibling
                ? "\xa0" + d
                : d + " siguiendo";
        });

        g.select('.y-axis')
            .transition()
            .duration(600)
            .attr('opacity', 1)
            .call(customYAxis);

        //Move nodes and links
        g.selectAll('.node')
            .transition()
            .duration(600)
            .attr('transform', d => `translate(${politicalX(d)}, ${followingY(d, edges)})`);

        g.selectAll('.link')
            .transition()
            .duration(0)
            .attr('opacity', 0)
            .attr('x1', d => politicalX(d.source))
            .attr('y1', d => followingY(d.source, edges))
            .attr('x2', d => politicalX(d.target))
            .attr('y2', d => followingY(d.target, edges));

        highlightNodeAndFollowing('CarlosHolmesTru', edges);
    }

    function explore(graphNodes, edges) {

        exploring = true;

        //Hide tooltip
        tooltipDiv.transition()
            .duration(0)
            .style('opacity', 0);

        d3.select('#following_button')
            .on('click', () => onClickFollowing(graphNodes, edges));

        d3.select('#followers_button')
            .on('click', () => onClickFollowers(graphNodes, edges));

        //Reset all images
        g.selectAll('.node image')
            .classed('greyed', false)
            .transition()
            .duration(0)
            .attr('x', 0 - nodeR)
            .attr('y', 0 - nodeR)
            .attr('width', nodeR * 2)
            .attr('height', nodeR * 2)
            .attr('opacity', 1);

        //Hide all links
        g.selectAll('.link')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        //Reset Y-Axis
        y.domain([d3.min(graphNodes, d => countFollowers(d, edges)), d3.max(graphNodes, d => countFollowers(d, edges))]);

        yAxis.tickFormat(function (d) {
            return d !== d3.max(graphNodes, d => countFollowers(d, edges))
                ? "\xa0" + d
                : d + " seguidores";
        });

        g.select('.y-axis')
            .transition()
            .duration(600)
            .attr('opacity', 1)
            .call(customYAxis);

        g.selectAll('.node')
            .on('mouseover', (d, i, nodes) => onMouseOverFollowersGraph(d, i, nodes, edges))
            .on('mouseout', (d, i, nodes) => onMouseOutFollowersGraph(d, i, nodes))
            .transition()
            .duration(600)
            .attr('transform', d => `translate(${politicalX(d)}, ${followersY(d, edges)})`);

        g.selectAll('.link')
            .transition()
            .duration(0)
            .attr('opacity', 0)
            .attr('x1', d => politicalX(d.source))
            .attr('y1', d => followersY(d.source, edges))
            .attr('x2', d => politicalX(d.target))
            .attr('y2', d => followersY(d.target, edges));

    }

    function higlightNodeAndFollowers(screenName, edges) {
        console.log(`exploring is ${exploring}`);
        // Higlight node
        g.selectAll('.node')
            .filter(d => d.screenName === screenName)
            .on('mouseover', (d, i, nodes) => exploring ? onMouseOverFollowersGraph(d, i, nodes, edges) : onMouseOverPresenting(d))
            .on('mouseout', (d, i, nodes) => exploring ? onMouseOutFollowersGraph(d, i, nodes) : onMouseOutPresenting())
            .raise()
            .select('image')
            .classed('greyed', false)
            .transition()
            .duration(600)
            .attr('x', 0 - mainNodeR)
            .attr('y', 0 - mainNodeR)
            .attr('width', mainNodeR * 2)
            .attr('height', mainNodeR * 2)
            .attr('opacity', 1);

        //Highlight following
        g.selectAll('.node')
            .filter(d => isFollower(d, screenName, edges))
            .on('mouseover', (d, i, nodes) => exploring ? onMouseOverFollowersGraph(d, i, nodes, edges) : onMouseOverPresenting(d))
            .on('mouseout', (d, i, nodes) => exploring ? onMouseOutFollowersGraph(d, i, nodes) : onMouseOutPresenting())
            .select('image')
            .classed('greyed', false)
            .transition()
            .duration(600)
            .attr('x', 0 - neighNodeR)
            .attr('y', 0 - neighNodeR)
            .attr('width', neighNodeR * 2)
            .attr('height', neighNodeR * 2)
            .attr('opacity', 1);

        //Hide others
        g.selectAll('.node')
            .filter(d => !isFollower(d, screenName, edges))
            .filter(d => d.screenName !== screenName)
            .on('mouseover',  (d, i, nodes) => exploring ? onMouseOverFollowersGraph(d, i, nodes, edges) : null)
            .on('mouseout', (d, i, nodes) => exploring ? onMouseOutFollowersGraph(d, i, nodes) : null)
            .select('image')
            .classed('greyed', true)
            .transition()
            .duration(600)
            .attr('x', 0 - nodeR)
            .attr('y', 0 - nodeR)
            .attr('width', nodeR * 2)
            .attr('height', nodeR * 2)
            .attr('opacity', 0.7);

        //Highlight links
        g.selectAll('.link')
            .transition()
            .duration(600)
            .attr('opacity', d => d.target.screenName === screenName ? 1 : 0);
    }

    function highlightNodeAndFollowing(screenName, edges) {
        // Higlight node
        console.log(`exploring is ${exploring}`);
        g.selectAll('.node')
            .filter(d => d.screenName === screenName)
            .on('mouseover', (d, i, nodes) => exploring ? onMouseOverFollowingGraph(d, i, nodes, edges) : onMouseOverPresenting(d))
            .on('mouseout', (d, i, nodes) => exploring ? onMouseOutFollowersGraph(d, i, nodes) : onMouseOutPresenting())
            .raise()
            .select('image')
            .classed('greyed', false)
            .transition()
            .duration(600)
            .attr('x', 0 - mainNodeR)
            .attr('y', 0 - mainNodeR)
            .attr('width', mainNodeR * 2)
            .attr('height', mainNodeR * 2)
            .attr('opacity', 1);

        //Highlight following
        g.selectAll('.node')
            .filter(d => isFollowedBy(d, screenName, edges))
            .on('mouseover', (d, i, nodes) => exploring ? onMouseOverFollowingGraph(d, i, nodes, edges) : onMouseOverPresenting(d))
            .on('mouseout', (d, i, nodes) => exploring ? onMouseOutFollowersGraph(d, i, nodes) : onMouseOutPresenting())
            .select('image')
            .classed('greyed', false)
            .transition()
            .duration(600)
            .attr('x', 0 - neighNodeR)
            .attr('y', 0 - neighNodeR)
            .attr('width', neighNodeR * 2)
            .attr('height', neighNodeR * 2)
            .attr('opacity', 1);

        //Hide others
        g.selectAll('.node')
            .filter(d => !isFollowedBy(d, screenName, edges))
            .filter(d => d.screenName !== screenName)
            .on('mouseover',  (d, i, nodes) => exploring ? onMouseOverFollowingGraph(d, i, nodes, edges) : null)
            .on('mouseout', (d, i, nodes) => exploring ? onMouseOutFollowersGraph(d, i, nodes) : null)
            .select('image')
            .classed('greyed', true)
            .transition()
            .duration(600)
            .attr('x', 0 - nodeR)
            .attr('y', 0 - nodeR)
            .attr('width', nodeR * 2)
            .attr('height', nodeR * 2)
            .attr('opacity', 0.7);

        //Highlight links
        g.selectAll('.link')
            .transition()
            .duration(600)
            .attr('opacity', d => d.source.screenName === screenName ? 1 : 0);
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
        g.select(".domain")
            .remove();
        g.selectAll(".tick:not(:first-of-type) line")
            .attr("stroke", "#777")
            .attr("stroke-dasharray", "2,2");
        g.selectAll(".tick text")
            .attr("x", 4)
            .attr("dy", -4);
    }

    function isFollower(node, targetScreenName, edges) {
        return edges
            .filter(e => e.target.screenName === targetScreenName)
            .find(e => e.source.screenName === node.screenName) !== undefined;
    }

    function isFollowedBy(node, sourceScreenName, edges) {
        return edges
            .filter(e => e.source.screenName === sourceScreenName)
            .find(e => e.target.screenName === node.screenName) !== undefined;
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

    function onClickFollowers(graphNodes, edges) {
        //Reset all images
        g.selectAll('.node image')
            .classed('greyed', false)
            .transition()
            .duration(0)
            .attr('x', 0 - nodeR)
            .attr('y', 0 - nodeR)
            .attr('width', nodeR * 2)
            .attr('height', nodeR * 2)
            .attr('opacity', 1);

        //Hide all links
        g.selectAll('.link')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        //Reset Y-Axis
        y.domain([d3.min(graphNodes, d => countFollowers(d, edges)), d3.max(graphNodes, d => countFollowers(d, edges))]);

        yAxis.tickFormat(function (d) {
            return d !== d3.max(graphNodes, d => countFollowers(d, edges))
                ? "\xa0" + d
                : d + " seguidores";
        });

        g.select('.y-axis')
            .transition()
            .duration(600)
            .attr('opacity', 1)
            .call(customYAxis);

        g.selectAll('.node')
            .on('mouseover', (d, i, nodes) => onMouseOverFollowersGraph(d, i, nodes, edges))
            .on('mouseout', onMouseOutFollowersGraph)
            .transition()
            .duration(600)
            .attr('transform', d => `translate(${politicalX(d)}, ${followersY(d, edges)})`);

        g.selectAll('.link')
            .transition()
            .duration(0)
            .attr('opacity', 0)
            .attr('x1', d => politicalX(d.source))
            .attr('y1', d => followersY(d.source, edges))
            .attr('x2', d => politicalX(d.target))
            .attr('y2', d => followersY(d.target, edges));
    }

    function onClickFollowing(graphNodes, edges) {
        //Reset axis
        console.log('hey');
        y.domain([d3.min(graphNodes, d => countFollowing(d, edges)), d3.max(graphNodes, d => countFollowing(d, edges))]);

        yAxis.tickFormat(function (d) {
            return this.parentNode.nextSibling
                ? "\xa0" + d
                : d + " siguiendo";
        });

        g.select('.y-axis')
            .transition()
            .duration(600)
            .attr('opacity', 1)
            .call(customYAxis);

        g.selectAll('.node')
            .on('mouseover', (d, i, nodes) => onMouseOverFollowingGraph(d, i, nodes, edges))
            .on('mouseout', onMouseOutFollowersGraph)
            .transition()
            .duration(600)
            .attr('transform', d => `translate(${politicalX(d)}, ${followingY(d, edges)})`);

        g.selectAll('.link')
            .transition()
            .duration(0)
            .attr('opacity', 0)
            .attr('x1', d => politicalX(d.source))
            .attr('y1', d => followingY(d.source, edges))
            .attr('x2', d => politicalX(d.target))
            .attr('y2', d => followingY(d.target, edges));
    }

    function onMouseOverFollowersGraph(d, i, nodes, edges) {

        tooltipDiv.transition()
            .duration(200)
            .style('opacity', 0.7);
        tooltipDiv.html(`${d.name}`)
            .style('left', d3.event.pageX + 'px')
            .style('top', d3.event.pageY + 'px');

        higlightNodeAndFollowers(d.screenName, edges);
    }

    function onMouseOverPresenting(d) {
        tooltipDiv.transition()
            .duration(200)
            .style('opacity', 0.7);
        tooltipDiv.html(`${d.name}`)
            .style('left', d3.event.pageX + 'px')
            .style('top', d3.event.pageY + 'px');
    }

    function onMouseOverFollowingGraph(d, i, nodes, edges) {

        tooltipDiv.transition()
            .duration(200)
            .style('opacity', 0.7);
        tooltipDiv.html(`${d.name}`)
            .style('left', d3.event.pageX + 'px')
            .style('top', d3.event.pageY + 'px');

        highlightNodeAndFollowing(d.screenName, edges);
    }

    function onMouseOutFollowersGraph(d, i, nodes) {

        console.log('out');

        tooltipDiv.transition()
            .duration(200)
            .style('opacity', 0);

        //Hide all links
        g.selectAll('.link')
            .transition()
            .duration(200)
            .attr('opacity', 0);

        //Reset Images
        g.selectAll('.node image')
            .classed('greyed', false)
            .transition()
            .duration(200)
            .attr('x', 0 - nodeR)
            .attr('y', 0 - nodeR)
            .attr('width', nodeR * 2)
            .attr('height', nodeR *2)
            .attr('opacity', 1);

    }

    function onMouseOutPresenting() {
        tooltipDiv.transition()
            .duration(200)
            .style('opacity', 0);
    }

    /**
     * activate -
     *
     * @param index - index of the activated section
     */
    chart.activate = function (index) {
        activeIndex = index;
        let sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
        let scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
        scrolledSections.forEach(function (i) {
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
    chart.update = function (index, progress) {
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
    d3.select('#vis')
        .datum(data)
        .call(plot);

    // setup scroll functionality
    var scroll = scroller()
        .container(d3.select('#graphic'));

    // pass in .step selection as the steps
    scroll(d3.selectAll('.step'));

    // setup event handling
    scroll.on('active', function (index) {

        // highlight current step text
        d3.selectAll('.step')
            .style('opacity', function (d, i) {
                return i === index ? 1 : 0.1;
            });

        // activate current section
        plot.activate(index);
    });

    scroll.on('progress', function (index, progress) {
        d3.select('.tooltip')
            .transition()
            .duration(0)
            .style('opacity', 0);

        plot.update(index, progress);
    });
}

d3.queue()
    .defer(d3.json, 'data/candidates.json')
    .defer(d3.json, 'data/candidates_friendships.json')
    .awaitAll((error, results) => {
        display(results);
    });
