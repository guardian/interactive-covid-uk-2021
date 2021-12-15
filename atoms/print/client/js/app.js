import * as d3B from 'd3'
import { $, $$, numberWithCommas, round } from 'shared/js/util'
import moment from 'moment'
import data from 'assets/json/data.json'

console.log(data)

const d3 = Object.assign({}, d3B);

const atomEl = d3.select('#covid-uk-print').node();

const width = atomEl.getBoundingClientRect().width;
const height = width * .4;

const margin = {left:5, top:5, right:50, bottom:25}

const deaths = d3.select('#covid-uk-print')
.append('svg')
.attr('id', 'covid-uk-chart')
.attr('width', width)
.attr('height', height);

const vaccines = d3.select('#covid-uk-print')
.append('svg')
.attr('id', 'covid-uk-chart')
.attr('width', width)
.attr('height', height);


let deathsArea = deaths.append('path').attr("class", "covid-area deaths-area")
let vaccinesArea = vaccines.append('path').attr("class", "covid-area vaccines-area")
let boostArea = vaccines.append('path').attr("class", "covid-area vaccines-area")

const xScale =  d3.scaleTime();
const yDeathsScale = d3.scaleLinear();
const yVaccinesScale = d3.scaleLinear();

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
.domain([d3.max(fullyVaccinatedExtent), 0])//requested to be hardcoded

const area = d3.area()
.curve(d3.curveLinear)
.x(d => xScale(d.date))
.y0(height - margin.bottom)

deathsArea
.attr("class", "covid-area deaths-area")
.attr("d", () => {
	area.y1(d => yDeathsScale(d.deaths))
	area.defined(d => d.deaths)
	return area(dataObj)
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
.data(dataObj.filter(d => d.text != ''))
.enter()
.append('path')
.attr('class', d => console.log(d))
.attr('d', d => `M${xScale(d.date)},${yDeathsScale(d.deaths)}L${xScale(d.date)},${height - margin.bottom}`)
.attr('stroke', 'black')

const deathsDates = deaths.selectAll('blah')
.data(dataObj.filter(d => d.text != ''))
.enter()
.append('text')
.attr('transform', d => `translate(${xScale(d.date)},${yDeathsScale(d.deaths)})`)
.text(d => d.date.format('DD/MM') + '-' + d.deaths)

const vaccineMarks = vaccines.selectAll('blah')
.data(dataObj.filter(d => d.text != ''))
.enter()
.append('path')
.attr('d', d => `M${xScale(d.date)},${yVaccinesScale(d.vaccines)}L${xScale(d.date)},${height - margin.bottom}`)
.attr('stroke', 'black')

const vaccinesDates = vaccines.selectAll('blah')
.data(dataObj.filter(d => d.text != ''))
.enter()
.append('text')
.attr('transform', d => `translate(${xScale(d.date)},${yVaccinesScale(d.vaccines)})`)
.text(d => d.date.format('DD/MM') + '-' + d.vaccines + '-' + d.booster)



