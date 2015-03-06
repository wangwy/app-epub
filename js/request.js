/**
 * Created by wangwy on 15-1-7.
 * 与后台的请求
 */
var EPUB = EPUB || {};
EPUB.Request = {};
EPUB.Request.loadFile = function (url, type) {
  var deferred = new RSVP.defer();
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.onreadystatechange = handler;
  if (type == "json") {
    xhr.setRequestHeader("Accept", "application/json");
  }
  if (type == "xml") {
    xhr.overrideMimeType('text/xml');
  }
  xhr.send();
  function handler() {
    if (this.readyState === this.DONE) {
      if (this.status === 200 || this.responseXML) {
        var r;
        if (type == 'xml') {
          r = this.responseXML;
        } else if (type == 'json') {
          r = JSON.parse(this.response);
        } else {
          r = this.responseText;
        }
        deferred.resolve(r);
      }
    }
  }

  return deferred.promise;
};

/**
 * 下载图书笔记列表
 * @param url
 * @param data
 * @returns {promise|S.promise|$$enumerator$$Enumerator.promise|deferred.promise}
 */
EPUB.Request.modifyNote = function (url, data) {
  var deferred = new RSVP.defer();
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.onreadystatechange = handler;
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(JSON.stringify(data));

  function handler() {
    if (this.readyState === 4) {
      var r = JSON.parse(this.responseText);
      deferred.resolve(r);
    }
  }

  return deferred.promise;
};

