/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
let scrollVis = function () {
    // constants to define the size
    // and margins of the vis area.
    let width = 750;
    let height = 600;
    let margin = {top: 100, left: 20, bottom: 40, right: 10};

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

    let colorScale = d3.scaleOrdinal()
        .range(['#FF5733', '#C70039', '#900C3F', '#581845']);
    // let colorScale = d3.scaleOrdinal().range(['#AFFFF9', '#102542', '#DAF7A6', '#581845']);

    //Parse date
    var parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");

    //X Axis
    var x = d3.scaleTime()
        .range([0, width]);

    //Y Axis
    var y = d3.scaleLinear()
        .range([height - 400, 0]);

    //Line
    var line = d3.line()
        .x(function (d) {
            return d.created_at;
        })
        .y(function (d) {
            return d.retweets;
        });

    const yAxis = d3.axisRight(y)
        .tickSize(width)
        .tickFormat(function (d) {
            let sub = y(d) - y.range()[1];
            return sub > 10
                ? "\xa0" + d
                : d + " total retweets";
        });

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

            svg.attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g');

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

        g.append("clipPath")
            .attr("id", "rectClip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);


        g.append('text')
            .attr('class', 'title vis-title')
            .attr('x', width / 2)
            .attr('y', height / 15)
            .text('¿QUIÉN USA BOTS?');

        g.append('text')
            .attr('class', 'sub-title vis-title')
            .attr('x', width / 2)
            .attr('y', (height / 15) + (height / 15))
            .text("Algunos candidatos hacen uso de bots para aumentar su popularidad");

        g.append('text')
            .attr('class', 'sub-title vis-title')
            .attr('x', width / 2)
            .attr('y', (height / 15) + (height / 20) + (height / 15))
            .text("en redes. Un indicio seguro de esto son picos extraños en la cantidad");

        g.append('text')
            .attr('class', 'sub-title vis-title')
            .attr('x', width / 2)
            .attr('y', (height / 15) + (height / 20) + (height / 20) + (height / 15))
            .attr('margin-bottom', '50px')
            .text("de retweets por segundo.");

        g.append('i')
            .text("de retweets por segundo.");

        g.selectAll('.vis-title')
            .attr('opacity', 0);

        g.append('g')
            .classed('y-axis', true)
            .attr('opacity', 0)
            .call(customYAxis);

        g.append('g')
            .classed('areas', true);

        colorScale.domain([rawData[1].id_tweet].concat(rawData[0].map(d => d.id_tweet)));

        setupSections(rawData);
    };

    var paintVis = function (tweet) {

        d3.select("#rectClip rect")
            .transition()
            .duration(0)
            //.attr("width", 0);
            .attr('height', 0);

        d3.select("#rectClip rect")
            .transition()
            .duration(600)
            //.attr("width", width);
            .attr("height", width);

        var retweets = tweet.Retweets;

        var count = 0;

        var nested = d3.nest()
            .key(function (d) {
                return parseDate(d.created_at);
            })
            .sortKeys((a, b) => new Date(a) - new Date(b))
            .entries(retweets);

        nested = nested.map(d => {
            count += d.values.length;
            return {key: d.key, value: count};
        }).filter(d => d.value <= 200);

        console.log(nested);

        var area = d3.area()
            .x(function (d) {
                return x(new Date(d.key));
            })
            .y0(height - 400)
            .y1(function (d) {
                return y(d.value);
            });

        y.domain(d3.extent(nested, function (d) {
            return d.value;
        }));
        x.domain(d3.extent(nested, function (d) {
            return new Date(d.key);
        }));

        g.selectAll('.vis-title')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.selectAll('.step .title')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        let areas = g.select('.areas')
            .selectAll('.area')
            .data([nested]);


        let areasE = areas.enter()
            .append('path')
            .classed('area', true);

        areas.merge(areasE)
            .transition()
            .duration(0)
            .attr("clip-path", "url(#rectClip)")
            .attr("fill", () => colorScale(tweet.id_tweet))
            .attr("stroke", "none")
            .attr("d", area)
            .attr('opacity', 1);

        g.select('.y-axis')
            .raise()
            .transition()
            .duration(600)
            .attr('opacity', 1)
            .call(customYAxis);


    };

    /**
     * setupSections - each section is activated
     * by a separate function. Here we associate
     * these functions to the sections based on
     * the section's index.
     *
     */
    var setupSections = function (rawData) {
        // activateFunctions are called each
        // time the active section changes
        activateFunctions[0] = showTitle;
        activateFunctions[1] = paintVis.bind(this, rawData[1]);
        activateFunctions[2] = paintVis.bind(this, rawData[0][0]);
        activateFunctions[3] = paintVis.bind(this, rawData[0][1]);
        activateFunctions[4] = paintVis.bind(this, rawData[0][2]);


        // updateFunctions are called while
        // in a particular section to update
        // the scroll progress in that section.
        // Most sections do not need to be updated
        // for all scrolling and so are set to
        // no-op functions.
        for (var i = 0; i < 5; i++) {
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
        //Hide vis
        g.select('.line')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        g.select('.area')
            .transition()
            .duration(0)
            .attr('opacity', 0);

        //Show title
        g.selectAll('.vis-title')
            .transition()
            .duration(600)
            .attr('opacity', 1.0);

        g.select('.y-axis')
            .transition()
            .duration(0)
            .attr('opacity', 0);
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
        g.selectAll(".tick line")
            .attr("stroke", "#e0e0e0")
            .attr("stroke-dasharray", "2,2")
            .attr("opacity", 0.5);
        g.selectAll(".tick text")
            .attr("x", 4)
            .attr("dy", -4)
            .attr("fill", "#000")
            .attr('transform', 'translate(-20)')
            .attr('font-size', '8px');
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
        d3.selectAll('.step .title')
            .style('opacity', function (d, i) {
                return i === index ? 1 : 0;
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

//API URL
var url = "http://api_twitter.fabioespinosa.com/shady_tweets";

d3.queue()
    .defer(d3.json, url)
    .defer(d3.json, "http://api_twitter.fabioespinosa.com/tweet/936590455856357376")
    .awaitAll((error, results) => {
        display(results);
    });
