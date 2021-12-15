import * as d3B from 'd3'
import { $, $$, numberWithCommas, round } from 'shared/js/util'
import ScrollyTeller from "shared/js/ScrollyTellerProgress";
import moment from 'moment'
import data from 'assets/json/data.json'

const d3 = Object.assign({}, d3B);

const atomEl = d3.select('.svg-wrapper').node();
const tooltip = d3.select('.chart-data');
const date = d3.select('.date');
const ranking = d3.select('.ranking');
const deaths = d3.select('.deaths');
const vaccines = d3.select('.vaccines');
const booster = d3.select('.booster');

const isMobile = window.matchMedia('(max-width: 600px)').matches;

const width = isMobile ? atomEl.getBoundingClientRect().width : atomEl.getBoundingClientRect().width * .6;
const wHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
const height = isMobile ? wHeight / 2 : wHeight * .6;

const margin = {left:45, top:120, right:isMobile ? 150 : 100, bottom:20}

const chart = d3.select('.svg-wrapper')
.append('svg')
.attr('id', 'covid-uk-chart')
.attr('width', width)
.attr('height', height);

//const defs = chart.append('defs')

/*let mask = defs
.append('clipPath')
.attr('id', 'clip-mask')
.style('transform', `translate(-${margin.left}px,0)`)*/

/*let linearGradient = defs.append('linearGradient')
.attr('id','grad1')
.attr('x1', '0%')
.attr('y1', '0%')
.attr('x2', '100%')
.attr('y2', '0%')*/

/*let gradient = chart
.append('rect')
.attr('width', width - margin.left - margin.right)
.attr('height', height)
.style('transform', `translate(${margin.left}px,0)`)
.style('fill', 'url(#grad1')
.style('clip-path', 'url(#clip-mask)')*/


/*const colorScale = (value) => {

	let v;

	if(value === "Very high") v = '#848484';
	else if(value === "High") v = '#a1a1a1';
	else if(value === "Medium") v = '#bdbdbd';
	else if(value === "Low") v = '#dadada';
	else if(value === "Very low") v = '#ffffff';

	return v
}
*/



const areas = chart.append('g')
const axis = chart.append('g')
const lines = chart.append('g')
const dots = chart.append('g')


let deathsArea = lines.append('path').attr("class", "covid-area deaths-area")
let vaccinesArea = areas.append('path').attr("class", "covid-area vaccines-area")
let boostArea = areas.append('path').attr("class", "covid-area vaccines-area")

let deathsLine = lines.append("path").attr("class", "covid-line deaths-line")
//let vaccinesLine = lines.append("path").attr("class", "covid-line vaccines-line")
//let boostLine = lines.append("path").attr("class", "covid-line boost-line")

let mark = lines.append('path').attr('class', 'date-mark').attr('d', `M${margin.left},${margin.top - 35},${margin.left},${height-margin.bottom}`)

//let maskArea = d3.select('#clip-mask').append('path').attr("class", "covid-area")

let deathsDot = dots.append('circle')
//let vaccinesDot = dots.append('circle')
//let boostDot = dots.append('circle')

const xScale =  d3.scaleTime();
const yDeathsScale = d3.scaleLinear();
const yVaccinesScale = d3.scaleLinear();

//const dates = data.map(d => moment(d.Day, 'DD/MM/YYYY'))

const dataObj = data.map(d => {

	let index = +d.stringency_index == 0 ? null : +d.stringency_index;

	return {date:moment(d.Day, 'DD/MM/YYYY'), deaths:+d.cum_deaths, vaccines:+d.fully_vaccinated_rate, booster:+d.booster_rate, /*stringency:+d.stringency_index, */ranking:d.stringency_ranking, /*title:d.annotation_title,*/ text:d.annotation_text != '' ? true : null}

});

/*let stringency = {date:dataObj[0].date, stringency:dataObj[0].stringency};

const dayPer = 100 / dataObj.length;*/

/*linearGradient.append('stop')
.attr('offset', '0%')
.style('stop-color',colorScale(dataObj[0].ranking))

let rank = {date:dataObj[0].date, ranking:dataObj[0].ranking};


const stringencyDates = dataObj.forEach((d,i) => {

	if(rank.ranking != d.ranking){

		console.log(rank.date.format('DD/MM'), rank.ranking)

		linearGradient.append('stop')
		.attr('offset', dayPer * i + '%')
		.style('stop-color',colorScale(rank.ranking))

		rank.date = d.date;
		rank.ranking = d.ranking;


		linearGradient.append('stop')
		.attr('offset', dayPer * i + '%')
		.style('stop-color',colorScale(d.ranking))

	}

})*/

console.log(dataObj)

const annotationDates = dataObj.filter(d => d.text)

const datesExtent = d3.extent(dataObj, d => d.date);

const rollingDeathsExtent = d3.extent(dataObj.map(d => +d.deaths))

const fullyVaccinatedExtent = d3.extent(dataObj.map(d => +d.vaccines))

xScale
.range([margin.left, width - margin.right])
.domain(datesExtent)

yDeathsScale
.range([margin.top, height - margin.bottom])
.domain([d3.max(rollingDeathsExtent), 0])

yVaccinesScale
.range([margin.top, height - margin.bottom])
.domain([80, 0])//requested to be hardcoded

const line = d3.line()
.curve(d3.curveLinear)
.x(d => xScale(d.date))

const area = d3.area()
.curve(d3.curveLinear)
.x(line.x())
.y0(yVaccinesScale(0))
.y1(line.y())

let xaxis = axis.append("g")
.attr("transform", "translate(0," + (height - margin.bottom + 5) + ")")
.attr("class", "xaxis")
.call(
	d3.axisBottom(xScale)
	.ticks(isMobile?7:12)
	.tickFormat(d3.timeFormat("%b"))


	)
.selectAll("text")

let leftAxis = axis.append("g")
.attr("class", "leftAxis")
.attr("transform", `translate(${margin.left},0)`)
.call(
	d3.axisLeft(yDeathsScale)
	.ticks(4)
	.tickSizeInner(margin.left)
	)
.selectAll("text")
.text(d => numberWithCommas(d))
.style('text-anchor', 'start')
.attr('class', (d,i) => 'left-label-' + i)
.attr('dy',(d,i) => '-10px')
.attr('dx','5px')
.call(t => {

	t.each((d,i) => {
	
		if(i == 0){
			let label = d3.select('.left-label-0')
			.text(numberWithCommas(d))
			.append("tspan")
			.text('deaths')
			.attr('class','axis-label')
			.attr("x", "-43px")
			.attr("y", `-${margin.top - 90}px`)

	        let label2 = d3.select('.left-label-0')
			.append("tspan")
			.attr('class','axis-label')
			.text('2021')
			.attr("x", "-43px")
			.attr("y", `-${margin.top - 75}px`)
		}
		
	})
})


let rightAxis = axis.append("g")
.attr("class", "rightAxis")
.attr("transform", `translate(${isMobile ? width - 55 : width},0)`)
.call(
	d3.axisRight(yVaccinesScale)
	.ticks(4)
	.tickSizeInner(10)
	)
.selectAll("text")
.text(d => d)
.attr('class', (d,i) => 'right-label-' + i)
.attr('dy','-10px')
.attr('dx','-15px')
.call(t => {

	t.each((d,i) => {
	
		if(i == 0){
			let label = d3.select('.right-label-0')
			.text(d+'%')
			.append("tspan")
			.attr('class','axis-label')
			.text('rate')
			.attr("x", "-2px")
			.attr("y", `-${margin.top - 90}px`)

	        let label2 = d3.select('.right-label-0')
			.append("tspan")
			.attr('class','axis-label')
			.text('Vaccination')
			.attr("x", "-2px")
			.attr("y", `-${margin.top - 75}px`)
		}
		
	})
})

d3.selectAll(".rightAxis .tick")
.append('line')
.attr('x2', -width + margin.left)
.attr('class', 'white-line')



deathsDot
.attr('r', 6)
.attr('cx', xScale(dataObj[0].date))
.attr('cy', yDeathsScale(dataObj[0].deaths))
.attr('class', 'deaths-dot')

/*vaccinesDot
.attr('r', 6)
.attr('cx', xScale(dataObj[0].date))
.attr('cy', yVaccinesScale(dataObj[0].vaccines))
.attr('class', 'vaccines-dot')

boostDot
.attr('r', 6)
.attr('cx', xScale(dataObj[0].date))
.attr('cy', yVaccinesScale(dataObj[0].booster))
.attr('class', 'boost-dot')*/

const scrolly = new ScrollyTeller({
	parent: document.querySelector("#gv-scrolly-1"),
	    triggerTop: 0.019, // percentage from the top of the screen that the trigger should fire
	    triggerTopMobile:.52,
	    transparentUntilActive: false,
	    overall: () => {}
	})

let oldHeight = d3.select('.scroll-wrapper').node().getBoundingClientRect().height;

d3.select('.scroll-wrapper').style('height', oldHeight + height + margin.top + 'px')

let currentBlob = -1;

scrolly.gradual( (progressInBox, i, abs, total) => {

	if(currentBlob != i)
	{
		d3.selectAll('.scroll-text__inner .date-bullet')
		.classed('active', false)

		d3.select('.blob-' + i + ' .date-bullet')
		.classed('active', true)

		currentBlob = i;
	}


	try{

		const pointA = annotationDates[i].date;
		const pointB = annotationDates[i+1] != undefined ? annotationDates[i+1].date : annotationDates[i].date;

		const spanData = dataObj.filter(f => f.date >= pointA && f.date < pointB)
		const datePos = parseInt((progressInBox * 100) * spanData.length / 100)
		const currentData = spanData.splice(0,datePos)
		const dataTillCurrent = dataObj.filter(f => f.date <= pointA)

		const allData = dataTillCurrent.concat(currentData)

		deathsLine
		.attr("d", () => {
			line.y(d => yDeathsScale(d.deaths))
			line.defined(d => d.deaths)

			return line(allData)
		})

		/*deathsArea
		.attr("d", () => {
			area.y1(line.y())
			area.defined(line.defined())

			return area(allData)
		})*/

		/*vaccinesLine
		.attr("d", () => {
			line.y(d => yVaccinesScale(d.vaccines))
			line.defined(d => d.vaccines)

			return line(allData)
		})*/

		vaccinesArea
		.attr("class", "covid-area vaccines-area")
		.attr("d", () => {

			area.y1(d => yVaccinesScale(d.vaccines))
			area.defined(line.defined())

			return area(allData)
		});

		/*boostLine
		.attr("d", () => {

			line.y(d => yVaccinesScale(d.booster))
			line.defined(d => d.booster)

			return line(allData)
		})*/

		boostArea
		.attr("class", "covid-area boost-area")
		.attr("d", () => {

			area.y1(d => yVaccinesScale(d.booster))
			area.defined(line.defined())

			return area(allData)
		});

		/*if(deathsArea.attr('d') && vaccinesArea.attr('d'))
		{
			maskArea.attr('d', deathsArea.attr('d') + vaccinesArea.attr('d'))
		}
		else
		{
			maskArea.attr('d', deathsArea.attr('d'))
		}*/




		if(currentData[currentData.length-1])
		{
			manageTooltip(currentData[currentData.length-1])
		}
		else{

			manageTooltip(annotationDates[i])
		}
	}
	catch (err){

			//console.log(err)

		}


	})

scrolly.watchScroll();


//_____________HELPERS________________


const manageTooltip = (data) => {

	let yPositionsRight = dodge([yDeathsScale(data.deaths), yVaccinesScale(data.vaccines), yVaccinesScale(data.booster)],20)

	date.html(data.date.format('MMM Do'))
	ranking.select('.ranking-annotation').html('Lockdown level:')
	ranking.select('.ranking-value').html(data.ranking)
	//ranking.select('.ranking-value').style('color', colorScale(data.ranking))
	
	
	

	let xDate = xScale(data.date)
	let w = ranking.node().getBoundingClientRect().width;

	let xPos = xDate;

	if(xDate + w >= width)xPos = width - w;

	tooltip.style('left', xPos + 7 + 'px')
	deaths.style('top',yPositionsRight[0] - 30 + 'px')
	vaccines.style('top',yPositionsRight[1] - 30 + 'px')
	booster.style('top',yPositionsRight[2] - 30 + 'px')

	mark.style('transform', `translate(${xDate - margin.left}px,0)`)

	deaths.html(numberWithCommas(data.deaths))
	deathsDot
	.attr('cx', xDate)
	.attr('cy', yDeathsScale(data.deaths))

	if(data.vaccines > 0){
		/*vaccinesDot
		.attr('cx', xDate)
		.attr('cy', yVaccinesScale(data.vaccines))
		.style('display', 'block')*/

		vaccines.html(data.vaccines + '%')
	}
	else
	{
		//vaccinesDot.style('display', 'none')

		vaccines.html('')
	}

	if(data.booster > 0)
	{
		/*boostDot
		.attr('cx', xDate)
		.attr('cy', yVaccinesScale(data.booster))
		.style('display', 'block')*/

		booster.select('.booster-value').html(data.booster + '%')
		booster.select('.booster-text').html('booster')
	}
	else
	{
		//boostDot.style('display', 'none')

		booster.select('.booster-value').html('')
		booster.select('.booster-text').html('')
	}

}

const dodge = (V, separation, maxiter = 10, maxerror = 1e-1) => {

	const n = V.length;

	if (!V.every(isFinite)) throw new Error("invalid position");

	if (!(n > 1)) return V;

	let I = d3.range(V.length);

	for (let iter = 0; iter < maxiter; ++iter) {

		I.sort((i, j) => d3.ascending(V[i], V[j]));

		let error = 0;

		for (let i = 1; i < n; ++i) {

			let delta = V[I[i]] - V[I[i - 1]];

			if (delta < separation) {
				delta = (separation - delta) / 2;
				error = Math.max(error, delta);
				V[I[i - 1]] -= delta;
				V[I[i]] += delta;
			}

		}
		if (error < maxerror) break;
	}
	return V;
}
