/**
 * Created by wangwy on 15-1-23.
 * 重写浏览器选择背景
 */
EPUB.Selections = function (render) {
  this.render = render;
  this.notation = new EPUB.Notation(this);
};

/**
 * 初始化选择的操作
 */
EPUB.Selections.prototype.initSelection = function () {
  this.svg = document.getElementsByTagName("svg")[0];
  this.selectionElements = [];
  this.rects = [];
  this.notation.svg = this.svg;
  this.notation.pages = this.render.pages;
  this.notation.pageIndex = this.render.displayedPage;
  this.notation.showNotation();
  this.notation.showMark();
  //禁用浏览器选重
  this.svg.onmousedown = function(){return false};
//  this.svgPosition = this.svg.getBoundingClientRect();
  var that = this;

  function handle(e) {
    //选择区域终点坐标
    that.endXY = {x: e.pageX, y: e.pageY};
    if (that.unChangeXY.y > that.endXY.y) {
      that.startXY = that.endXY;
      that.endXY = that.unChangeXY;
    } else {
      that.startXY = that.unChangeXY;
    }
    that.reInitSelections();
    that.getSelectionElements();
//    that.selectionElements = that.getSelectedNodes();
    that.createRects();
    that.inserRects();
  }

  this.svg.addEventListener("mousedown", function (e) {
    that.svgPosition = that.getElementPosition(that.svg);
    //选择区域起点坐标
    that.startXY = {x: e.pageX, y: e.pageY};
    //鼠标点击区域坐标
    that.unChangeXY = that.startXY;
    that.reInitSelections();
    that.svg.addEventListener("mousemove", handle, false);
  }, false);
  this.svg.addEventListener("mouseup", function () {
    that.svg.removeEventListener("mousemove", handle, false);
    that.notation.svgSelected = that.selectionElements;
    that.notation.bacRects = that.rects;
    that.notation.showPostion = that.endXY;
    that.notation.initNotation();
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
  var items = Array.prototype.slice.call(this.svg.children), that = this;
  items.forEach(function (value) {
    var lineHeight = parseInt(value.getAttribute("data-height"), 10);
    var eleY = parseInt(value.getAttribute("y"), 10) + parseInt(that.svgPosition.top, 10),
        eleX = parseInt(value.getAttribute("x"), 10) + parseInt(that.svgPosition.left, 10);
    if ((that.endXY.y - that.startXY.y) <= lineHeight && (that.startXY.x - eleX) < 11 && (that.endXY.x - eleX) > 11 && eleY > that.startXY.y && eleY <= (that.endXY.y + lineHeight)) {
      that.selectionElements.push(value);
    }
    else if ((that.endXY.y - that.startXY.y > lineHeight) && ((eleY > (that.startXY.y + lineHeight) && eleY < that.endXY.y) ||
        (eleY > that.startXY.y && eleY < (that.startXY.y + lineHeight) && (that.startXY.x - eleX) < 11) ||
        (eleY >= that.endXY.y && eleY < (that.endXY.y + lineHeight) && (that.endXY.x - eleX) > 11))) {
      that.selectionElements.push(value);
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
      if (value.tagName == "text") {
        var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", value.getAttribute("x"));
        rect.setAttribute("y", value.getAttribute("y") - value.getAttribute("font-size"));
        rect.setAttribute("width", value.getAttribute("data-width"));
        rect.setAttribute("height", value.getAttribute("data-height"));
        rect.setAttribute("fill", "yellow");
        rect.setAttribute("class", "svgBackRect");
        that.rects.push(rect);
      }
    });
  }
};

/**
 * 将背景矩形插入到svg标签
 */
EPUB.Selections.prototype.inserRects = function () {
  if (this.rects.length > 0) {
    for (var i = 0; i < this.rects.length; i++) {
      this.svg.insertBefore(this.rects[i], this.svg.firstChild);
    }
  }
};

/**
 * 获取选中的节点
 * @returns {*}
 */
EPUB.Selections.prototype.getSelectedNodes = function () {
  var selection = window.getSelection();
  if (selection.isCollapsed) {
    return [];
  }
  var node1 = selection.anchorNode;
  var node2 = selection.focusNode;
  return this.getNodesBetween(this.svg, node1, node2);
};

/**
 * 判断是否是后代元素
 * @param parent
 * @param child
 * @returns {boolean}
 */
EPUB.Selections.prototype.isDescendant = function (parent, child) {
  var node = child;
  while(node != null){
    if(node == parent){
      return true;
    }
    node = node.parentNode;
  }
  return false;
};

/**
 * 获取两个节点之间的节点
 * @param rootNode
 * @param node1
 * @param node2
 * @returns {*}
 */
EPUB.Selections.prototype.getNodesBetween = function(rootNode, node1, node2){
  var resultNodes = [];
  var isBetweenNodes = false;
  for(var i = 0; i < rootNode.childNodes.length; i+=1){
    if(this.isDescendant(rootNode.childNodes[i], node1) || this.isDescendant(rootNode.childNodes[i], node2)){
      if(resultNodes.length == 0){
        isBetweenNodes = true;
      }else{
        isBetweenNodes = false
      }
      resultNodes.push(rootNode.childNodes[i]);
    }else if(resultNodes.length == 0){

    }else if(isBetweenNodes){
      resultNodes.push(rootNode.childNodes[i]);
    }else{
      return resultNodes;
    }
  }
  if(resultNodes.length == 0){
    return [rootNode];
  }else if(this.isDescendant(resultNodes[resultNodes.length - 1], node1) || this.isDescendant(resultNodes[resultNodes - 1], node2)){
    return resultNodes;
  }else{
    return [resultNodes[0]]
  }
};

EPUB.Selections.prototype.getElementPosition = function(element){
  var actualLeft = element.offsetLeft,
      actualTop = element.offsetTop,
      current = element.offsetParent;
  while(current != null){
    actualLeft += current.offsetLeft;
    actualTop += current.offsetTop;
    current = current.offsetParent;
  }

  return {
    left: actualLeft,
    top: actualTop
  }
};