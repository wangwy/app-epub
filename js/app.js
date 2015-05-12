/**
 * Created by wangwy on 15-1-9.
 */
var EPUB = EPUB || {};
EPUB.App = {};
RSVP.on('error', function (reason) {
  console.log(reason);
});
(function (root) {
  root.ePub = function (ele, userid, bookid, authtoken) {
    EPUB.USERID = userid;
    EPUB.BOOKID = bookid;
    EPUB.AUTHTOKEN = authtoken;
    var book = new EPUB.Book(ele);

    //翻页
    var prevEle = document.getElementById("prev");
    var nextEle = document.getElementById("next");
    prevEle.addEventListener("click", function () {
      book.prevPage();
    });
    nextEle.addEventListener("click", function () {
      book.nextPage();
    });

    //全屏
    var iconZoom = document.getElementById("iconZoom");

    iconZoom.addEventListener("click", function (e) {
      e.stopPropagation();
      var elem = document.body;

      var isInFullScreen = (document.msFullscreenElement && document.msFullscreenElement !== null) || (document.mozFullScreen || document.webkitIsFullScreen);

      if (isInFullScreen) {
        book.cancelFullScreen(document);
        iconZoom.setAttribute("class", "icon-gernal icon_zoom");
        iconZoom.setAttribute("title", "全屏");
      } else {
        book.requestFullScreen(elem);
        iconZoom.setAttribute("class", "icon-gernal icon_zoomout");
        iconZoom.setAttribute("title", "取消全屏");
      }
    });

    var btnMenu = document.getElementById("btnMenu");
    //显示目录、书签、笔记
    btnMenu.addEventListener("click", function (e) {
      if (document.getElementById('menubox_bg').style.display == 'none') {
        book.showMenuBox(0);
        e.stopPropagation();
        book.remPageListener();
      }
    });

    //隐藏目录、书签、笔记
    document.addEventListener("click", function (e) {
      if (document.getElementById('menubox_bg').style.display != 'none') {
        var width = getComputedStyle(document.getElementsByClassName("menubox")[0])["width"].slice(0, -2);
        book.showMenuBox(-width);
        e.stopPropagation();
        book.addPageListener();
      }
    });

    book.addPageListener();

    return book;
  }
})(window);

/**
 * tab切换（目录、书签、笔记）
 * @param o
 * @param s
 * @param cb
 * @param ev
 * @returns {jQuery|HTMLElement}
 */
function tab(o, s, cb, ev) {
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
  ACTIVE: function (evt) {
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
    evt.stopPropagation();
  }
};
new tab('test2_li_now_');
