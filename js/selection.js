/**
 * Created by wangwy on 15-1-23.
 * 重写浏览器选择背景
 */
var EPUB = EPUB || {};
EPUB.Selections = function () {
  this.selectionElements = [];
  this.rects = [];
};

/**
 * 初始化选择的操作
 */
EPUB.Selections.prototype.initSelection = function () {
  this.svg = document.getElementsByTagName("svg")[0];
  this.svgPosition = this.getPosition(this.svg);
  var that = this;

  function handle(e) {
    //选择区域终点坐标
    that.endXY = {x: e.x, y: e.y};
    if (that.unChangeXY.y >= that.endXY.y) {
      that.startXY = that.endXY;
      that.endXY = that.unChangeXY;
    } else {
      that.startXY = that.unChangeXY;
    }
    that.reInitSelections();
    that.getSelectionElements();
    that.createRects();
    that.inserRects();
  }

  this.svg.addEventListener("mousedown", function (e) {
    //选择区域起点坐标
    that.startXY = {x: e.x, y: e.y};
    //鼠标点击区域坐标
    that.unChangeXY = that.startXY;
    if (that.rects.length > 0) {
      that.rects.forEach(function (value) {
        that.svg.removeChild(value);
      });
      that.rects = [];
    }
    that.svg.addEventListener("mousemove", handle, false);
  }, false);
  this.svg.addEventListener("mouseup", function () {
    that.svg.removeEventListener("mousemove", handle, false);
  });
};

/**
 * 重新加载选择的节点与创建的背景矩形
 */
EPUB.Selections.prototype.reInitSelections = function () {
  var that = this;
  if (this.rects.length > 0) {
    this.rects.forEach(function (value) {
      that.svg.removeChild(value);
    });
    this.rects = [];
  }
  this.selectionElements = [];
};

/**
 * 获取选择区域内的节点
 */
EPUB.Selections.prototype.getSelectionElements = function () {
  var items = Array.prototype.slice.call(this.svg.querySelectorAll('text')), that = this;
  items.forEach(function (value) {
    var eleY = parseInt(value.getAttribute("y"), 10) + parseInt(that.svgPosition.top, 10) - 10;
    if (eleY >= that.startXY.y && eleY <= that.endXY.y) {
      that.selectionElements.push(value);
    }
    if (that.selectionElements.length > 0) {
      that.selectionElements.forEach(function (value) {
        var eleX = parseInt(value.getAttribute("x"), 10) + parseInt(that.svgPosition.left, 10),
            eleY = parseInt(value.getAttribute("y"), 10) + parseInt(that.svgPosition.top, 10);
        if ((that.endXY.y - eleY < 20 && eleX - that.endXY.x > 11) || (that.startXY.y - eleY > -20 && that.startXY.x - eleX > 11)) {
          that.arryRemove(that.selectionElements, value);
        }
      });
    }
  });
};

/**
 * 根据选择的节点创建背景矩形
 */
EPUB.Selections.prototype.createRects = function () {
  if (this.selectionElements.length > 0) {
    var that = this;
    this.selectionElements.forEach(function (value) {
      var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", value.getAttribute("x"));
      rect.setAttribute("y", value.getAttribute("y") - value.getAttribute("font-size"));
      rect.setAttribute("width", value.getAttribute("data-width"));
      rect.setAttribute("height", value.getAttribute("data-height"));
      rect.setAttribute("fill", "yellow");
      that.rects.push(rect);
    });
  }
};

/**
 * 将背景矩形插入到svg标签
 */
EPUB.Selections.prototype.inserRects = function () {
  if (this.selectionElements.length > 0) {
    for (var i = 0; i < this.selectionElements.length; i++) {
      this.svg.insertBefore(this.rects[i], this.selectionElements[i]);
    }
  }
};

/**
 * 获取节点的偏移量
 * @param elem
 * @returns {{}}
 */
EPUB.Selections.prototype.getPosition = function (elem) {
  var position = {};
  position.left = 0;
  position.top = 0;
  while (true) {
    position.left += elem.offsetLeft;
    position.top += elem.offsetTop;
    if (elem.offsetParent === null) {
      break;
    }
    elem = elem.parentNode;
  }
  return position;
};

/**
 * 移除数组中的元素
 * @param array       数组
 * @param value       要移除的元素
 * @returns {boolean} 是否成功移除
 */
EPUB.Selections.prototype.arryRemove = function (array, value) {
  var num = array.indexOf(value);
  if (num >= 0) {
    array.splice(num, 1);
    return true;
  }
  return false;
};