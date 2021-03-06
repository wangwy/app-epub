/**
 * Created by wangwy on 15-3-9.
 */

var EPUB = require("./base.js");
EPUB.Utils = {};

/**
 * 格式化路径
 * @param url
 * @returns {{protocol: string, host: string, path: string, origin: string, directory: string, base: string, filename: string, extension: string, fragment: string, href: *}}
 */
EPUB.Utils.parseUrl = function (url) {
  var uri = {
        protocol: '',
        host: '',
        path: '',
        origin: '',
        directory: '',
        base: '',
        filename: '',
        extension: '',
        fragment: '',
        href: url
      },
      blob = url.indexOf('blob:'),
      doubleSlash = url.indexOf('://'),
      search = url.indexOf('?'),
      fragment = url.indexOf('#'),
      withoutProtocol,
      dot,
      firstSlash;

  if (blob === 0) {
    uri.protocol = "blob";
    uri.base = url.indexOf(0, fragment);
    return uri;
  }

  if (fragment != -1) {
    uri.search = url.slice(fragment + 1);
    uri.href = url.slice(0, fragment);
  }

  if (search != -1) {
    uri.search = url.slice(search + 1);
    uri.href = url.slice(0, search);
  }

  if (doubleSlash != -1) {
    uri.protocol = url.slice(0, doubleSlash);
    withoutProtocol = url.slice(doubleSlash + 3);
    firstSlash = withoutProtocol.indexOf('/');

    if (firstSlash === -1) {
      uri.host = uri.path;
      uri.path = "";
    } else {
      uri.host = withoutProtocol.slice(0, firstSlash);
      uri.path = withoutProtocol.slice(firstSlash);
    }

    uri.origin = uri.protocol + "://" + uri.host + "/";
    uri.directory = this.formatFolder(uri.path);
    uri.base = uri.origin + uri.directory;
  } else {
    uri.path = url;
    uri.directory = this.formatFolder(url);
    uri.base = uri.directory;
  }

  uri.filename = url.replace(uri.base, '');
  dot = uri.filename.lastIndexOf('.');
  if (dot != -1) {
    uri.extension = uri.filename.slice(dot + 1);
  }
  return uri;
};

/**
 * 获取文件
 * @param url
 * @returns {string}
 */
EPUB.Utils.formatFolder = function (url) {
  var lastSlash = url.lastIndexOf('/');
  if (lastSlash == -1) var folder = '';
  folder = url.slice(0, lastSlash + 1);
  return folder;
};

/**
 * 对Date的扩展，将 Date 转化为指定格式的String
 * @param fmt
 * @returns {*}
 * @constructor
 */
Date.prototype.Format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
};

/**
 * 获取css属性的值
 * @param o
 * @param key
 * @returns {*}
 */
EPUB.Utils.getCss = function (o, key) {
  return o.currentStyle ? o.currentStyle[key] : window.getComputedStyle(o, null)[key];
};

/**
 * 改变css属性的值
 * @param myclass
 * @param attr
 * @param value
 */
EPUB.Utils.changeCss = function(myclass,attr,value){
  var CSSRules;
  if(document.all){
    CSSRules = 'rules';
  }else if(document.getElementById){
    CSSRules = 'cssRules';
  }
  for(var i = 0; i < document.styleSheets[0][CSSRules].length; i++){
    if(document.styleSheets[0][CSSRules][i].selectorText == myclass){
      document.styleSheets[0][CSSRules][i].style[attr] = value;
    }
  }
};
/**
 * 获取元素在页面中的文档坐标
 * @param element
 * @returns {{top: number, left: number}}
 */
EPUB.Utils.offset = function (element) {
  var docElem, win, elem = element, box = {top: 0, left: 0}, doc = elem && elem.ownerDocument;
  if (!doc) {
    return;
  }
  docElem = doc.documentElement;
  if (!this.contains(docElem, elem)) {
    return box;
  }

  if (typeof elem.getBoundingClientRect() !== "undefined") {
    box = elem.getBoundingClientRect();
  }
  win = this.getWindow(doc);
  return {
    top: box.top + win.pageYOffset - docElem.clientTop,
    left: box.left + win.pageXOffset - docElem.clientLeft
  };
};

/**
 * 判断a,b是否是断开的节点
 * @param a
 * @param b
 * @returns {boolean}
 */
EPUB.Utils.contains = function (a, b) {
  var adown = a.nodeType === 9 ? a.documentElement : a,
      bup = b && b.parentNode;
  return a === bup || !!( bup && bup.nodeType === 1 && adown.contains(bup) );
};

/**
 * 判断这个节点是否是window
 * @param obj
 * @returns {boolean}
 */
EPUB.Utils.isWindow = function (obj) {
  return obj != null && obj === obj.window;
};

/**
 * 获取window
 * @param elem
 * @returns {*}
 */
EPUB.Utils.getWindow = function (elem) {
  return this.isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
};

/**
 * 将json转换成formdata形式的字符串
 * @param json
 * @returns {string}
 * @constructor
 */
EPUB.Utils.JsonToFormData = function (json) {
  var string = "";
  for (var o in json) {
    string += o + "=" + json[o] + "&"
  }
  return string.slice(0, -1);
};

/**
 * 模拟jquery的animate函数
 * @param obj
 * @param attr
 * @param target
 * @param fn
 */
EPUB.Utils.startrun = function(obj, attr, target, fn){
  var that = this;
  clearInterval(obj.timer);
  obj.timer = setInterval(function () {
    var cur = 0;
    if (attr == "opacity") {
      cur = Math.round(parseFloat(that.getCss(obj, attr)) * 100);
    } else {
      cur = parseInt(that.getCss(obj, attr));
    }
    var speed = (target - cur) / 8;
    speed = speed > 0 ? Math.ceil(speed) : Math.floor(speed);

    if (cur == target) {
      clearInterval(obj.timer);
      if (fn) {
        fn();
      }
    } else {
      if (attr == "opacity") {
        obj.style.filter = "alpha(opacity=" + (cur + speed) + ")";
        obj.style.opacity = (cur + speed) / 100;
      } else {
        obj.style[attr] = cur + speed + "px";
      }
    }
  }, 30)
};

module.exports = EPUB.Utils;