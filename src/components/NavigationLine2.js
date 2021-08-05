import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Feature from 'ol/Feature';
import {Icon, Stroke, Style} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {fromLonLat} from 'ol/proj';
import {getUid} from 'ol/util';
import * as turf from '@turf/turf';
class NavigationLine {
	constructor(opt,map){
		this.id = opt.id ? opt.id : getUid(opt);
		this.default_style_opt = {
			line_width:5,
			line_stroke:'#459c50',
			interval:40,
		}
		this.style = Object.assign({},this.default_style_opt,opt.style);
		this.olMap = map;
		this.datas = opt.datas;
		this.points_extent = new Array(4);
		this.viewZoom = map.getView().getZoom();
		this.init();
		this.addData()
		map.getView().on("change",this.getPoints.bind(this))
	}
	init(){
		this.olSource_line = new VectorSource();
		this.olLayer_line = new VectorLayer({
			source:this.olSource_line,
			style: ()=>{
				return new Style({
					stroke: new Stroke({
						color: this.style.line_stroke,
						width: this.style.line_width,
					}),
				})
			},
		})
		this.olSource_point = new VectorSource();
		this.olLayer_point = new VectorLayer({
			source:this.olSource_point,
			style: (feature)=>{
				let rotation = feature.get('rotation_');
				return new Style({
					image: new Icon({
						src: 'img/arrow1.png',
						rotateWithView: true,
						rotation: Math.PI + rotation,
						scale:this.style.line_width/12,
						// imgSize:[this.style.line_width,this.style.line_width]
					}),
				})
			}
		})
		this.olMap.addLayer(this.olLayer_line);
		this.olMap.addLayer(this.olLayer_point);
	}
	addData(){
		//添加线
		let coords = this.datas.map(data_ => {
			return fromLonLat([data_.lon,data_.lat])
		});
		this.geo_line = new LineString(coords)
		let fea_line = new Feature({
			geometry:this.geo_line,
		});
		this.olSource_line.addFeatures([fea_line]);
		this.getPoints()
	}
	getPoints(e){
		if(!this.olSource_point || !this.geo_line){return}
		let extent_ = this.getPointExtent(1);
		//判断当前视野范围是否在计算的1.5倍视野范围内，
		//在范围内不用继续计算，还是使用之前计算的piont
		//不在范围内的时候计算point
		if(!this.zoomChanged() && this.points_extent[0] < extent_[0] && this.points_extent[1] < extent_[1] && extent_[2] < this.points_extent[2] && extent_[3] < this.points_extent[3]){
			return
		}
		this.points_extent = this.getPointExtent(1.5);
		this.olSource_point.clear();
		let this_ = this;
		let coords = this_.geo_line.getCoordinates();

		let line_ = turf.lineString(coords);
		let line_clip_arr = turf.bboxClip(line_,this.points_extent)
		if(line_clip_arr && line_clip_arr.geometry){
			if(line_clip_arr.geometry.type == "LineString"){
				this_.getPointsByLine(line_clip_arr.geometry.coordinates)
			}else if(line_clip_arr.geometry.type == "MultiLineString"){
				line_clip_arr.geometry.coordinates.forEach(coords=>{
					this_.getPointsByLine(coords)
				})
			}
		}
	}
	getPointsByLine(coords){
		let this_ = this;
		let feas = []
		let distance_ = this_.style.interval/2;//首个点放置在距离起点1/2间隔的位置
		let pix_start = this_.olMap.getPixelFromCoordinate(coords[0])
		let pix_end
		for(let i = 1;i<coords.length;i++){
			let coord_,coord_pix;
			let fea_
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
				fea_ = new Feature({
					geometry:new Point(coord_)
				})
				fea_.set('rotation_',Math.atan2(pix_end[1]-pix_start[1],pix_end[0]-pix_start[0]))
				//下次循环开始点为当前点
				pix_start = coord_pix;
				distance_ = this_.style.interval;
				i--;
			}else if(dis_start2end == distance_){//距离等于间隔
				fea_ = new Feature({
					geometry:new Point(coords[i])
				})
				fea_.set('rotation_',Math.atan2(pix_end[1]-pix_start[1],pix_end[0]-pix_start[0]))
				pix_start = pix_end;
				distance_ = this_.style.interval;
			}else{//距离小于间隔
				distance_ = distance_ - dis_start2end;
				pix_start = pix_end;
			}
			fea_ && feas.push(fea_);
		}
		this.olSource_point.addFeatures(feas);
	}
	getPointExtent(n){
		n = n ? n : 1;
		let view = this.olMap.getView();
		let mapsize = this.olMap.getSize().map(it_=>{
			return it_*n
		});
		return view.calculateExtent(mapsize);
	}
	zoomChanged(){
		let view = this.olMap.getView();	
		if( Math.abs(this.viewZoom - view.getZoom() ) >= 1 ){
			this.viewZoom = view.getZoom();
			return true
		}else{
			return false
		}
	}
}
export default NavigationLine;