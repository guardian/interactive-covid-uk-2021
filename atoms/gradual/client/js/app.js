import * as d3B from 'd3'
import { numberWithCommas, round } from 'shared/js/util'
import ScrollyTeller from "shared/js/ScrollyTellerProgress";
import moment from 'moment'

const d3 = Object.assign({}, d3B);

const atomEl = d3.select('.uk-covid-wrapper').node();
const tooltip = d3.select('.chart-data');
const date = tooltip.append('div').attr('class','tooltip-element date')
const ranking = tooltip.append('div').attr('class','tooltip-element ranking')
const deaths = tooltip.append('div').attr('class','tooltip-element deaths')
const vaccines = tooltip.append('div').attr('class','tooltip-element vaccines')
const booster = tooltip.append('div').attr('class','tooltip-element booster')

const isMobile = window.top.matchMedia('(max-width: 600px)').matches;

const width = isMobile ? atomEl.getBoundingClientRect().width : atomEl.getBoundingClientRect().width * .6;
const height = isMobile ? window.top.innerHeight / 2 : window.top.innerHeight * .6;

const margin = {left:25, top:50, right:55, bottom:20}

const chart = d3.select('.uk-covid-wrapper')
.append('svg')
.attr('id', 'covid-uk-chart')
.attr('width', width)
.attr('height', height);

const defs = chart.append('defs')

let mask = defs
.append('clipPath')
.attr('id', 'clip-mask')

let linearGradient = defs.append('linearGradient')
.attr('id','grad1')
.attr('x1', '0%')
.attr('y1', '0%')
.attr('x2', '100%')
.attr('y2', '0%')

let gradient = chart
.append('rect')
.attr('width', width)
.attr('height', height)
.style('fill', 'url(#grad1')
.style('clip-path', 'url(#clip-mask)')

const gradientTones = ['#ffffff', '#dadada', '#bdbdbd', '#a1a1a1', '#848484'];

const colorScale = d3.scaleThreshold()
.range(gradientTones)
.domain([20,40,60,80,100]);

const axis = chart.append('g')
const areas = chart.append('g')
const lines = chart.append('g')
const dots = chart.append('g')


let deathsArea = lines.append('path').attr("class", "covid-area deaths-area")
let vaccinesArea = lines.append('path').attr("class", "covid-area vaccines-area")
let boostArea = lines.append('path').attr("class", "covid-area vaccines-area")

let deathsLine = lines.append("path").attr("class", "covid-line deaths-line")
let vaccinesLine = lines.append("path").attr("class", "covid-line vaccines-line")
let boostLine = lines.append("path").attr("class", "covid-line boost-line")

let mark = lines.append('path').attr('class', 'date-mark').attr('d', `M0,${margin.top},0,${height-margin.bottom}`)

let maskArea = d3.select('#clip-mask').append('path').attr("class", "covid-area")

d3.json('https://interactive.guim.co.uk/docsdata-test/1XymBcR_xu0GwpGFsoICE22NH1o_beJ5BiINB6NS6fLg.json')
.then(rawdata => {

	const data = rawdata.sheets['master-data'];

	const dates = data.map(d => moment(d.Day, 'DD/MM/YYYY'))

	const dataObj = data.map(d => {

		let index = +d.stringency_index == 0 ? null : +d.stringency_index;

		return {date:moment(d.Day, 'DD/MM/YYYY'), deaths:+d.cum_deaths, vaccines:+d.fully_vaccinated_rate, booster:+d.booster_rate, stringency:+d.stringency_index, ranking:d.stringency_ranking, title:d.annotation_title, text:d.annotation_text}
		
	});

	let stringency = {date:dataObj[0].date, stringency:dataObj[0].stringency};

	linearGradient.append('stop')
	.attr('offset', '0%')
	.style('stop-color',colorScale(stringency.stringency))

	const stringencyDates = dataObj.map((d,i) => {

		if(d.stringency != stringency.stringency){

			console.log(stringency.stringency , d.stringency, d.date.format('DD/MM/YYYY'))

			linearGradient.append('stop')
			.attr('offset', 0.27397260274 * i + '%')
			.style('stop-color',colorScale(stringency.stringency))

			stringency = {date:d.date, stringency:d.stringency};

			linearGradient.append('stop')
			.attr('offset', 0.27397260274 * i + '%')
			.style('stop-color',colorScale(d.stringency))
		}
	})

	const annotationDates = dataObj.filter(d => d.text != '')

	annotationDates.forEach((d,i) => {

		if(d.text != '')
		{

			let blob = d3.select('.scroll-text')
			.append('div')
			.attr('class', 'scroll-text__inner')
			.style('height', height + 'px')
			
			let div = blob.append('div')
			.attr('class','scroll-text__div')

			div
			.append('p')
			.attr('class','date')
			.html(d.date.format('MMM Do'))
			
			div
			.append('h3')
			.html(d.title)

			div
			.append('p')
			.attr('class','paragraph')
			.html(d.text)

		}
	})


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
		.ticks(12)
		.tickFormat(d3.timeFormat("%b"))

		)
	.selectAll("text")

	let leftAxis = axis.append("g")
	.attr("class", "leftAxis")
	.attr("transform", `translate(${margin.left},0)`)
	.call(
		d3.axisLeft(yDeathsScale)
		.ticks(4)
		.tickSizeInner(-width + margin.right)
		)
	.selectAll("text")
	.text(d => (+d).toLocaleString('en-GB',{maximumFractionDigits: 0}))

	let rightAxis = axis.append("g")
	.attr("class", "rightAxis")
	.attr("transform", `translate(${width - margin.right},0)`)
	.call(
		d3.axisRight(yVaccinesScale)
		.ticks(4)
		)
	.selectAll("text")
	.text(d => (+d).toLocaleString('en-GB',{maximumFractionDigits: 0}))

	let deathsDot = dots.append('circle')
	.attr('r', 6)
	.attr('cx', xScale(dataObj[0].date))
	.attr('cy', yDeathsScale(dataObj[0].deaths))
	.attr('class', 'deaths-dot')

	let vaccinesDot = dots.append('circle')
	.attr('r', 6)
	.attr('cx', xScale(dataObj[0].date))
	.attr('cy', yVaccinesScale(dataObj[0].vaccines))
	.attr('class', 'vaccines-dot')

	let boostDot = dots.append('circle')
	.attr('r', 6)
	.attr('cx', xScale(dataObj[0].date))
	.attr('cy', yVaccinesScale(dataObj[0].booster))
	.attr('class', 'boost-dot')

	let deathsLabel = dots.append('text')
	.attr('cx', xScale(dataObj[0].date))
	.attr('cy', yDeathsScale(dataObj[0].deaths))
	.attr('class', 'deaths-text')

	let vaccinesLabel = dots.append('text')
	.attr('cx', xScale(dataObj[0].date))
	.attr('cy', yVaccinesScale(dataObj[0].vaccines))
	.attr('class', 'vaccines-text')


	const scrolly = new ScrollyTeller({
		parent: document.querySelector("#gv-scrolly-1"),
	    triggerTop: 0.01/*(height / 2) / window.top.innerHeight */, // percentage from the top of the screen that the trigger should fire
	    triggerTopMobile: 0.75,
	    transparentUntilActive: true,
	    overall: () => {}
	})

	//let prevHeight = +d3.select('.scroll-wrapper').style('height').split('px')[0];

	//d3.select('.scroll-wrapper').style('height', prevHeight + window.top.innerHeight + 'px')

	scrolly.gradual( (progressInBox, i, abs, total) => {

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

			deathsArea
			.attr("d", () => {
				area.y1(line.y())
				area.defined(line.defined())

				return area(allData)
			})

			vaccinesLine
			.attr("d", () => {
				line.y(d => yVaccinesScale(d.vaccines))
				line.defined(d => d.vaccines)

				return line(allData)
			})

			vaccinesArea
			.attr("class", "covid-area vaccines-area")
			.attr("d", () => {

				area.y1(line.y())
				area.defined(line.defined())

				return area(allData)
			});

			boostLine
			.attr("d", () => {

				line.y(d => yVaccinesScale(d.booster))
				line.defined(d => d.booster)

				return line(allData)
			})

			boostArea
			.attr("class", "covid-area boost-area")
			.attr("d", () => {

				area.y1(line.y())
				area.defined(line.defined())

				return area(allData)
			});
 
			maskArea
			.attr('d', deathsArea.attr('d') + vaccinesArea.attr('d'))


			if(currentData.at(-1))
			{

				date.html(currentData.at(-1).date.format('MMM Do'))
				ranking.html(currentData.at(-1).ranking)
				ranking.style('color', colorScale(currentData.at(-1).stringency))
				deaths.html(currentData.at(-1).deaths)
				vaccines.html(currentData.at(-1).vaccines)
				booster.html(currentData.at(-1).booster)
				
				tooltip.style('left', xScale(currentData.at(-1).date) + 'px')
				deaths.style('top', yDeathsScale(currentData.at(-1).deaths) + 'px')
				vaccines.style('top', yVaccinesScale(currentData.at(-1).vaccines) + 'px')
				booster.style('top', yVaccinesScale(currentData.at(-1).booster) + 'px')

				mark.style('transform', `translate(${xScale(currentData.at(-1).date)}px,0)`)

				deathsDot
				.attr('cx', xScale(currentData.at(-1).date))
				.attr('cy', yDeathsScale(currentData.at(-1).deaths))

				vaccinesDot
				.attr('cx', xScale(currentData[currentData.length-1].date))
				.attr('cy', yVaccinesScale(currentData[currentData.length-1].vaccines))

				boostDot
				.attr('cx', xScale(currentData[currentData.length-1].date))
				.attr('cy', yVaccinesScale(currentData[currentData.length-1].booster))
			}
			else{

				date.html(annotationDates[i].date.format('MMM Do'))
				ranking.html(annotationDates[i].ranking)
				ranking.style('color', colorScale(annotationDates[i].stringency))
				deaths.html(annotationDates[i].deaths)
				vaccines.html(annotationDates[i].vaccines)
				booster.html(annotationDates[i].booster)

				mark.style('transform', `translate(${xScale(annotationDates[i].date)}px,0)`)
				
				tooltip.style('left', xScale(annotationDates[i].date) + 'px')
				deaths.style('top', yDeathsScale(annotationDates[i].deaths) + 'px')
				vaccines.style('top', yVaccinesScale(annotationDates[i].vaccines) + 'px')
				booster.style('top', yVaccinesScale(annotationDates[i].booster) + 'px')

				deathsDot
				.attr('cx', xScale(annotationDates[i].date))
				.attr('cy', yDeathsScale(annotationDates[i].deaths))

				vaccinesDot
				.attr('cx', xScale(annotationDates[i].date))
				.attr('cy', yVaccinesScale(annotationDates[i].vaccines))

				boostDot
				.attr('cx', xScale(annotationDates[i].date))
				.attr('cy', yVaccinesScale(annotationDates[i].booster))
			}

			

		}
		catch (err){

			console.log(err)

		}


	})


	scrolly.watchScroll();

})



//_____________HELPERSS________________
