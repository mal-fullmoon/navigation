<template>
    <div class="map" id="map"></div>
</template>

<script>
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import NavigationLine from "./NavigationLine.js"
import DrawNav from "./DrawNav.js"
import Start from "./Start.js"
import * as turf from '@turf/turf';

export default {
    name: "MapContainer",
	methods:{
		createMap(){
			let map = new Map({
				layers: [new TileLayer({
					source: new OSM(),
				})],
				target: 'map',
				view: new View({
					maxZoom: 18,
					center: fromLonLat([108.92,34.28]),
					zoom: 3,
				}),
			});
			window.olMap = map;
			new NavigationLine({
				datas:[
					[{
						lon:10,
						lat:10,
					},{
						lon:120,
						lat:22,
					},{
						lon:120,
						lat:20,
					},{
						lon:10,
						lat:30,
					},{
						lon:10,
						lat:15,
					},{
						lon:120,
						lat:40,
					}],
					[{
						lon:15,
						lat:35,
					},{
						lon:125,
						lat:57,
					},{
						lon:125,
						lat:55,
					},{
						lon:15,
						lat:65,
					},{
						lon:25,
						lat:65,
					},{
						lon:125,
						lat:25,
					}]
				]
			},map)
			new DrawNav({},map)
			new Start({},map)

			var bbox = [-95, 30 ,-85, 40];
			var cellSide = 50;
			var options = {units: 'miles'};

			var triangleGrid = turf.triangleGrid(bbox, cellSide, options);
			console.log(triangleGrid)

		}
	},
	mounted(){
		this.createMap()
	}
};
</script>

<style scoped>
.map {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    position: relative;
	background: #1f3064;
}
</style>