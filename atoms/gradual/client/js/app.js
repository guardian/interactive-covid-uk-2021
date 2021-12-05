import * as d3B from 'd3'
import { numberWithCommas, round } from 'shared/js/util'
import ScrollyTeller from "shared/js/ScrollyTellerProgress";
import moment from 'moment'

const d3 = Object.assign({}, d3B);

const atomEl = d3.select('.uk-covid-wrapper').node();

const isMobile = window.top.matchMedia('(max-width: 600px)').matches;

const width = atomEl.getBoundingClientRect().width;
const height = window.top.innerHeight;

const margin = {left:0, top:10, right:0, bottom:100}

const chart = d3.select('.uk-covid-wrapper')
.append('svg')
.attr('id', 'covid-uk-chart')
.attr('width', width)
.attr('height', height);

const defs = chart.append('defs')
.append('clipPath')
.attr('id', 'clip-mask')


const axis = chart.append('g')
const areas = chart.append('g')
const lines = chart.append('g')
const dots = chart.append('g')

d3.json('https://interactive.guim.co.uk/docsdata-test/1XymBcR_xu0GwpGFsoICE22NH1o_beJ5BiINB6NS6fLg.json')
.then(rawdata => {

	const data = rawdata.sheets['master-data'];

	const dates = data.map(d => moment(d.Day, 'DD/MM/YYYY'))

	const dataObj = data.map(d => {

		let index = +d.stringency_index == 0 ? null : +d.stringency_index;

		return {date:moment(d.Day, 'DD/MM/YYYY'), deaths:+d.cum_deaths, vaccines:+d.fully_vaccinated_rate, booster:+d.booster_rate, stringency:index, title:d.annotation_title, text:d.annotation_text}
		
	});

	const annotationDates = dataObj.filter(d => d.text != '')

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



	let maskArea = d3.select('#clip-mask').append('path').attr("class", "covid-area")

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

	let deathsLabel = dots.append('text')
	.attr('cx', xScale(dataObj[0].date))
	.attr('cy', yDeathsScale(dataObj[0].deaths))
	.attr('class', 'deaths-text')

	let vaccinesLabel = dots.append('text')
	.attr('cx', xScale(dataObj[0].date))
	.attr('cy', yVaccinesScale(dataObj[0].vaccines))
	.attr('class', 'vaccines-text')

	const colors = ['#dadada', '#bdbdbd', '#a1a1a1', '#848484', '#676767'];

	const stringencyExtent = d3.extent(dataObj.map(d => d.stringency))

	const buckets = [20,40,60,80,100]

	let colorScale = d3.scaleThreshold()
	.range(colors)
	.domain(buckets);


	areas.selectAll('rect')
	.data(dataObj.filter(f => f.stringency ))
	.enter()
	.append('rect')
	.attr('class', 'stringency-rect')
	.style('clip-path', 'url(#clip-mask)')
	.attr('width', width / dates.length)
	.attr('height', height - margin.bottom - margin.top)
	.attr('x', (d,i) => `${(width / dates.length) * i}px`)
	.attr('y', margin.top + 'px')
	.style('fill', d => colorScale(d.stringency))

	annotationDates.forEach((d,i) => {

		if(d.text != '')
		{

			let blob = d3.select('.scroll-text')
			.append('div')
			.attr('class', 'scroll-text__inner')
			
			let div = blob.append('div')
			.attr('class','scroll-text__div')

			div
			.append('span')
			.html(d.date)
			
			div
			.append('h3')
			.html(d.title)

			div
			.append('p')
			.html(d.text)

		}
	})

	const scrolly = new ScrollyTeller({
		parent: document.querySelector("#gv-scrolly-1"),
	    triggerTop: .3, // percentage from the top of the screen that the trigger should fire
	    triggerTopMobile: 0.75,
	    transparentUntilActive: true,
	    overall: () => {}
	})

	let currentBlob = 0;

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

			maskArea.attr('d', deathsArea.attr('d') + vaccinesArea.attr('d'))


			if(currentData.at(-1))
			{
				d3.select('.chart-data').html(currentData.at(-1).date)

				deathsDot
				.attr('cx', xScale(currentData.at(-1).date))
				.attr('cy', yDeathsScale(currentData.at(-1).deaths))

				vaccinesDot
				.attr('cx', xScale(currentData[currentData.length-1].date))
				.attr('cy', yVaccinesScale(currentData[currentData.length-1].vaccines))
			}
			else{
				d3.select('.chart-data').html(annotationDates[i].date)

				deathsDot
				.attr('cx', xScale(annotationDates[i].date))
				.attr('cy', yDeathsScale(annotationDates[i].deaths))

				vaccinesDot
				.attr('cx', xScale(annotationDates[i].date))
				.attr('cy', yVaccinesScale(annotationDates[i].vaccines))
			}

			

		}
		catch (err){

			console.log(err)

		}


	})


	scrolly.watchScroll();

})



//_____________HELPERSS________________
