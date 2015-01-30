/**
 * Created by wangwy on 15-1-9.
 */
EPUB.App = {};
EPUB.App.init = (function ($) {
  var Book;
  var Notation;

  function init(elem, bookUrl) {
    Book = new EPUB.Book(elem, bookUrl);
    Notation = new EPUB.Notation();
//    Notation.initNotation();
    $(function () {
      controls();
    });
  }

  //禁用浏览器选重
  function disableselect(e) {
    return false
  }

  function reEnable() {
    return true
  }

  document.onselectstart = new Function("return false");
  if (window.sidebar) {
    document.onmousedown = disableselect;
    document.onclick = reEnable
  }
  function controls() {
    $("#next").on("click", function () {
      Book.nextPage();
    });
    $("#prev").on("click", function () {
      Book.prevPage();
    });
  }

  return init;
})(jQuery);
