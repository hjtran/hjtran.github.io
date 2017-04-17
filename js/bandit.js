
// Define distribution functions which take in a mu
// and sample from a distribution bounded by [0,1]
var FIXEDALPHA = 1;
function sampleBetaFixedAlpha(mu) {
    var beta = (1-mu)*(FIXEDALPHA/mu);
    return jStat.beta.sample(FIXEDALPHA, beta);
}

// Define bandit strategies as classes that take in
// a series of mus (equal to the num of bandits) and 
// a distribution function to sample from (defined above).
// Mus should all be [0,1].
// Each bandit then maintains a state and has a function
// getNextAction() which returns what action the strat
// chooses next
function optimalStrategy(mus,distr) {
    this.mus = mus;
    this.distr = distr;
    this.bestAction = mus.indexOf(Math.max.apply(null,mus));
}

optimalStrategy.prototype.getNextAction = function() {
    var ret = [];
    ret.action = this.bestAction;
    ret.reward = this.distr(this.mus[this.bestAction]);
    return ret;
}

function worstStrategy(mus,distr) {
    this.mus = mus;
    this.distr = distr;
    this.worstAction = mus.indexOf(Math.min.apply(null,mus));
}

worstStrategy.prototype.getNextAction = function() {
    var ret = [];
    ret.action = this.worstAction;
    ret.reward = this.distr(this.mus[this.worstAction]);
    return ret;
}

function UCB1Strategy(mus,distr) {
    this.distr = distr;
    this.K = mus.length;
    this.sampleMus = [];
    this.actionCounts = [];
    this.UCB = []; // Upper confidence bounds
    this.t = 0;
    this.mus = mus;
}

UCB1Strategy.prototype.getNextAction = function() {
    var ret = [];
    if (this.t < this.K) {
        ret.action = this.t;
        ret.reward = this.distr(this.mus[ret.action]);
        this.sampleMus.push(ret.reward); // TODO: check this
        this.actionCounts.push(1);
        this.UCB.push(0);
    } else {
        ret.action = this.UCB.indexOf(Math.max.apply(null,this.UCB));
        ret.reward = this.distr(this.mus[ret.action]);
        this.sampleMus[ret.action] = ((this.sampleMus[ret.action]*this.actionCounts[ret.action])+ret.reward)/(this.actionCounts[ret.action]+1);
        this.actionCounts[ret.action] += 1;
    }
    this.t += 1;
    for (var i = 0; i < this.UCB.length; i++) {
        this.UCB[i] = this.sampleMus[i] + Math.sqrt(2*Math.log(this.t)/this.actionCounts[i]);
    }
    return ret;
}

function epsilonGreedyStrategy(mus,distr,epsilon) {
    this.distr = distr;
    this.K = mus.length;
    this.sampleMus = [0,0,0,0,0]; // TODO: make this dynamic
    this.actionCounts = [0,0,0,0,0];
    this.t = 0;
    this.mus = mus;
    this.epsilon = epsilon;
}

epsilonGreedyStrategy.prototype.getNextAction = function() {
    var ret = [];
    if (jStat.uniform.sample(0,1) > this.episolon) {
        ret.action = this.sampleMus.indexOf(Math.max.apply(this.sampleMus));
        ret.reward = this.distr(this.mus[ret.action]);
        this.sampleMus[ret.action] = ((this.sampleMus[ret.action]*this.actionCounts[ret.action])+ret.reward)/(this.actionCounts[ret.action]+1);
        this.actionCounts[ret.action] += 1;
    } else {
        ret.action = this.sampleMus.indexOf(Math.max.apply(this.sampleMus));
        var r = Math.floor(Math.random() * this.sampleMus.length);
        while (r == ret.action) {r = Math.floor(Math.random() * myArray.length);}
        ret.action = r;
        ret.reward = this.distr(this.mus[ret.action]);
        this.sampleMus[ret.action] = ((this.sampleMus[ret.action]*this.actionCounts[ret.action])+ret.reward)/(this.actionCounts[ret.action]+1);
        this.actionCounts[ret.action] += 1;
    }
    return ret;
}



var DEFAULT_PARAMS = {
    mus:[0.3,0.4,0.8,0.6,0.5],
    speed:1.00,
    strats:[UCB1Strategy,optimalStrategy,worstStrategy],
    plotview:'cum_reward'
}
var vizParams = DEFAULT_PARAMS;

// Scatterplot Adapted from Michele Weigle's simple example: http://bl.ocks.org/weiglemc/6185069

var margin = {top: 200, right: 20, bottom: 30, left: 75},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
var axesDataMargin = {top: 4.5, right: 0.5, bottom: 0.5, left:0.5}

// create canvas
d3.select('body').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

var banditPanel = d3.select('svg')
    .append('g')

var blocks = banditPanel.selectAll('g')
    .data(vizParams.mus)

var enterBlocks = blocks
    .enter()
    .append('g')
    .attr('class','bandit')
    .attr('transform',function(d,i) {return 'translate(' +(35+margin.left+i*200) + ',' + margin.top/4 + ')';})

enterBlocks
    .append('circle')
    .attr('r',30)
    .attr('fill','white')
    .attr('stroke','steelblue')
    .attr('stroke-width',3)
    .on('click', function(d,i) {
        var ret = [];
        ret.action = i;
        ret.reward = sampleBetaFixedAlpha(d);
        data.payoffs[0].push(data.payoffs[0][data.payoffs[0].length-1]+ret.reward*100);
        banditPanel.select('g:nth-child(' + (ret.action+1) + ') circle').attr('fill','green').transition().duration(speed-10).attr('fill','white')
        if (lastActions.length >= 1000){
            actionFreqs[lastActions.shift()] -= 1;
            lastActions.push(ret.action);
            actionFreqs[ret.action] += 1;
        } else {
            lastActions.push(ret.action);
            actionFreqs[ret.action] += 1;
        }
        banditPanel.selectAll('rect')
            .data(actionFreqs)
            .attr('height',function(d){return (d/actionFreqs.reduce(add,0))*100;})
        var ret = o.getNextAction();
        data.payoffs[1].push(data.payoffs[1][data.payoffs[1].length-1]+ret.reward*100);
        var ret = w.getNextAction();
        data.payoffs[2].push(data.payoffs[2][data.payoffs[2].length-1]+ret.reward*100);
        var ret = e.getNextAction();
        data.payoffs[3].push(data.payoffs[3][data.payoffs[3].length-1]+ret.reward*100);
        updateData();

        banditPanel.select('g:nth-child(' + (i+1) + ')').append('text').text('$' + Math.round(ret.reward*100))
            .attr('transform','translate(-5,-10)')
            .transition()
            .duration(500)
            .attr('transform','translate(-5,-35)')
            .transition()
            .duration(500)
            .attr('opacity',0)
            .remove()

    });



var labs = ['A', 'B', 'C', 'D', 'E'];
enterBlocks.append('text')
    .attr('dx', -7)
    .attr('dy', 4)
    .text(function(d,i) { return labs[i]; });

activate = function(){
    blocks.selectAll('circle')
    .attr('fill','steelblue')
    .transition()
    .duration(200)
    .attr('fill','white')
}

var svg = d3.select('svg')
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')



// setup x
var xValue = function(d) { return d.x; },
    xScale = d3.scale.linear().range([0, width]),
    xMap = function(d) { return xScale(xValue(d));},
    xAxis = d3.svg.axis().scale(xScale).orient('bottom');

// setup y
var yValue = function(d) { return d.y; },
    yScale = d3.scale.linear().range([height, 0]),
    yMap = function(d) { return yScale(yValue(d));},
    yAxis = d3.svg.axis().scale(yScale).orient('left');

// x-axis
svg.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
.append("text")
	.attr("class", "label")
	.attr("x", width)
	.attr("y", -6)
	.style("text-anchor", "end")
	.text("t");

// y-axis
svg.append("g")
	.attr("class", "y axis")
.append("text")
	.attr("class", "label mainYLabel")
	.attr("transform", "rotate(-90)")
	.attr("y", 6)
	.attr("dy", ".71em")
	.style("text-anchor", "end")
	.text("Cum. Reward");

// Line plot
var line = d3.svg.line()
	.interpolate('basis')
	.x(function(d,i){return xScale(i);})
	.y(function(d){return yScale(d);});


var data = {
    payoffs:[[0],[0],[0],[0]],
    regrets:[[0],[0],[0],[0]],
    t:[0],
    tmax:100,
    pmax:10000,
    rmax:10000,
};
var p0 = svg.append('path')
    .datum(data.payoffs[0])
    .attr('class','line reward')
	.attr('fill','none')
	.style('stroke','blue')
	.attr('stroke-width',2)
    .attr('opacity',1)
var p1 = svg.append('path')
    .datum(data.payoffs[1])
    .attr('class','line reward')
	.attr('fill','none')
	.style('stroke','green')
	.attr('stroke-width',2)
    .attr('opacity',1)
var p2 = svg.append('path')
    .datum(data.payoffs[2])
    .attr('class','line reward')
	.attr('fill','none')
	.style('stroke','red')
	.attr('stroke-width',2)
    .attr('opacity',1)
var p3 = svg.append('path')
    .datum(data.payoffs[3])
    .attr('class','line reward')
	.attr('fill','none')
	.style('stroke','orange')
	.attr('stroke-width',2)
    .attr('opacity',1)

var r0 = svg.append('path')
    .datum(data.regrets[0])
    .attr('class','line regret')
	.attr('fill','none')
	.style('stroke','blue')
	.attr('stroke-width',2)
    .attr('opacity',0)
var r1 = svg.append('path')
    .datum(data.regrets[1])
    .attr('class','line regret')
	.attr('fill','none')
	.style('stroke','green')
	.attr('stroke-width',2)
    .attr('opacity',0)
var r2 = svg.append('path')
    .datum(data.regrets[2])
    .attr('class','line regret')
	.attr('fill','none')
	.style('stroke','red')
	.attr('stroke-width',2)
    .attr('opacity',0)
var r3 = svg.append('path')
    .datum(data.regrets[3])
    .attr('class','line regret')
	.attr('fill','none')
	.style('stroke','orange')
	.attr('stroke-width',2)
    .attr('opacity',0)
yScale.domain( [0, data.pmax] );
xScale.domain( [0, data.tmax] );
// y-axis
svg.select('g.y.axis')
    .transition(750)
    .ease('sin-in-out')
    .call(yAxis)
// x-axis
svg.select('g.x.axis')
    .transition(750)
    .ease('sin-in-out')
    .call(xAxis)
    
var inTransition = false;
var updateData = function (){
    if (mode == 'reward'){
        svg.selectAll('.line').attr('d',line);
        if (data.pmax < data.payoffs[0][data.payoffs[0].length-1] ||
            data.pmax < data.payoffs[1][data.payoffs[1].length-1] ||
            data.pmax < data.payoffs[2][data.payoffs[2].length-1] ||
            data.tmax < data.payoffs[0].length) {
            data.pmax *= 2;
            yScale.domain( [0, data.pmax] );
            // y-axis
            svg.select('g.y.axis')
                .transition()
                .duration(500)
                .call(yAxis)
            data.tmax *= 2;
            xScale.domain( [0, data.tmax] );
            // x-axis
            svg.select('g.x.axis')
                .transition()
                .duration(500)
                .call(xAxis)
            inTransition = true;
            svg.selectAll('.line.reward').transition().duration(500).attr('d',line);
            setTimeout(function(){inTransition=false;},500);
        }
    } else if (mode == 'regret'){
        svg.selectAll('.line').attr('d',line);
        if (data.rmax < data.regrets[0][data.regrets[0].length-1] ||
            data.rmax < data.regrets[1][data.regrets[1].length-1] ||
            data.rmax < data.regrets[2][data.regrets[2].length-1] ||
            data.tmax < data.regrets[0].length) {
            data.rmax *= 2;
            yScale.domain( [0, data.rmax] );
            // y-axis
            svg.select('g.y.axis')
                .transition()
                .duration(500)
                .call(yAxis)
            data.tmax *= 2;
            xScale.domain( [0, data.tmax] );
            // x-axis
            svg.select('g.x.axis')
                .transition()
                .duration(500)
                .call(xAxis)
            inTransition = true;
            svg.selectAll('.line.regret').transition().duration(500).attr('d',line);
            setTimeout(function(){inTransition=false;},500);
        }

    }
}


var u = new UCB1Strategy(vizParams.mus,sampleBetaFixedAlpha);
var o = new optimalStrategy(vizParams.mus,sampleBetaFixedAlpha);
var w = new worstStrategy(vizParams.mus,sampleBetaFixedAlpha);
var e = new epsilonGreedyStrategy(vizParams.mus,sampleBetaFixedAlpha,0.1);

var lastActions = new Deque([]);
var actionFreqs = [0,0,0,0,0];

var mode = 'reward';
// TODO: rename
var loop = function() {
    if (!inTransition && playStatus == 'play' ){
        updateData();
        var ret = u.getNextAction();
        data.payoffs[0].push(data.payoffs[0][data.payoffs[0].length-1]+ret.reward*100);
        banditPanel.select('g:nth-child(' + (ret.action+1) + ') circle').attr('fill','green').transition().duration(speed-10).attr('fill','white')
        if (lastActions.length >= 1000){
            actionFreqs[lastActions.shift()] -= 1;
            lastActions.push(ret.action);
            actionFreqs[ret.action] += 1;
        } else {
            lastActions.push(ret.action);
            actionFreqs[ret.action] += 1;
        }
        banditPanel.selectAll('rect')
            .data(actionFreqs)
            .attr('height',function(d){return (d/actionFreqs.reduce(add,0))*100;})
        var ret = o.getNextAction();
        data.payoffs[1].push(data.payoffs[1][data.payoffs[1].length-1]+ret.reward*100);
        var ret = w.getNextAction();
        data.payoffs[2].push(data.payoffs[2][data.payoffs[2].length-1]+ret.reward*100);
        var ret = e.getNextAction();
        data.payoffs[3].push(data.payoffs[3][data.payoffs[3].length-1]+ret.reward*100);
        var t = data.payoffs[0].length-1;
        for (var i = 0; i < data.regrets.length; i++) {
            data.regrets[i].push(data.payoffs[1][t]-data.payoffs[i][t]);
        }

    } 
    if (playStatus == 'play') {
        setTimeout(loop,speed);
    }
}


var rects = banditPanel.selectAll('rect')
    .data(actionFreqs)
    .enter()
    .append('rect')
    .attr('width',30)
    .attr('height',0)
    .attr('fill','dodgerblue')
    .attr('transform',function(d,i) {return 'translate(' +(35+margin.left+i*200-15) + ',' + (margin.top/4) + ')';})
    .attr('y',35)

var add = function(x,y) {
    return x+y;
}

var stop = function() {
    inTransition = true;
}

// setup y
var freqScale = d3.scale.linear().range([margin.top/4+35, 0]),
    freqAxis = d3.svg.axis().scale(freqScale).orient('left');

// y-axis
banditPanel.append("g")
	.attr("class", "y axis")
	.attr("transform", 'translate(' +(margin.left) + ',' + (35+margin.top/4) + ')')
.append("text")
	.attr("class", "label")
	.attr("transform", 'rotate(-90)')
	.attr("y", 6)
	.attr("dy", ".71em")
	.style("text-anchor", "end")
	.text("Freq (%)");

freqScale.domain([100, 0]);
banditPanel.select('g.y.axis')
    .transition(750)
    .ease('sin-in-out')
    .call(freqAxis.ticks(5))

var playStatus = 'paused';
var speedOpts = [300, 200, 150, 80, 40, 20];
var speedIdx = 2;
var speed = speedOpts[speedIdx];
buttonPlayPress = function() {
    playStatus = 'play';
    loop();
}
// TODO: refactor to pause
buttonStopPress = function() {
    playStatus = 'paused';
}
buttonForwardPress = function() {
    speedIdx = Math.min(speedIdx+1,speedOpts.length-1);
    speed = speedOpts[speedIdx];
}
buttonBackPress = function() {
    speedIdx = Math.max(speedIdx-1,0);
    speed = speedOpts[speedIdx];
}
var showMus = false;
var labs = ['A', 'B', 'C', 'D', 'E'];
showButtonPress = function() {
    if (showMus) {
        showMus = !showMus;
        banditPanel.selectAll('.bandit text')
            .attr('dx', -7)
            .attr('dy', 4)
            .transition()
            .style('opacity',0)
            .transition()
            .text(function(d,i) { return labs[i]; })
            .style('opacity',1);
        d3.select('#showButtonText').text('Show Means');
    } else {
        showMus = !showMus;
        banditPanel.selectAll('.bandit text')
            .attr('dx', -7)
            .attr('dy', 4)
            .style('opacity',0)
            .transition()
            .text(function(d) { return (d*100).toString(); })
            .style('opacity',1);
        d3.select('#showButtonText').text('Hide Means');
    }
}

var modeButtonPress = function() {
    if (mode == 'reward') {
        mode = 'regret';
        d3.selectAll('.line.reward')
            .transition()
            .duration(300)
            .attr('opacity',0);
        d3.selectAll('.line.regret')
            .transition()
            .duration(300)
            .attr('opacity',1);
        d3.select('.mainYLabel').text('Cum. Regret');
    } else {
        mode = 'reward';
        d3.selectAll('.line.reward')
            .transition()
            .duration(300)
            .attr('opacity',1);
        d3.selectAll('.line.regret')
            .transition()
            .duration(300)
            .attr('opacity',0);
        d3.select('.mainYLabel').text('Cum. Reward');
    }
}

var legendEntries = [];
legendEntries.push({text:'Optimal Strategy', color:'green'});
legendEntries.push({text:'UCB1 Strategy', color:'blue'});
legendEntries.push({text:'Epsilon Greedy Strategy', color:'orange'});
legendEntries.push({text:'Cursed Strategy', color:'red'});
  // draw legend
  var legend = svg.selectAll(".legend")
      .data(legendEntries)
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 10 + ")"; });

  // draw legend colored rectangles
  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 14)
      .attr("height", 5)
      .style("fill", function(d){return d.color;});

  // draw legend text
  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", "-.25em")
      .attr('font-size',11)
      .style("text-anchor", "end")
      .text(function(d) { return d.text;})

