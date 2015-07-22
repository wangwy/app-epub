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

    //创建滚动条
    var oDrag = new Drag({backgroundId: "box", messageId: "message", dragId: "drag", arrowId: "arrow"});
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
        btnMenu.setAttribute("class", "icon-gernal clickmenu");
      }
    });

    //隐藏目录、书签、笔记
    document.addEventListener("click", function (e) {
      if (document.getElementById('menubox_bg').style.display != 'none') {
        var width = getComputedStyle(document.getElementsByClassName("menubox")[0])["width"].slice(0, -2);
        book.showMenuBox(-width);
        e.stopPropagation();
        book.addPageListener();
        btnMenu.setAttribute("class", "icon-gernal icon-menu");
      }
    });

    book.addPageListener();

    var iconlike = document.getElementById("iconlike");
    //添加或删除收藏
    iconlike.addEventListener("click", function (e) {
      if (userid != "") {
        var data = {"user_id": userid, "book_id": bookid, "auth_token": authtoken, "platform": "web"};
        var classList = iconlike.getAttribute("class");
        if (classList == "icon-gernal icon_like") {
          EPUB.Request.bookStoreRequest("/mobile/post/my/collect/add", data).then(function (r) {
            if (r.flag == "1") {
              iconlike.setAttribute("class", "icon-gernal clicklike");
              iconlike.setAttribute("title", "取消收藏");
            }
          })
        } else {
          EPUB.Request.bookStoreRequest("/mobile/post/my/collect/delete", data).then(function (r) {
            if (r.flag == "1") {
              iconlike.setAttribute("class", "icon-gernal icon_like");
              iconlike.setAttribute("title", "添加收藏");
            }
          });
        }
      } else {
        EPUB.Utils.showAlert("请登录！")
      }
    });

    //判断此书是否已经被收藏
    EPUB.Request.bookStoreRequest("/mobile/post/my/collect/is_collect", {"user_id": userid, "book_id": bookid, "auth_token": authtoken, "platform": "web"}).then(function (r) {
      if (r.flag == "1") {
        if (r.is_collect) {
          iconlike.setAttribute("class", "icon-gernal clicklike");
          iconlike.setAttribute("title", "取消收藏");
        }
      }
    });

    //20分钟刷新依次页面防止session丢失
    setInterval(function () {
      EPUB.Request.bookStoreRequest("/mobile/post/my/collect/is_collect", {"user_id": userid, "book_id": bookid, "auth_token": authtoken, "platform": "web"}).then(function (r) {
        if (r.flag == "1") {
          if (r.is_collect) {
            iconlike.setAttribute("class", "icon-gernal clicklike");
          }
        }
      });
    }, 120000);
    oDrag.onMove = function (percent) {
      var spineNum = 0;
      var message = "";
      var pageNum = book.bookPageNumObj.allNum * percent;
      for (var num in book.bookPageNumObj) {
        if (book.bookPageNumObj[num].endNum && (book.bookPageNumObj[num].endNum >= pageNum)) {
          spineNum = num;
          break;
        }
      }
      for (var tocNum in book.format.toc) {
        if (book.format.toc[tocNum].href == book.spine[spineNum].href) {
          message = book.format.toc[tocNum].label;
          break;
        }
      }
      oDrag.showMessage(percent, message);
    };
    oDrag.onStart = function (percent) {
      var spineNum = 0;
      var message = "";
      var pageNum = book.bookPageNumObj.allNum * percent;
      for (var num in book.bookPageNumObj) {
        if (book.bookPageNumObj[num].endNum && (book.bookPageNumObj[num].endNum >= pageNum)) {
          spineNum = num;
          break;
        }
      }
      for (var tocNum in book.format.toc) {
        if (book.format.toc[tocNum].href == book.spine[spineNum].href) {
          message = book.format.toc[tocNum].label;
          break;
        }
      }
      oDrag.showMessage(percent, message);
    };
    oDrag.onStop = function (value) {
      book.goProgressByPercent(value);
    };

    book.listen("book:progress", function (e) {
      oDrag.setDragTop(e.msg);
    }, this);
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

/**
 * div模拟的滚动条
 * @param {backgroundId: 滚动条背景div id, messageId: 弹出信息div id, dragId: 滚动条div id}
 * @constructor
 */
function Drag() {
  this.initialize.apply(this, arguments);
}
Drag.prototype = {
  initialize: function (options) {
    var that = this;
    this.setOptions(options);
    this.background = document.getElementById(this.options.backgroundId);
    this.backgroundBorderWidth = getComputedStyle(this.background, null).getPropertyValue("border-top-width").slice(0, -2);//背景框的边框宽度
    this.backgroundHeight = this.options.maxContainer.clientHeight - 2 * this.backgroundBorderWidth;
    this.background.style.height = this.backgroundHeight + "px";
    window.addEventListener("resize", function () {
      that.backgroundHeight = that.options.maxContainer.clientHeight - 2 * that.backgroundBorderWidth;
      that.background.style.height = that.backgroundHeight + "px";
    });
    this.message = document.getElementById(this.options.messageId);
    this.drag = document.getElementById(this.options.dragId);
    this.arrow = document.getElementById(this.options.arrowId);
    this._moveDrag = this.moveDrag.bind(this);
    this._stopDrag = this.stopDrag.bind(this);
    this.drag.style.cursor = "move";
    this.onStart = this.options.onStart;
    this.onMove = this.options.onMove;
    this.onStop = this.options.onStop;
    this.drag.addEventListener("mousedown", this.startDrag.bind(this), false);
  },
  moveDrag: function (event) {
    var event = event || window.event;
    var iTop = event.clientY;
    if (iTop < 0) {
      iTop = 0;
    } else if (iTop + this.drag.offsetHeight > this.options.maxContainer.clientHeight) {
      iTop = this.options.maxContainer.clientHeight - this.drag.offsetHeight;
    }
    this.drag.style.top = iTop + "px";
    this.arrow.style.top = iTop + "px";
//    this.showMessage(iTop / (this.options.maxContainer.clientHeight - this.drag.offsetHeight));
    this.onMove(iTop / (this.options.maxContainer.clientHeight - this.drag.offsetHeight));
    event.preventDefault && event.preventDefault();
  },
  stopDrag: function () {
    document.removeEventListener("mousemove", this._moveDrag, false);
    document.removeEventListener("mouseup", this._stopDrag, false);
    this.message.style.display = "none";
    this.arrow.style.display = "none";
    this.onStop(this.drag.offsetTop / (this.options.maxContainer.clientHeight - this.drag.offsetHeight));
    this.drag.releaseCapture && this.drag.releaseCapture();
  },
  startDrag: function (event) {
    var event = event || window.event;
    document.addEventListener("mousemove", this._moveDrag, false);
    document.addEventListener("mouseup", this._stopDrag, false);
//    this.showMessage(this.drag.offsetTop / (this.options.maxContainer.clientHeight - this.drag.offsetHeight));
    this.arrow.style.display = "inline-block";
    event.preventDefault && event.preventDefault();
    this.onStart(this.drag.offsetTop / (this.options.maxContainer.clientHeight - this.drag.offsetHeight));
    this.drag.setCapture && this.drag.setCapture();
  },
  setOptions: function (options) {
    this.options = {
      backgroundId: "",
      dragId: "",
      onStart: function () {
      },
      onMove: function () {
      },
      onStop: function () {
      },
      maxContainer: document.documentElement || document.body
    };
    for (var p in options) this.options[p] = options[p];
  },
  setDragTop: function (per) {
    var percent = per;
    if (percent < 0) {
      percent = 0;
    } else if (percent > 100) {
      percent = 100;
    }
    var top = (this.options.maxContainer.clientHeight - this.drag.offsetHeight) * (percent / 100);
    this.drag.style.top = top + "px";
    this.arrow.style.top = top + "px";
  },
  showMessage: function (percent, message) {
    var position = percent * 100;
    if (position <= 99) {
      position = Math.round(position);
    } else if (position > 99 && position < 100) {
      position = 99;
    } else {
      position = 100;
    }
    var info = message.trim();
    if (info.length > 19) {
      info = info.slice(0, 19);
      info = info + "...";
    }
    this.message.getElementsByTagName("p")[0].textContent = info;
    this.message.getElementsByTagName("p")[1].textContent = position + "%";
    this.message.style.display = "block";
    var messageTop = (this.options.maxContainer.clientHeight - this.drag.offsetHeight) * percent - this.message.offsetHeight / 2 + this.drag.offsetHeight / 2;
    if (messageTop < 0) {
      messageTop = 0;
    } else if ((messageTop + this.message.offsetHeight) > this.options.maxContainer.clientHeight) {
      messageTop = this.options.maxContainer.clientHeight - this.message.offsetHeight;
    }
    this.message.style.top = messageTop + "px";
  }
};

function CustomEvent ( event, params ) {
  params = params || { bubbles: false, cancelable: false, detail: undefined };
  var evt = document.createEvent( 'CustomEvent' );
  evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
  return evt;
};

CustomEvent.prototype = window.Event.prototype;
window.CustomEvent = CustomEvent;