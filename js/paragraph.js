/**
 * Created by wangwy on 15-1-8.
 * 段落内容判断
 */
EPUB.Paragraph = function () {
};

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