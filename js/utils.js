/**
 * Created by wangwy on 15-3-9.
 */
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
EPUB.Utils.getCss = function(o,key){
  return o.currentStyle ? o.currentStyle[key] : window.getComputedStyle(o,null)[key];
};