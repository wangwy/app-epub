/**
 * Created by wangwy on 15-1-22.
 */
EPUB.Notation = function () {
  this.searchs = {
    "复制": {},
    "分享": {},
    "笔记": {},
    "删除": {}
  };
  this.string = "";
};

EPUB.Notation.prototype.show = function (x, y) {
  var that = this;
  var nodes = Array.prototype.slice.call(this.node.querySelectorAll('a[search]'));
  nodes.forEach(function (node) {
    if (node.className == "ujs_search_link_go") node.href = that.string;
  });
  this.node.style.display = "block";
  var w = this.node.offsetWidth;
  var h = this.node.offsetHeight;
  var wx = window.scrollX;
  var wy = window.scrollY;
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var xm = wx + ww - w;
  var ym = wy + wh - h;
  x = (x + 10) > xm ? xm : (x + 10) < wx ? wx : x + 10;
  y = y > ym ? ym : y < wy ? wy : y;
  this.node.style.left = x + "px";
  this.node.style.top = y + "px";
};

EPUB.Notation.prototype.hide = function () {
  this.node.style.left = "0px";
  this.node.style.top = "0px";
  this.node.style.display = "none";
};

EPUB.Notation.prototype.create = function () {
  var that = this;
  this.node = document.createElement("search");
  this.node.style.position = "absolute";
  this.node.style.border = "none";
  this.node.style.zIndex = "1000000";
  this.node.style.left = "0px";
  this.node.style.top = "0px";
  this.node.style.display = "none";
  this.node.style.background = "#333";
  this.node.style.cursor = "pointer";
  this.node.style.color = "#fff";
  this.node.addEventListener("click", function (e) {
    e.stopPropagation();
    that.hide();
  }, false);
  for (var search in this.searchs) {
    this.node.innerHTML += "<a>" + search + "</a>"
  }
  document.documentElement.appendChild(this.node);
};

EPUB.Notation.prototype.initNotation = function () {
  var that = this;
  this.create();
  window.addEventListener("click", function (e) {
    var node = e.target, x = e.pageX, y = e.pageY;
    if (node.nodeName == "#document") {
      that.hide();
    } else if (node == that.node || node.className == "ujs_search_link") {
      e.stopPropagation();
      e.preventDefault();
    } else {
      that.string = that.getString();
      if (that.string != "") {
        that.show(x, y);
      } else {
        that.hide();
      }
    }
  }, false);
};

EPUB.Notation.prototype.getString = function () {
  var s = window.getSelection(), r, c;
  if (s.rangeCount) {
    r = s.getRangeAt(0);
    c = r.cloneContents();
    return c.textContent ? c.textContent : "";
  }
  return "";
};