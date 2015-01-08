/**
 * Created by wangwy on 15-1-8.
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

EPUB.Paragraph.prototype.isEnglish = function (c) {
  if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) {
    return true;
  } else {
    return false;
  }
};