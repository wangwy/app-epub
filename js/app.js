/**
 * Created by wangwy on 15-1-9.
 */
EPUB.App = {};
EPUB.App.init = (function ($) {
  var Book;
  var Notation;
  var Selection;
  function init(elem, bookUrl) {
    Book = new EPUB.Book(elem, bookUrl);
    Notation = new EPUB.Notation();
    Notation.initNotation();
//    Selection = new EPUB.Selections();
//    Selection.initSelection();
    $(function(){
      controls();
    });
  }

  function controls(){
    $("#next").on("click", function(){
      Book.nextPage();
    })
    $("#prev").on("click", function(){
      Book.prevPage();
    });
  }

  return init;
})(jQuery);
