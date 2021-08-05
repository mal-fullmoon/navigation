import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Feature from 'ol/Feature';
import {Icon, Stroke, Style} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {fromLonLat} from 'ol/proj';
import {getUid} from 'ol/util';

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
		this.init();
		this.addData()
		map.getView().on("change:resolution",this.getPoints.bind(this))
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
						scale:this.style.line_width/14,
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
	getPoints(){
		if(!this.olSource_point || !this.geo_line){return}
		this.olSource_point.clear();
		let this_ = this;
		//从绘制的线中获取线的顶点集合
		let coords = this_.geo_line.getCoordinates();
		//用于存储feature的集合
		let feas = []
		//设置初始化的像素间隔，即线的第一个点与第一个标记点之间的像素间隔
		let distance_ = this_.style.interval/2;
		//获取线的第一点在屏幕的位置，即当前点为线第一点的顶点
		let pix_start = this_.olMap.getPixelFromCoordinate(coords[0])
		//计算标记点的参考点
		let pix_end
		for(let i = 1;i<coords.length;i++){
			let fea_
			//计算线的下一个定点在屏幕的像素位置
			pix_end = this_.olMap.getPixelFromCoordinate(coords[i]);
			//计算 当前点与线的下个顶点之间的距离
			let dis_start2end = Math.sqrt(Math.pow((pix_start[0]-pix_end[0]),2)+Math.pow((pix_start[1]-pix_end[1]),2))//计算收尾在屏幕上的距离
			//当距离大于间隔时
			if(dis_start2end > distance_){
				let coord_,coord_pix;
				//计算距离当前点位的像素值
				coord_pix = [
					(distance_ * (pix_end[0] - pix_start[0])) / dis_start2end + pix_start[0],
					(distance_ * (pix_end[1] - pix_start[1])) / dis_start2end + pix_start[1]
				];
				//转换为地图经纬度
				coord_ = this_.olMap.getCoordinateFromPixel(coord_pix);
				fea_ = new Feature({
					geometry:new Point(coord_)
				})
				//计算出旋转角度
				fea_.set('rotation_',Math.atan2(pix_end[1]-pix_start[1],pix_end[0]-pix_start[0]))
				//下次循环开始点为当前点
				pix_start = coord_pix;
				//将间隔重置为默认间隔
				distance_ = this_.style.interval;
				i--;
			}
			//距离等于间隔
			else if(dis_start2end == distance_){
				fea_ = new Feature({
					geometry:new Point(coords[i])
				})
				//计算出旋转角度
				fea_.set('rotation_',Math.atan2(pix_end[1]-pix_start[1],pix_end[0]-pix_start[0]))
				//下次循环开始点为当前点
				pix_start = pix_end;
				//将间隔重置为默认间隔
				distance_ = this_.style.interval;
			}
			//距离小于间隔
			else{
				//计算间隔
				distance_ = distance_ - dis_start2end;
				//下次循环开始点为当前点
				pix_start = pix_end;
			}
			fea_ && feas.push(fea_);
		}
		this.olSource_point.addFeatures(feas);
	}
}
export default NavigationLine;