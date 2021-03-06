//import mainHTML from "./atoms/gradual/server/templates/main.html!text"

import request from "request-promise"
import fs from "fs"
import moment from 'moment'

export async function render() {

	const rawData = await request({ "uri": 'https://interactive.guim.co.uk/docsdata-test/1XymBcR_xu0GwpGFsoICE22NH1o_beJ5BiINB6NS6fLg.json', json: true });

	let data = rawData.sheets['master-data']


	let html = ''
	let cont = 0;

	data.map( (d, i) => {

		if(d.annotation_text){

			let date = moment(d.Day, 'DD/MM/YYYY').format('D MMMM');

			let img = d.annotation_image != '' ? `<div class="timeline-img-wrapper"><div class="timeline-img" style="background-image: url(<%= path %>/media/${d.annotation_image});"></div></div>` : '';

			html += `<div class="scroll-text__inner blob-${cont}">
			    	<div class="date-bullet"></div>
			    		<div class="scroll-text__div">
			    			${img}
			    			<div class="blob-text-wrapper">
				    			<p class="date">${date}</p>
				    			<h3>${d.annotation_title}</h3>
				    			<p class="paragraph">${d.annotation_text}</p>
			    			</div>
			    		</div>
			    	</div>`
			cont ++
		}
    })

   fs.writeFileSync(`assets/json/data.json`, JSON.stringify(data));

   return `<div class="gv-text-section"></div>
   <div id="gv-scrolly-1">
    <div class="scroll-wrapper">
        <div class="scroll-inner">
        	<div class="uk-covid-wrapper">
	            <div class="svg-wrapper"></div>
	            <div class="chart-data">
	            	<div class="ranking">
	            		<p class="date"></p>
	            		<p class="ranking-annotation"></p>
	            		<p class="ranking-value"></p>
	            	</div>
	            	<div class="deaths"></div>
	            	<div class="vaccines"></div>
	            	<div class="booster">
	            		<p class="booster-value"></p>
	            		<p class="booster-text"></p>
	            	</div>
	            </div>
	         </div>
        </div>
    	<div class="scroll-text">${html}</div>
    </div>
</div>
<div class="gv-text-section"></div>`
   
} 