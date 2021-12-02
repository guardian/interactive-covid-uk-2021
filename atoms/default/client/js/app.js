import * as d3B from 'd3'
import { numberWithCommas } from 'shared/js/util'
import ScrollyTeller from "shared/js/ScrollyTellerProgress";

const d3 = Object.assign({}, d3B);

const atomEl = d3.select('.uk-covid-wrapper').node();

const isMobile = window.matchMedia('(max-width: 600px)').matches;

const width = atomEl.getBoundingClientRect().width;
const height = width * 2.5 / 5;

const margin = {left:40, top:10, right:25, bottom:25}

const chart = d3.select('.uk-covid-wrapper')
.append('svg')
.attr('id', 'covid-uk-chart')
.attr('width', width)
.attr('height', height);

const axis = chart.append('g')
const lines = chart.append('g')


d3.json('https://interactive.guim.co.uk/docsdata-test/1XymBcR_xu0GwpGFsoICE22NH1o_beJ5BiINB6NS6fLg.json')
.then(rawdata => {

	const data = rawdata.sheets['master-data'];

	const parseDate = d3.timeParse("%d/%m/%Y");

	const dates = data.map(d =>parseDate(d.Day))

	const dataObj = data.map(d => {

		return {date:parseDate(d.Day), deaths:+d.rolling_deaths, vaccines:+d.fully_vaccinated_rate, booster:+d.booster_rate}
		
	});

	const datesExtent = d3.extent(dataObj, d => d.date);

	const rollingDeathsExtent = d3.extent(dataObj.map(d => +d.deaths))

	const fullyVaccinatedExtent = d3.extent(dataObj.map(d => +d.vaccines))

	const xScale =  d3.scaleTime()
	.range([margin.left, width - margin.right])
	.domain(datesExtent)

	const yDeathsScale = d3.scaleLinear()
	.range([margin.top, height - margin.bottom])
	.domain([d3.max(rollingDeathsExtent), 0])

	const yVaccinesScale = d3.scaleLinear()
	.range([margin.top, height - margin.bottom])
	.domain([d3.max(fullyVaccinatedExtent), 0])

	const line = d3.line()
	.curve(d3.curveLinear)
	.x(d => xScale(d.date))

	const area = d3.area()
	.curve(d3.curveLinear)
    .x(line.x())
    .y0(yVaccinesScale(0))
    .y1(line.y())
	
	let xaxis = axis.append("g")
	.attr("transform", "translate(0," + (height - margin.bottom) + ")")
	.attr("class", "xaxis")
	.call(
		    d3.axisBottom(xScale)
		    .ticks(isMobile ? 3 : 5)
		    .tickFormat(d3.timeFormat("%b"))

	)
	.selectAll("text")
	

	let leftAxis = axis.append("g")
	.attr("class", "leftAxis")
	.attr("transform", `translate(${margin.left},0)`)
	.call(
		   d3.axisLeft(yDeathsScale)
		   .ticks(10)
	)
	.selectAll("text")
	.text(d => (+d).toLocaleString('en-GB',{maximumFractionDigits: 0}))

	let rightAxis = axis.append("g")
	.attr("class", "rightAxis")
	.attr("transform", `translate(${width - margin.right},0)`)
	.call(
		   d3.axisRight(yVaccinesScale)
		   .ticks(10)
	)
	.selectAll("text")
	.text(d => (+d).toLocaleString('en-GB',{maximumFractionDigits: 0}))

	let deathsLine = lines.append("path").attr("class", "covid-line deaths-line")
	let deathsArea = lines.append('path').attr("class", "covid-area deaths-area")
	let vaccinesLine = lines.append("path").attr("class", "covid-line vaccines-line")
	let vaccinesArea = lines.append('path').attr("class", "covid-area vaccines-area")
	let boostLine = lines.append("path").attr("class", "covid-line vaccines-line")
	let boostArea = lines.append('path').attr("class", "covid-area vaccines-area")

	/*lines.append("path")
	.datum(dataObj)
	.attr("class", "covid-line deaths-line")
	.attr("d", () => {

		line.y(d => yDeathsScale(d.deaths))
		line.defined(d => d.deaths)


		return line(dataObj)
	})*/


	
	const callback = () => console.log("do something") 

	const scrolly = new ScrollyTeller({
	    parent: document.querySelector("#gv-scrolly-1"),
	    triggerTop: 1/3, // percentage from the top of the screen that the trigger should fire
	    triggerTopMobile: 0.75,
	    transparentUntilActive: true,
	    callback:callback,
	    overall: () => {}
	})

	scrolly.gradual( (progressInBox, i, abs, total) => {
        //console.log("in box progress", progressInBox.toFixed(2))
	})

	scrolly.overall((overallProgress) => {

		let datePos = parseInt((overallProgress * 100) * dates.length / 100)
		console.log(datePos)
	    let currentDate =  dates[datePos]
	    let currentData = dataObj.filter(f => f.date <= currentDate)

	    deathsLine
		.attr("d", () => {
			line.y(d => yDeathsScale(d.deaths))
			line.defined(d => d.deaths)

			return line(currentData)
		})

		deathsArea
		.attr("d", () => {
			area.y1(line.y())
			area.defined(line.defined())

			return area(currentData)
		});

		vaccinesLine
		.attr("d", () => {
			line.y(d => yVaccinesScale(d.vaccines))
			line.defined(d => d.vaccines)

			return line(currentData)
		})

		vaccinesArea
		.attr("class", "covid-area vaccines-area")
		.attr("d", () => {

			area.y1(line.y())
			area.defined(line.defined())

			return area(currentData)
		});

		boostLine
		.datum(dataObj)
		.attr("d", () => {

			line.y(d => yVaccinesScale(d.booster))
			line.defined(d => d.booster)

			return line(currentData)
		})

		boostArea
		.datum(dataObj)
		.attr("d", () => {

			area.y1(line.y())
			area.defined(line.defined())

			return area(currentData)
		});


	})


	scrolly.watchScroll();

})

const makeScrolly = () => {

	
}

//_____________HELPERSS________________


const getLength = (path) => {
	return d3.create("svg:path").attr("d", path).node().getTotalLength();
}