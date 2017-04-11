
var NOISE_MEAN = 0, 
    NOISE_SIGMA = 0.5,
    numLinePts = 50, // Num pts to define lines with
    data = [],  //
    dataParams, // 
    N = 20;


// Generates N data points between lwr_bnd and upr_bnd using
// a function f as the distribution. Points are combined with
// normally distributed noise.
// Input: N - num of desired data pts
//          lwr_bnd - lower bound of x of data points
//          upr_bnd - upper bound of x of data points
//          f - distribution to generate data pts from
// Output: data - an array of objects with x and y attr's
var generateData = function (N,lwr_bnd,upr_bnd,f){
    var data = new Array(N);
    for (var i = 0; i < N; i++){
        var dataPt = []; // 
        dataPt.x = jStat.uniform.sample(lwr_bnd,upr_bnd);
        dataPt.y = f(dataPt.x)+jStat.normal.sample(NOISE_MEAN,NOISE_SIGMA);
        data[i] = dataPt;
    }
    return data
}


// Train a least square regression model given an array of basis functions
// Input: data - an array of obj with .x and .y attr
//          basis - array of functions that take in an x value
// Output: W - a vector of weights of size basis.length
var trainLsSqr = function(data,basis){
    var M = basis.length,
        N = data.length,
        A = numeric.rep([M,M], 0),
        B = numeric.rep([M,1], 0);
    for (var i = 0; i < N; i++){
        var phi = numeric.rep([M,1],0);
        for (var m = 0; m < M; m++){
            phi[m][0] = basis[m](data[i].x);
        }
        A = numeric.add(A,numeric.dot(phi,numeric.transpose(phi)));
        B = numeric.add(B,numeric.mul(data[i].y,phi));
    }
    return numeric.solve(A,B);
}




// Scatterplot Adapted from Michele Weigle's simple example: http://bl.ocks.org/weiglemc/6185069

var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
var axesDataMargin = {top: 4.5, right: 0.5, bottom: 0.5, left:0.5}

// create canvas
var svg = d3.select('body').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
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
	.text("X");

// y-axis
svg.append("g")
	.attr("class", "y axis")
.append("text")
	.attr("class", "label")
	.attr("transform", "rotate(-90)")
	.attr("y", 6)
	.attr("dy", ".71em")
	.style("text-anchor", "end")
	.text("Y");

// Line plot
var line = d3.svg.line()
	.interpolate('basis')
	.x(xMap)
	.y(yMap);

// predLine plot
var predYMap = function(d) { return d3.min([height,yScale(yValue(d))]);}
var line = d3.svg.line()
	.interpolate('basis')
	.x(xMap)
	.y(predYMap);

var funLine = d3.select('g')
	.append('path')
	.attr('class','line')
	.attr('fill','none')
	.attr('stroke','black')
	.attr('stroke-width',2)
    .attr('stroke-dasharray',('2,3'))

var lastFun = [];
var updateData = function (){
    if (!dataParams.isDataset){
        if (lastFun == dataParams.fun){
            if (N > data.length) {
                var newData = generateData(N-data.length,dataParams.lwrBnd,dataParams.uprBnd,dataParams.fun);
                newData.forEach( function(d) {data.push(d);} );
                svg.selectAll('.dot')
                    .data(data)
                    .enter()
                    .append('circle')
                    .attr('class', 'dot')
                    .attr('r', 3.5)
                    .attr('cx', xMap)
                    .attr('cy', yMap)
                    .style('fill', dataParams.color)
                    .style('opacity',0)
                    .transition(700)
                    .style('opacity',1);
            } else {
                while (N < data.length) {
                    data.pop();
                }
                svg.selectAll('.dot').data(data).exit().transition(700).style('opacity',0).remove();
            }
            updatePredLine();
        } else {
            lastFun = dataParams.fun;
            data = generateData(N,dataParams.lwrBnd,dataParams.uprBnd,dataParams.fun);

            // add buffer between axes and data
            xScale.domain( [d3.min(data, xValue)-axesDataMargin.left, d3.max(data, xValue)+axesDataMargin.right] );
            yScale.domain( [d3.min(data, yValue)-axesDataMargin.right, d3.max(data, yValue)+axesDataMargin.top] );

            // x-axis
            svg.select('g.x.axis')
                .transition(750)
                .ease('sin-in-out')
                .call(xAxis)
            // y-axis
            svg.select('g.y.axis')
                .transition(750)
                .ease('sin-in-out')
                .call(yAxis)

            svg.selectAll('.dot').remove().transition(700).style('opacity',0).remove()
            var dots = svg.selectAll('.dot').data(data)

            // plot points
            dots.enter().append('circle')
                .attr('class', 'dot')
                .attr('r', 3.5)
                .attr('cx', xMap)
                .attr('cy', yMap)
                .style('fill', dataParams.color)
                .attr('opacity',0)
                .transition(700)
                .attr('opacity',1);
            var xDom = xScale.domain();
            var x = numeric.linspace(xDom[0],xDom[1],numLinePts);
            var lineData = new Array(numLinePts);
            x.forEach(function(d,i) {
                lineData[i] = [];
                lineData[i].x = d;
                lineData[i].y = dataParams.fun(d);
            });
            funLine.transition(2000).attr('d',line(lineData));
            updatePredLine();
        }
    }
        else {
            d3.csv(dataParams.path, function(csvData) {
                data = [];
                csvData.forEach( function(d) {
                        var datum = [];
                        datum.x = +d['wt(g)'];
                        datum.y = +d['len(cm)'];
                        data.push(datum);
                    })
            xScale.domain( [d3.min(data, xValue)-axesDataMargin.left, d3.max(data, xValue)+axesDataMargin.right] );
            yScale.domain( [d3.min(data, yValue)-axesDataMargin.right, d3.max(data, yValue)+axesDataMargin.top] );
            // x-axis
            svg.select('g.x.axis')
                .transition(750)
                .ease('sin-in-out')
                .call(xAxis)
            // y-axis
            svg.select('g.y.axis')
                .transition(750)
                .ease('sin-in-out')
                .call(yAxis)
            svg.selectAll('.dot').remove().transition(700).style('opacity',0).remove()
            var dots = svg.selectAll('.dot').data(data)

            // plot points
            dots.enter().append('circle')
                .attr('class', 'dot')
                .attr('r', 3.5)
                .attr('cx', xMap)
                .attr('cy', yMap)
                .style('fill', dataParams.color)
                .attr('opacity',0)
                .transition(700)
                .attr('opacity',1);
            })
            
        }


}
    
// Initialize prediction line (but don't render yet)
var predLine = d3.select('g')
	.append('path')
	.attr('class','line')
	.attr('fill','none')
	.style('stroke','green')
	.attr('stroke-width',2)

/* Define and render basis function options panel */
var basisPanel = d3.select('body')
    .append('div')
    .attr('class','basisPanel')
basisPanel.append('h3')
    .text('Basis Functions:');
basisPanel.append('table');
var basisPanelHeaders = ['Bias','Polynomial','Periodic']
basisPanel.select('table')
    .append('tr')
    .selectAll('th')
    .data(basisPanelHeaders)
    .enter().append('th')
    .text(function(d){return d});
    
var basisPanelOptsRow = basisPanel.select('table').append('tr');

var p0 = [];
p0.fun = function(x){return 1;}
p0.opt_text = 'f(x)=1'
basisPanelOptsRow.append('td')
    .selectAll('.checkBox')
    .data([p0])
    .enter().append('div')
    .attr('class','checkbox')
    .append('label')
    .attr('class','basis_opt')
polyFuns = [];
var p1 = [];
p1.fun = function(x){return x;}
p1.opt_text = 'f(x)=x'
polyFuns.push(p1);
var polyFunFactory = function (e) {
    return function(x){return Math.pow(x,e);}
}
for (var i = 2; i < 11; i++){
    var px = [];
    px.fun = polyFunFactory(i)
    px.opt_text = 'f(x)=x^' + i.toString();
    polyFuns.push(px);
}
basisPanelOptsRow.append('td')
    .attr('class','polynomialFunCell')
    .selectAll('.checkBox')
    .data(polyFuns)
    .enter().append('div')
    .attr('class','checkbox')
    .append('label')
    .attr('class','basis_opt')

var sinFunFactory = function (factor) {
    return function(x){return Math.sin(factor*x)};
}
var cosFunFactory = function (factor) {
    return function(x){return Math.cos(factor*x)};
}
var sinFuns = [],
    cosFuns = [];
var s1 = [];
s1.fun = sinFunFactory(1);
s1.opt_text = 'f(x)=sin(x)';
var c1 = [];
c1.fun = cosFunFactory(1);
c1.opt_text = 'f(x)=cos(x)';
sinFuns.push(s1);
cosFuns.push(c1);
for (var i = 2; i < 6; i++){
    var sx = [], cx = [];
    sx.fun = sinFunFactory(i);
    sx.opt_text = 'f(x)=sin(' + i.toString() + 'x)'
    cx.fun = cosFunFactory(i);
    cx.opt_text = 'f(x)=cos(' + i.toString() + 'x)'
    sinFuns.push(sx);
    cosFuns.push(cx);
}
basisPanelOptsRow.append('td')
    .attr('class','periodicFunCell')
    .selectAll('.checkBox')
    .data(sinFuns.concat(cosFuns))
    .enter().append('div')
    .attr('class','checkbox')
    .append('label')
    .attr('class','basis_opt')

basisPanelOptsRow.selectAll('.basis_opt')
.append('input')
    .attr('type','checkbox')
    .attr('value','')
    .on('change',function(d){updatePredLine()});
basisPanelOptsRow.selectAll('.basis_opt')
.append('text')
    .text(function(d){return d.opt_text;});
// Create a map for faster indexing
var basis_funs_map = [];
basis_funs_map[p0.opt_text] = p0.fun;
basis_funs_map[s1.opt_text] = s1.fun;
basis_funs_map[c1.opt_text] = c1.fun;
polyFuns.forEach(function(d){basis_funs_map[d.opt_text] = d.fun;})
sinFuns.forEach(function(d){basis_funs_map[d.opt_text] = d.fun;})
cosFuns.forEach(function(d){basis_funs_map[d.opt_text] = d.fun;})

/* Create panel with distribution and dataset options */
var dataPanel = d3.select('body')
    .append('div')
    .attr('class','dataPanel')
dataPanel.append('h3')
    .text('Data Options:')

// Distributions for use with generateData

var f1 = function(x){
    return x*x;
}
var f2 = function(x){
    return x*x*x;
}
var f3 = function(x){
    return Math.sin(3.22*x)+Math.PI;
}
var f4 = function(x){
    return 7.2+2*x+Math.cos(5*x);
}
var f5 = function(x){
    return -2-3*Math.pow(x,8)+300*Math.sin(2*x*x);
}
var dists = [];

dists.push([]);
dists[0].fun = f1;
dists[0].isDataset = false;
dists[0].color = 'dodgerblue';
dists[0].opt_text = 'Distribution 1';
dists[0].lwrBnd = 0;
dists[0].uprBnd = 3;

dists.push([]);
dists[1].fun = f2;
dists[1].isDataset = false;
dists[1].color = 'red';
dists[1].opt_text = 'Distribution 2';
dists[1].lwrBnd = 0;
dists[1].uprBnd = 3;

dists.push([]);
dists[2].fun = f3;
dists[2].isDataset = false;
dists[2].color = 'purple';
dists[2].opt_text = 'Distribution 3';
dists[2].lwrBnd = 0;
dists[2].uprBnd = 3;

dists.push([]);
dists[3].fun = f4;
dists[3].isDataset = false;
dists[3].color = 'aquamarine';
dists[3].opt_text = 'Distribution 4';
dists[3].lwrBnd = 0;
dists[3].uprBnd = 3;

dists.push([]);
dists[4].fun = f5;
dists[4].isDataset = false;
dists[4].color = 'brown';
dists[4].opt_text = 'Distribution 5';
dists[4].lwrBnd = 0;
dists[4].uprBnd = 3;

datasets = [];
datasets.push([]);
datasets[0].isDataset = true;
datasets[0].color = 'purple';
datasets[0].opt_text = 'Birth Wt vs Len';
datasets[0].path = 'data/babies.csv';

var dataPickerCallback = function() {
    var selectedIndex = dataPicker.property('selectedIndex');
    var opt = dataPicker.selectAll('option')
        .filter(function(d,i){return selectedIndex==i;})
        .datum()
    dataParams = opt;
    dataPanel.select('.funLineToggle input').property('checked',false);
    funLineToggleCallback();
    updateData();
    updatePredLine();
}
var dataPicker = dataPanel.append('select')
    .attr('class','selectpicker')
    .attr('data-dropup-auto',false)
    .on('change', dataPickerCallback);

dataPicker.append('optgroup')
    .attr('label','Distributions')
    .selectAll('option')
    .data(dists)
    .enter().append('option')
    .text(function(d){return d.opt_text;})
    .on('click', function(d){ updateData(d.fun) });

dataPanel.append('span')
    .text('N=20')
    .attr('class','NSliderLabel')
dataPanel.append('input')
    .attr('id','NSlider')
    .attr('data-slider-min',1)
    .attr('data-slider-max',200)
    .attr('data-slider-step',1)
    .attr('data-slider-value',20);

dataPanel.append('div')
    .attr('class','funLineToggle checkbox');
dataPanel.selectAll('.dataPanel div')
    .append('input')
    .attr('type','checkbox')
    .attr('value','')
    .on('change',function(){funLineToggleCallback()})
dataPanel.selectAll('.dataPanel div')
    .append('text')
    .text('Show actual distribution');
var funLineToggleCallback = function(){ 
    if(dataPanel.select('.funLinetoggle input').property('checked')){
        funLine.transition(1000).attr('opacity',1);
    } else {
        funLine.transition(1000).attr('opacity',0);
}};


// Have to mix in some jquery for bootstra-slider unfortunately
$('#NSlider').slider();
$('#NSlider').on('slide', function(slideEvt) {
    N = slideEvt.value;
    dataPanel.select('.NSliderLabel')
        .text('N=' + slideEvt.value.toString());
    updateData();
});
        

    


var updatePredLine = function(){
    var basis = [];
    var opts = d3.selectAll('.basis_opt')
    opts.each(function(d){ 
        if (d3.select(this).select('input').property('checked') == true) 
        basis.push(basis_funs_map[d.opt_text]); })
    var W = trainLsSqr(data, basis)
    var predLineData = new Array(numLinePts);
    var xDom = xScale.domain();
    var x = numeric.linspace(xDom[0],xDom[1],numLinePts);
    x.forEach(function(d,i) {
        predLineData[i] = [];
        predLineData[i].x = d;
        predLineData[i].y = 0;
        for (var m = 0; m < basis.length; m++){
            predLineData[i].y += W[m]*basis[m](d);
        };
    });
    var yDom = yScale.domain();
    //predLineData = predLineData.filter(function(d){return d.y > yDom[0];});
    // TODO: clip pred line that goes through the axis rather than just
    // hugging the axis
    predLine.transition(1000).attr('d',line(predLineData));
};


basisPanelOptsRow.select('td:nth-child(1) input').property('checked',true) // Include bias function as default
basisPanelOptsRow.select('td:nth-child(2) input:nth-child(1)').property('checked',true) // Include bias function as default
dataParams = dists[0];
dataPanel.select('.funLinetoggle input').property('checked',true); // set checked by default
updateData();
updatePredLine();


var legendEntries = [];
legendEntries.push({text:'Predicted Distribution', color:'green'});
legendEntries.push({text:'Actual Distribution', color:'black'});
  // draw legend
  var legend = svg.selectAll(".legend")
      .data(legendEntries)
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  // draw legend colored rectangles
  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", function(d){return d.color;});

  // draw legend text
  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d.text;})
