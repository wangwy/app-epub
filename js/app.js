/**
 * Created by wangwy on 15-1-9.
 */
var EPUB = EPUB || {};
EPUB.App = {};
RSVP.on('error',function(reason){
  console.log(reason);
});
(function (root) {
  root.ePub = function (ele, userid, bookid, authtoken) {
    EPUB.USERID = userid;
    EPUB.BOOKID = bookid;
    EPUB.AUTHTOKEN = authtoken;
    var book = new EPUB.Book(ele);
    var prevEle = document.getElementById("prev");
    var nextEle = document.getElementById("next");
    prevEle.addEventListener("click", function () {
      book.prevPage();
    });
    nextEle.addEventListener("click", function () {
      book.nextPage();
    });
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

var width = getComputedStyle(document.getElementsByClassName("menubox")[0])["width"].slice(0, -2);
var btnMenu = document.getElementById("btnMenu");

var menubox = document.getElementsByClassName("menubox")[0];

/**
 * 鼠标滚动时翻页函数
 * @param e
 */
function wheelPage(e){
  if(e.wheelDelta > 0){
    book.prevPage();
  }else{
    book.nextPage();
  }
}

document.addEventListener("mousewheel",wheelPage,false);

/**
 * 显示目录、书签、笔记
 * @param num
 */
function showMenuBox(num){
  document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
  document.getElementsByClassName("menubox")[0].style.display = "";
  startrun(menubox, "right", num, function () {
    startrun(menubox, "opacity", "100")
  });
}

//显示目录、书签、笔记
btnMenu.addEventListener("click", function (e) {
  if (document.getElementById('menubox_bg').style.display == 'none') {
    showMenuBox(0);
    e.stopPropagation();
    document.removeEventListener("mousewheel",wheelPage,false);
  }
});

//隐藏目录、书签、笔记
document.addEventListener("click",function(e){
  if(document.getElementById('menubox_bg').style.display != 'none'){
    showMenuBox(-width);
    e.stopPropagation();
    document.addEventListener("mousewheel",wheelPage,false);
  }
});

/**
 * 获取element样式
 * @param obj
 * @param name
 * @returns {*}
 */
function getstyle(obj, name) {
  if (obj.currentStyle) {
    return obj.currentStyle[name];
  } else {
    return getComputedStyle(obj, false)[name];
  }
}

/**
 * 模拟jquery的animate函数
 * @param obj
 * @param attr
 * @param target
 * @param fn
 */
function startrun(obj, attr, target, fn) {
  clearInterval(obj.timer);
  obj.timer = setInterval(function () {
    var cur = 0;
    if (attr == "opacity") {
      cur = Math.round(parseFloat(getstyle(obj, attr)) * 100);
    } else {
      cur = parseInt(getstyle(obj, attr));
    }
    var speed = (target - cur) / 8;
    speed = speed > 0 ? Math.ceil(speed) : Math.floor(speed);

    if (cur == target) {
      clearInterval(obj.timer);
      if (fn) {
        fn();
      }
    } else {
      if (attr == "opacity") {
        obj.style.filter = "alpha(opacity=" + (cur + speed) + ")";
        obj.style.opacity = (cur + speed) / 100;
      } else {
        obj.style[attr] = cur + speed + "px";
      }
    }

  }, 30)
}

/**
 * 触发全屏事件
 * @type {HTMLElement}
 */
var iconZoom = document.getElementById("iconZoom");
iconZoom.addEventListener("click",function(){
  var elem = document.body;

  var isInFullScreen = (document.msFullscreenElement && document.msFullscreenElement !== null) ||  (document.mozFullScreen || document.webkitIsFullScreen);

  if (isInFullScreen) {
    cancelFullScreen(document);
    iconZoom.setAttribute("class","icon-gernal icon_zoom");
  } else {
    requestFullScreen(elem);
    iconZoom.setAttribute("class","icon-gernal icon_zoomout");
  }
  return false;
});

/**
 * 取消全屏
 * @param el
 */
function cancelFullScreen(el) {
  var requestMethod = el.cancelFullScreen||el.webkitCancelFullScreen||el.mozCancelFullScreen||el.msExitFullscreen;
  if (requestMethod) {
    requestMethod.call(el);
  } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
    var wscript = new ActiveXObject("WScript.Shell");
    if (wscript !== null) {
      wscript.SendKeys("{F11}");
    }
  }
}

/**
 * 全屏显示
 * @param el
 * @returns {boolean}
 */
function requestFullScreen(el) {
  var requestMethod = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullscreen;

  if (requestMethod) {
    requestMethod.call(el);
  } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
    var wscript = new ActiveXObject("WScript.Shell");
    if (wscript !== null) {
      wscript.SendKeys("{F11}");
    }
  }
  return false
}
