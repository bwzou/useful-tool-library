/**
 * 在进行地图开发过程中，我们一般能接触到以下三种类型的地图坐标系：
 *
 * 1.WGS－84原始坐标系
 * 一般用国际GPS纪录仪记录下来的经纬度，通过GPS定位拿到的原始经纬度，Google和高德地图定位的的经纬度（国外）都是基于WGS－84坐标系的；
 * 但是在国内是不允许直接用WGS84坐标系标注的，必须经过加密后才能使用；
 *
 * 2.GCJ－02坐标系
 * GCJ－02坐标系又名“火星坐标系”，是我国国测局独创的坐标体系，由WGS－84加密而成，在国内，必须至少使用GCJ－02坐标系，或者使用在GCJ－02
 * 加密后再进行加密的坐标系，如百度坐标系。高德和Google在国内都是使用GCJ－02坐标系，可以说，GCJ－02是国内最广泛使用的坐标系；
 *
 * 3.百度坐标系:bd-09
 * 百度坐标系是在GCJ－02坐标系的基础上再次加密偏移后形成的坐标系，只适用于百度地图。
 *
 * 参考 https://www.jianshu.com/p/8975586a820e
 */

function Conversion(){
  this.a = 6378245.0;
  this.ee = 0.00669342162296594323;
  this.pi = 3.1415926535897932384626;
  this.x_pi = 3.14159265358979324 * 3000.0 / 180.0;
}

Conversion.prototype.transformLat = function(x,y){
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * this.pi) + 20.0 * Math.sin(2.0 * x * this.pi)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * this.pi) + 40.0 * Math.sin(y / 3.0 * this.pi)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * this.pi) + 320 * Math.sin(y * this.pi / 30.0)) * 2.0 / 3.0;
  return ret;
};

Conversion.prototype.transformLon = function(x,y){
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * this.pi) + 20.0 * Math.sin(2.0 * x * this.pi)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * this.pi) + 40.0 * Math.sin(x / 3.0 * this.pi)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * this.pi) + 300.0 * Math.sin(x / 30.0
    * this.pi)) * 2.0 / 3.0;
  return ret;
};

Conversion.prototype.transform = function(lat ,lon){
  if (this.outOfChina(lat, lon)) {
    return [lat,lon];
  }
  let dLat = this.transformLat(lon - 105.0, lat - 35.0);
  let dLon = this.transformLon(lon - 105.0, lat - 35.0);
  let radLat = lat / 180.0 * this.pi;
  let magic = Math.sin(radLat);
  magic = 1 - this.ee * magic * magic;
  let sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((this.a * (1 - this.ee)) / (magic * sqrtMagic) * this.pi);
  dLon = (dLon * 180.0) / (this.a / sqrtMagic * Math.cos(radLat) * this.pi);
  let mgLat = lat + dLat;
  let mgLon = lon + dLon;

  return [mgLat, mgLon];
};

Conversion.prototype.outOfChina = function(lat, lon) {
  if (lon < 72.004 || lon > 137.8347)
    return true;
  if (lat < 0.8293 || lat > 55.8271)
    return true;
  return false;
};

/**
 * WGS-84 to 火星坐标系 (GCJ-02) World Geodetic System ==> Mars Geodetic System
 *
 * @param lat
 * @param lon
 * @return
 */
Conversion.prototype.WGS84_To_GCJ02 = function(lat,lon) {
  if (this.outOfChina(lat, lon)) {
    return [lat,lon];
  }
  let dLat = this.transformLat(lon - 105.0, lat - 35.0);
  let dLon = this.transformLon(lon - 105.0, lat - 35.0);
  let radLat = lat / 180.0 * this.pi;
  let magic = Math.sin(radLat);
  magic = 1 - this.ee * magic * magic;
  let sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((this.a * (1 - this.ee)) / (magic * sqrtMagic) * this.pi);
  dLon = (dLon * 180.0) / (this.a / sqrtMagic * Math.cos(radLat) * this.pi);
  let mgLat = lat + dLat;
  let mgLon = lon + dLon;
  return [mgLat, mgLon];
};

/**
 * 火星坐标系 (GCJ-02) to WGS-84
 *
 * @param lon
 * @param lat
 * @return
 */
Conversion.prototype.GCJ02_To_WGS84 = function(lat, lon) {
  let gps = this.transform(lat, lon);
  let longitude = lon * 2 - gps[1];
  let latitude = lat * 2 - gps[0];
  return [latitude, longitude];
};

/**
 * 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换算法 将 GCJ-02 坐标转换成 BD-09 坐标
 *
 * @param lat
 * @param lon
 * @return
 */
Conversion.prototype.GCJ02_To_BD09 = function(lat,lon) {
  let x = lon, y = lat;
  let z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * this.x_pi);
  let theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * this.x_pi);
  let tempLon = z * Math.cos(theta) + 0.0065;
  let tempLat = z * Math.sin(theta) + 0.006;
  return [tempLat,tempLon];
};

/**
 * 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换算法 将 BD-09 坐标转换成GCJ-02 坐标
 *
 * @param lat
 * @param lon
 * @return
 */
Conversion.prototype.BD09_To_GCJ02 = function(lat, lon) {
  let x = lon - 0.0065, y = lat - 0.006;
  let z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * this.x_pi);
  let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * this.x_pi);
  let tempLon = z * Math.cos(theta);
  let tempLat = z * Math.sin(theta);
  return [tempLat,tempLon];
};

/**
 * 将gps84转为bd09
 *
 * @param lat
 * @param lon
 * @return
 */
Conversion.prototype.WGS84_To_BD09 = function(lat,lon){
  let gcj02 = this.GCJ02_To_WGS84(lat,lon);
  let bd09 = this.GCJ02_To_BD09(gcj02[0],gcj02[1]);
  return bd09;
};

/**
 * 将bd09转为gps84
 *
 * @param lat
 * @param lon
 * @return
 */
Conversion.prototype.BD09_To_WGS84 = function(lat,lon){
  let gcj02 = this.BD09_To_GCJ02(lat, lon);
  let gps84 = this.GCJ02_To_WGS84(gcj02[0], gcj02[1]);
  //保留小数点后六位
  gps84[0] = this.retain8(gps84[0]);
  gps84[1] = this.retain8(gps84[1]);
  return gps84;
};

/**保留小数点后8位
 * @param num
 * @return
 */
Conversion.prototype.retain8 = function(num){
  return num.toFixed(8);
};

export default Conversion;
