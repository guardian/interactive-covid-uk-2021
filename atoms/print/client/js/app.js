import * as d3B from 'd3'
import { $, $$, numberWithCommas, round } from 'shared/js/util'
import moment from 'moment'
//import data from 'assets/json/data.json'

const d3 = Object.assign({}, d3B);

const atomEl = d3.select('#covid-uk-print').node();

const width = 363;
const height = width * .4;

const margin = {left:5, top:5, right:50, bottom:25}

const deaths = d3.select('#covid-uk-print')
.append('svg')
.attr('id', 'covid-uk-chart-1')
.attr('width', width)
.attr('height', height);

const vaccines = d3.select('#covid-uk-print')
.append('svg')
.attr('id', 'covid-uk-chart-2')
.attr('width', width)
.attr('height', height);


let deathsLine = deaths.append('path').attr("class", "covid-area deaths-area")
let vaccinesArea = vaccines.append('path').attr("class", "covid-area vaccines-area")
let boostArea = vaccines.append('path').attr("class", "covid-area vaccines-area")

const xScale =  d3.scaleTime();
const yDeathsScale = d3.scaleLinear();
const yVaccinesScale = d3.scaleLinear();

const deathsBreakpoints = [100322, 152249, 155325, 161890, 172695]
const vaccinesBreakpoints = [5.3, 54, 66]


d3.json('https://interactive.guim.co.uk/docsdata-test/1XymBcR_xu0GwpGFsoICE22NH1o_beJ5BiINB6NS6fLg.json')
.then(rawData => {

	let data = rawData.sheets['master-data'];

	const dataObj = data.map(d => {

		let index = +d.stringency_index == 0 ? null : +d.stringency_index;

		return {date:moment(d.Day, 'DD/MM/YYYY'), deaths:+d.cum_deaths, vaccines:+d.fully_vaccinated_rate, booster:+d.booster_rate, stringency:+d.stringency_index, ranking:d.stringency_ranking, title:d.annotation_title, text:d.annotation_text}

	});

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
	.domain([d3.max(fullyVaccinatedExtent), 0])

	const area = d3.area()
	.curve(d3.curveLinear)
	.x(d => xScale(d.date))
	.y0(height - margin.bottom)

	const line = d3.line()
	.curve(d3.curveLinear)
	.x(d => xScale(d.date))

	deathsLine
	.attr("class", "covid-line deaths-line")
	.attr("d", () => {
		line.y(d => yDeathsScale(d.deaths))
		return line(dataObj)
	})

	deaths.append("g")
	.attr("transform", "translate(0," + (height - margin.bottom + 5) + ")")
	.attr("class", "xaxis")
	.call(
		d3.axisBottom(xScale)
		.ticks(12)
		.tickFormat(d3.timeFormat("%b"))
		)
	.selectAll("text")

	deaths.append("g")
	.attr("class", "leftAxis")
	.attr("transform", `translate(${width - margin.right},0)`)
	.call(
		d3.axisRight(yDeathsScale)
		.ticks(4)
		.tickSizeInner(10)
		)
	.selectAll("text")
	.text(d => numberWithCommas(d))

	vaccinesArea
	.attr("class", "covid-area vaccines-area")
	.attr("d", () => {
		area.y1(d => yVaccinesScale(d.vaccines))
		area.defined(d => d.vaccines)
		return area(dataObj)
	});

	boostArea
	.attr("class", "covid-area boost-area")
	.attr("d", () => {
		area.y1(d => yVaccinesScale(d.booster))
		area.defined(d => d.vaccines)
		return area(dataObj)
	});

	vaccines.append("g")
	.attr("transform", "translate(0," + (height - margin.bottom + 5) + ")")
	.attr("class", "xaxis")
	.call(
		d3.axisBottom(xScale)
		.ticks(12)
		.tickFormat(d3.timeFormat("%b"))
		)
	.selectAll("text")

	vaccines.append("g")
	.attr("class", "rightAxis")
	.attr("transform", `translate(${width - margin.right},0)`)
	.call(
		d3.axisRight(yVaccinesScale)
		.ticks(4)
		.tickSizeInner(10)
		)
	.selectAll("text")
	.text(d => numberWithCommas(d))


	const deathMarks = deaths.selectAll('blah')
	.data(deathsBreakpoints)
	.enter()
	.append('path')
	.attr('d', d => {

		let point = dataObj.find(f => f.deaths >= d);

		return `M${xScale(point.date)},${yDeathsScale(point.deaths)}L${xScale(point.date)},${height - margin.bottom}`

	})
	.style('stroke', 'black')



	const vaccineMarks = vaccines.selectAll('blah')
	.data(vaccinesBreakpoints)
	.enter()
	.append('path')
	.attr('d', d => {
		let point = dataObj.find(f => f.vaccines >= d);
		return `M${xScale(point.date)},${yVaccinesScale(point.vaccines)}L${xScale(point.date)},${height - margin.bottom}`
	})
	.style('stroke', 'black')




})