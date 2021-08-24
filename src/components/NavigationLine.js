import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Feature from 'ol/Feature';
import {Icon, Stroke, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {fromLonLat} from 'ol/proj';
import {getUid} from 'ol/util';
import * as turf from '@turf/turf';
 
class NavigationLine{
	constructor(opt,map){
		this.id = opt.id ? opt.id : getUid(opt);
		this.datas = opt.datas;
		this.olMap = map;
		this.points_extent = new Array(4);
		this.viewZoom = map.getView().getZoom();
		this.default_style_opt = {
			line_width:5,
			line_stroke:'#459c50',
			interval:40,
		}
		this.style = Object.assign({},this.default_style_opt,opt.style);
		this.first_ = 0;
		this.init()
		this.addData()
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
						})
					}),
					...this.getPointsStyle(coords)
				]
			},
		});
		this.olMap.addLayer(this.olLayer_line);
		this.olLayer_line.on("postrender",this.animation.bind(this))
	}
	animation(){
		this.first_++;
		this.first_ = this.first_ % this.style.interval;
		this.olLayer_line.setStyle(this.olLayer_line.getStyle())
	}
	addData(){
		//添加线
		let feas = [];
		this.datas.forEach(item=>{
			let coords = item.map(data_ => {
				return fromLonLat([data_.lon,data_.lat])
			});
			this.geo_line = new LineString(coords)
			let fea_line = new Feature({
				geometry:this.geo_line,
			});
			feas.push(fea_line);
		})
		this.olSource_line.addFeatures(feas);
	}
	getPointsStyle(coords){
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
		let distance_ = this_.first_;//首个点放置在距离起点1/2间隔的位置
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
					}),
				})
				pix_start = pix_end;
				distance_ = this_.style.interval;
			}else{//距离小于间隔
				distance_ = distance_ - dis_start2end;
				pix_start = pix_end;
			}
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
export default NavigationLine