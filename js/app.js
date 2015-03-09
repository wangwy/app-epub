/**
 * Created by wangwy on 15-1-9.
 */
EPUB.App = {};
EPUB.App.init = (function ($) {
  var Book;

  function init(elem, bookUrl) {
    Book = new EPUB.Book(elem, bookUrl);
    $(function () {
      controls();
      Book.listen("book:tocReady", toc);
      Book.listen("book:noteReady",note);
      var width = $(".menubox").width();
      Book.showMenu = true;
      $(".btn_zoom").click(function () {
        document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
        document.getElementsByClassName("menubox")[0].style.display = "";
        if (Book.showMenu) {
          $(".menubox").stop().animate({right: 0}, 100);
          Book.showMenu = false;
        } else {
          $(".menubox").stop().animate({right: -width}, 100);
          Book.showMenu = true;
        }
      });

      new tab('test2_li_now_');
    });
  }

  function controls() {
    $("#next").on("click", function () {
      Book.nextPage();
    });
    $("#prev").on("click", function () {
      Book.prevPage();
    });
  }

  function toc() {
    Book.createToc(Book.getTOC());
  }

  function note(){
    Book.createNote(Book.notelist);
  }
  function tab(o, s, cb, ev) { //tab切换类
    var $ = function (o) {
      return document.getElementById(o)
    };
    var css = o.split((s || '_'));
    if (css.length != 4)return;
    this.event = ev || 'onclick';
    o = $(o);
    if (o) {
      this.ITEM = [];
      o.id = css[0];
      var item = o.getElementsByTagName(css[1]);
      var j = 1;
      for (var i = 0; i < item.length; i++) {
        if (item[i].className.indexOf(css[2]) >= 0 || item[i].className.indexOf(css[3]) >= 0) {
          if (item[i].className == css[2])o['cur'] = item[i];
          item[i].callBack = cb || function () {
          };
          item[i]['css'] = css;
          item[i]['link'] = o;
          this.ITEM[j] = item[i];
          item[i]['Index'] = j++;
          item[i][this.event] = this.ACTIVE;
        }
      }
      return o;
    }
  }

  tab.prototype = {
    ACTIVE: function () {
      var $ = function (o) {
        return document.getElementById(o)
      };
      this['link']['cur'].className = this['css'][3];
      this.className = this['css'][2];
      try {
        $(this['link']['id'] + '_' + this['link']['cur']['Index']).style.display = 'none';
        $(this['link']['id'] + '_' + this['Index']).style.display = 'block';
      } catch (e) {
      }
      this.callBack.call(this);
      this['link']['cur'] = this;
    }
  }

  return init;
})(jQuery);
