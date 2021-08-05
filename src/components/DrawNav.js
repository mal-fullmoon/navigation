import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import {Icon, Stroke, Style,Circle,Fill} from 'ol/style';
import {Draw, Modify, Snap} from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {getUid} from 'ol/util';
import * as turf from '@turf/turf';
 
class DrawNav{
	constructor(opt,map){
		this.id = opt.id ? opt.id : getUid(opt);
		this.olMap = map;
		this.points_extent = new Array(4);
		this.viewZoom = map.getView().getZoom();
		this.default_style_opt = {
			line_width:5,
			line_stroke:'#459c50',
			interval:40,
		}
		this.style = Object.assign({},this.default_style_opt,opt.style);
		this.init()
	}
	init(){
		this.olSource_line = new VectorSource();
		this.olLayer_line = new VectorLayer({
			source: this.olSource_line,
			style: (feature)=>{
				let coords = feature.getGeometry().getCoordinates();
				return [
					new Style({
						stroke: new Stroke({
							color: this.style.line_stroke,
							width: this.style.line_width,
						}),
					}),
					...this.getPoints(coords)
				]
			},
		});
		this.olMap.addLayer(this.olLayer_line);
		this.draw = new Draw({
			source:this.olSource_line,
			type: "LineString",
			style:(fea)=>{
				if(fea.getGeometry() instanceof LineString){
					let coords =  fea.getGeometry().getCoordinates()
					return [
						new Style({
							stroke: new Stroke({
								color: this.style.line_stroke,
								width: this.style.line_width,
							}),
						}),
						...this.getPoints(coords)
					]
				}
				else{
					return [
						new Style({
							image: new Circle({
								radius:4,
								fill:new Fill({
									color:'#fff'
								}),
								stroke: new Stroke({
									color: "#2196f3",
									width: 2,
								}),
							})
						}),
					]
				}

			},
		})
		this.olMap.addInteraction(this.draw)
		this.modify = new Modify({source:this.olSource_line});
		this.olMap.addInteraction(this.modify);
		this.snap = new Snap({source: this.olSource_line});
		this.olMap.addInteraction(this.snap);

	}
	getPoints(coords){
		let this_ = this;
		let styles = [];
		let extent_ = this.getPointExtent();
		let line_ = turf.lineString(coords);
		let line_clip_arr = turf.bboxClip(line_,extent_)
		if(line_clip_arr && line_clip_arr.geometry){
			if(line_clip_arr.geometry.type == "LineString"){
				let style_ = this_.getPointsByLine(line_clip_arr.geometry.coordinates);
				styles.push(...style_)
			}else if(line_clip_arr.geometry.type == "MultiLineString"){
				line_clip_arr.geometry.coordinates.forEach(coords=>{
					let style_ = this_.getPointsByLine(coords)
					styles.push(...style_)
				})
			}
		}
		return styles
	}
	getPointsByLine(coords){
		let this_ = this;
		let styles=[];
		let distance_ = this_.style.interval/2;//首个点放置在距离起点1/2间隔的位置
		let pix_start = this_.olMap.getPixelFromCoordinate(coords[0])
		let pix_end
		for(let i = 1;i<coords.length;i++){
			let coord_,coord_pix;
			let style_;
			pix_end = this_.olMap.getPixelFromCoordinate(coords[i]);
			let dis_start2end = Math.sqrt(Math.pow((pix_start[0]-pix_end[0]),2)+Math.pow((pix_start[1]-pix_end[1]),2))//计算收尾在屏幕上的距离
			if(dis_start2end > distance_){//距离大于间隔
				//计算距离开始点位的像素值
				coord_pix = [
					(distance_ * (pix_end[0] - pix_start[0])) / dis_start2end + pix_start[0],
					(distance_ * (pix_end[1] - pix_start[1])) / dis_start2end + pix_start[1]
				];
				//计算经纬度
				coord_ = this_.olMap.getCoordinateFromPixel(coord_pix);
				style_ = new Style({
					geometry: new Point(coord_),
					image: new Icon({
						src: 'img/arrow1.png',
						rotateWithView: true,
						rotation: Math.PI + Math.atan2(pix_end[1]-pix_start[1],pix_end[0]-pix_start[0]),
						scale:this.style.line_width/12,
						// imgSize:[this.style.line_width,this.style.line_width]
					}),
				})
				//下次循环开始点为当前点
				pix_start = coord_pix;
				distance_ = this_.style.interval;
				i--;
			}else if(dis_start2end == distance_){//距离等于间隔
				style_=new Style({
					geometry:new Point(coords[i]),
					image: new Icon({
						src: 'img/arrow1.png',
						rotateWithView: true,
						rotation: Math.PI + Math.atan2(pix_end[1]-pix_start[1],pix_end[0]-pix_start[0]),
						scale:this.style.line_width/12,
						// imgSize:[this.style.line_width,this.style.line_width]
					}),
				})
				pix_start = pix_end;
				distance_ = this_.style.interval;
			}else{//距离小于间隔
				distance_ = distance_ - dis_start2end;
				pix_start = pix_end;
			}
			// fea_ && feas.push(fea_);
			style_ && styles.push(style_)
		}
		return styles
	}
	getPointExtent(n){
		n = n ? n : 1.2;
		let view = this.olMap.getView();
		let mapsize = this.olMap.getSize().map(it_=>{
			return it_*n
		});
		return view.calculateExtent(mapsize);
	}
}
export default DrawNav