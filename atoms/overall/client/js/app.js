import * as d3B from 'd3'
import { numberWithCommas, round } from 'shared/js/util'
import ScrollyTeller from "shared/js/ScrollyTellerProgress";
import moment from 'moment'

const d3 = Object.assign({}, d3B);

const atomEl = d3.select('.uk-covid-wrapper').node();

const isMobile = window.matchMedia('(max-width: 600px)').matches;

const width = atomEl.getBoundingClientRect().width;
const height = isMobile ? window.innerHeight : width * 2.5 / 5;

const margin = {left:40, top:10, right:25, bottom:25}

const chart = d3.select('.uk-covid-wrapper')
.append('svg')
.attr('id', 'covid-uk-chart')
.attr('width', width)
.attr('height', height);

const axis = chart.append('g')
const lines = chart.append('g')
const dots = chart.append('g')


d3.json('https://interactive.guim.co.uk/docsdata-test/1XymBcR_xu0GwpGFsoICE22NH1o_beJ5BiINB6NS6fLg.json')
.then(rawdata => {

	const data = rawdata.sheets['master-data'];

	const parseDate = d3.timeParse("%d/%m/%Y");

	const dates = data.map(d => moment(d.Day, 'DD/MM/YYYY'))

	const dataObj = data.map(d => {

		return {date:moment(d.Day, 'DD/MM/YYYY'), deaths:+d.cum_deaths, vaccines:+d.fully_vaccinated_rate, booster:+d.booster_rate, title:d.annotation_title, text:d.annotation_text}
		
	});

	const annotationDates = dataObj.filter(d => d.title != '')

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

	let deathsDot = dots.append('circle')
	.attr('r', 12)
	.attr('cx', xScale(dataObj[0].date))
	.attr('cy', yDeathsScale(dataObj[0].deaths))
	.attr('class', 'deaths-dot')

	let vaccinesDot = dots.append('circle')
	.attr('r', 12)
	.attr('cx', xScale(dataObj[0].date))
	.attr('cy', yVaccinesScale(dataObj[0].deaths))
	.attr('class', 'vaccines-dot')
	let acum = 0;



	


	annotationDates.forEach((d,i) => {


		let blob = d3.select('.scroll-text')
		.append('div')
		.attr('class', 'scroll-text__inner')

		let div = blob.append('div')
		.attr('class','scroll-text__div blob-' + d.date.format('DDMMYYYY'))

		div
		.append('span')
		.html(d.date.format('DD/MM/YYYY'))

		div
		.append('h3')
		.html(d.title)

		div
		.append('p')
		.html(d.text)

	})



	

	const scrolly = new ScrollyTeller({
		height:5000,
		parent: document.querySelector("#gv-scrolly-1"),
	    triggerTop: 1/3, // percentage from the top of the screen that the trigger should fire
	    triggerTopMobile: 0.75,
	    transparentUntilActive: true,
	    overall: () => {}
	})

	scrolly.gradual( (progressInBox, i, abs, total) => {




		/*try{

			const pointA = dates[0];
			const pointB = annotationDates[i];


			console.log(pointA.format('DD-MM-YYYY'),pointB.format('DD-MM-YYYY'), pointB.diff(pointA, 'days'))



			

		}
		catch (err){

			console.log(err)

		}*/


	})

	scrolly.overall((overallProgress) => {

		console.log(overallProgress)


		let datePos = parseInt((overallProgress * 100) * dates.length / 100)

		let currentDate =  dates[datePos]
		let currentData = dataObj.filter(f => f.date <= currentDate)
		let currentAnnotation = annotationDates.filter(f => f.date <= currentDate).at(-1)
		let pastAnnotation = annotationDates.filter(f => f.date <= currentDate).at(-2)

		if(pastAnnotation){
			d3.select('.blob-' + pastAnnotation.date.format('DDMMYYYY'))
			.style('opacity', .2)
			.style('top', -100 + 'px')
		}


		d3.select('.blob-' + currentAnnotation.date.format('DDMMYYYY'))
		.style('opacity', 1)
		.style('top', 0)

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
		.attr("d", () => {

			line.y(d => yVaccinesScale(d.booster))
			line.defined(d => d.booster)

			return line(currentData)
		})

		boostArea
		.attr("d", () => {

			area.y1(line.y())
			area.defined(line.defined())

			return area(currentData)
		});

		deathsDot
		.attr('cx', xScale(currentData[currentData.length-1].date))
		.attr('cy', yDeathsScale(currentData[currentData.length-1].deaths))

		vaccinesDot
		.attr('cx', xScale(currentData[currentData.length-1].date))
		.attr('cy', yVaccinesScale(currentData[currentData.length-1].vaccines))


	})


	scrolly.watchScroll();

})



//_____________HELPERSS________________


const getLength = (path) => {
	return d3.create("svg:path").attr("d", path).node().getTotalLength();
}