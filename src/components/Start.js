import 'ol/ol.css';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Fill, RegularShape, Stroke, Style} from 'ol/style';

class Start{
	constructor(opt,map){
		var stroke = new Stroke({color: 'black', width: 2});
		var fill = new Fill({color: 'red'});

		var styles = {
		'square': new Style({
			image: new RegularShape({
			fill: fill,
			stroke: stroke,
			points: 4,
			radius: 10,
			angle: Math.PI / 4,
			}),
		}),
		'rectangle': new Style({
			image: new RegularShape({
			fill: fill,
			stroke: stroke,
			radius: 20 / Math.SQRT2,
			radius2: 10,
			points: 4,
			angle: Math.PI,
			scale: [1, 0.5],
			}),
		}),
		'triangle': new Style({
			image: new RegularShape({
			fill: fill,
			stroke: stroke,
			points: 3,
			radius: 10,
			rotation: Math.PI / 4,
			angle: 0,
			}),
		}),
		'star': new Style({
			image: new RegularShape({
			fill: fill,
			stroke: stroke,
			points: 4,
			radius: 10,
			radius2: 4,
			angle: 0,
			}),
		}),
		'cross': new Style({
			image: new RegularShape({
			fill: fill,
			stroke: stroke,
			points: 4,
			radius: 10,
			radius2: 0,
			angle: 0,
			}),
		}),
		'x': new Style({
			image: new RegularShape({
			fill: fill,
			stroke: stroke,
			points: 4,
			radius: 10,
			radius2: 0,
			angle: Math.PI / 4,
			}),
		}),
		'stacked': [
			new Style({
			image: new RegularShape({
				fill: fill,
				stroke: stroke,
				points: 4,
				radius: 5,
				angle: Math.PI / 4,
				displacement: [0, 20],
			}),
			}),
			new Style({
			image: new RegularShape({
				fill: fill,
				stroke: stroke,
				points: 7,
				radius: 20,
				radius2: 5,
				// angle: Math.PI / 4,
			}),
			}) ],
		};

		var styleKeys = [
			'x',
			'cross',
			'star',
			'triangle',
			'square',
			'rectangle',
			'stacked' 
		];
		var count = 1250;
		var features = new Array(count);
		var e = 8500000;
		for (var i = 0; i < count; ++i) {
		var coordinates = [2 * e * Math.random() - e, 2 * e * Math.random() - e];
		features[i] = new Feature(new Point(coordinates));
		features[i].setStyle(
			styles[styleKeys[Math.floor(Math.random() * styleKeys.length)]]
		);
		}

		var source = new VectorSource({
			features: features,
		});

		var vectorLayer = new VectorLayer({
			source: source,
		});
		map.addLayer(vectorLayer);
	}
}

export default Start