var margin = {top: 8, right: 10, bottom: 2, left: 10},
    width = 1280 - margin.left - margin.right,
    height = 69 - margin.top - margin.bottom;

var parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");
// var parseNow = d3.timeFormat("%a %b %d %Y %H:%M:%S GMT%Z (%Z)")
var parseMiau = d3.timeFormat("%Y-%m-%dT%H:%M:%S." + "000" + "Z");

var candidato = "ClaudiaLopez";

var url = "http://api_twitter.fabioespinosa.com/shady_tweets";

var x = d3.scaleTime()
    .range([0, width]);

var y = d3.scaleLinear()
    .range([height, 0]);

d3.json(url, function(error, data) {
  if (error) throw error;

  var tweets = [];
  var dates = [];
  var max_rets = [];
  var rets = 0;
  var count = 0;

  data.map( tweet => {
    if( count < 10 ) {
      tweets.push(tweet);
      var text = tweet.tweet_text;
      if( !text.startsWith("RT") ) {
        var retweets = tweet.Retweets;
        for( var i = 0; i < retweets.length; i++ ) {
          var ret = retweets[i];
          dates.push(parseDate(ret.created_at));
          rets++;
        }
        max_rets.push(rets);
        rets = 0;
      }
    }
    count++;
  });

  console.log(dates);
  var hoy = parseMiau(new Date());
  dates.push(parseDate(hoy));
  console.log(rets);

  x.domain([d3.min(dates), parseDate(hoy)]);
  console.log(d3.max(dates));

  y.domain(d3.extent(max_rets));

  var svg = d3.select("body").selectAll("svg")
      .data(tweets)
      .enter().append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .each(small);

  svg.append("text")
      .attr("x", width - 6)
      .attr("y", height - 6)
      .text(function(d) { return d.tweet_text });
});


function small(tweet) {
  console.log("Tweet: ", tweet);

  var svg = d3.select(this);

  var text = tweet.tweet_text;
  if( !text.startsWith("RT") ) {

    var retweets = tweet.Retweets;

    var n = new Date();
    var now = parseMiau(new Date());
    console.log(now);
    console.log(n);

    var ultimo = {
      created_at: now
    }
    console.log(ultimo);

    retweets.push({
      created_at: now
    });

    if( retweets != null ) {

      var count = 0;

      var nested = d3.nest()
          .key(function(d) { return parseDate(d.created_at); })
          .rollup(function (d) { count += d.length; return count; })
          .entries(retweets);

      console.log("Nested: ", nested);

      // var y = d3.scaleLinear()
      //     .domain([0, d3.max(nested, function(d) { return d.value; })])
      //     .range([height, 0]);

      var area = d3.area()
          .x(function(d) { return x(new Date(d.key)); })
          .y0(height)
          .y1(function(d) { return y(d.value); });

      var line = d3.line()
          .x(function(d) { return x(new Date(d.key)); })
          .y(function(d) { return y(d.value); });

      svg.append("path")
          .attr("class", "area")
          .attr("d", area(nested));

      svg.append("path")
          .attr("class", "line")
          .attr("d", line(nested));
    }
  }
}

function type(d) {
  d.price = +d.price;
  d.date = parseDate(d.date);
  return d;
}

// function cambiarCandidato(handler) {
//   candidato = handler;
//   url = "http://api_twitter.fabioespinosa.com/candidatos/" + candidato + "/tweets_recientes";
//   refresh();
// }
