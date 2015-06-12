/**
 * Created by wangwy on 15-1-8.
 * 段落内容判断
 */
var EPUB = require("./base.js");
EPUB.Paragraph = function () {
};

/**
 * 是否是非中文字符
 * @param c
 * @returns {boolean}
 */
EPUB.Paragraph.prototype.isDbcCase = function (c) {
  if ((c >= 32 && c <= 127) || (c >= 65377 && c <= 65439)) {
    return true;
  } else {
    return false;
  }
};

/**
 * 判断是否是空格
 * @param c
 * @returns {boolean}
 */
EPUB.Paragraph.prototype.isSpace = function (c) {
  if (c == 32) {
    return true;
  } else {
    return false;
  }
};

/**
 * 判断是否是英文字符
 * @param c
 * @returns {boolean}
 */
EPUB.Paragraph.prototype.isEnglish = function (c) {
  if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) {
    return true;
  } else {
    return false;
  }
};

/**
 * 判断是否是非换行标点
 * @param c
 * @returns {boolean}
 */
EPUB.Paragraph.prototype.isNotChPu = function(c){
  var index = [33,34,39,41,44,46,58,59,63,8217,8221,8230,12289,12290,12299,12303,12305,65281,65289,65292,65306,65307,65311].indexOf(c);
  return index == -1 ? false : true;
};

module.exports = EPUB.Paragraph;