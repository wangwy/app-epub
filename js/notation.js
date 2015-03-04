/**
 * Created by wangwy on 15-1-22.
 * 鼠标选择后弹出复制、标记等功能菜单
 */
EPUB.Notation = function () {
  this.pages = [];
  this.svg = [];
  this.svgSelected = [];
  this.bacRects = [];
  this.showPostion = {};
  this.string = "";
  this.create();
  this.createDialog();
  this.createText();
};

/**
 * 功能菜单显示
 * @param x
 * @param y
 */
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

/**
 * 功能菜单隐藏
 */
EPUB.Notation.prototype.hide = function () {
  this.node.style.left = "0px";
  this.node.style.top = "0px";
  this.node.style.display = "none";
};

/**
 * 功能菜单创建
 */
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
  this.node.innerHTML += "<a id='copy-button'> 复制 </a>";
  this.node.innerHTML += "<a> 分享 </a>";
  this.node.innerHTML += "<a id='show-dialog'> 笔记 </a>";
  this.node.innerHTML += "<a> 删除 </a>";
  document.documentElement.appendChild(this.node);
};

/**
 * 初始化功能菜单
 */
EPUB.Notation.prototype.initNotation = function () {
  var that = this;
  if (this.svgSelected.length > 0) {
    this.show(this.showPostion.x, this.showPostion.y);
    var copyText = this.getString();
    var copyButton = document.getElementById("copy-button");
    copyButton.setAttribute("data-clipboard-text", copyText);
    var client = new ZeroClipboard(copyButton);
    var showDialog = document.getElementById("show-dialog");
    showDialog.addEventListener('click', function () {
      that.showDialog(that.showPostion.x, that.showPostion.y);
    });
  } else {
    this.hide();
  }
};

/**
 * 获取选中文本
 * @returns {string}
 */
EPUB.Notation.prototype.getString = function () {
  var s = "";
  if (this.svgSelected.length > 0) {
    var item = Array.prototype.slice.call(this.svgSelected);
    item.forEach(function (value) {
      s += value.textContent;
    });
  }
  return s;
};

/**
 * 创建显示笔记内容窗口
 */
EPUB.Notation.prototype.createText = function () {
  this.textNode = document.createElement('div');
  this.textNode.style.position = "absolute";
  this.textNode.style.left = "0px";
  this.textNode.style.top = "0px";
  this.textNode.style.display = "none";
  this.textNode.setAttribute("class", "u-note u-note-1");
  this.textNode.setAttribute("id", "popup-note");

  var div1 = document.createElement('div');
  this.textNode.appendChild(div1);
  div1.setAttribute("class", "note-wrap");

  var p = document.createElement('p');
  div1.appendChild(p);

  var div2 = document.createElement('div');
  this.textNode.appendChild(div2);
  div2.setAttribute("class", "arr");

  var span1 = document.createElement('span');
  div2.appendChild(span1);
  span1.setAttribute("class", "t0");

  var span2 = document.createElement('span');
  div2.appendChild(span2);
  span2.setAttribute("class", "t1");

  document.documentElement.appendChild(this.textNode);
};

/**
 * 创建笔记窗口
 */
/*EPUB.Notation.prototype.createDialog = function () {
  var that = this;
  this.dialogNode = document.createElement('div');
  this.dialogNode.style.position = "absolute";
  this.dialogNode.style.left = "0px";
  this.dialogNode.style.top = "0px";
  this.dialogNode.style.display = "none";
  this.dialogNode.setAttribute("class", "u-inputpanel");
  this.dialogNode.setAttribute("id", "popup-comment");
  var h2 = document.createElement("h2");
  h2.textContent = "批注";
  this.dialogNode.appendChild(h2);

  var p = document.createElement("p");
  p.setAttribute("class", "txt");
  this.dialogNode.appendChild(p);

  var form = document.createElement("form");

  var textArea = document.createElement("textarea");
  textArea.setAttribute("id", "comment-content");
  form.appendChild(textArea);

  var div = document.createElement("div");
  div.setAttribute("class", "btn");

  var input = document.createElement("input");
  input.setAttribute("id", "button-finish-comment");
  input.setAttribute("type", "button");
  input.setAttribute("class", "u-btn3");
  input.setAttribute("value", "完成");
  input.addEventListener("click", function () {
    that.sendNotation();
  });
  div.appendChild(input);
  form.appendChild(div);
  this.dialogNode.appendChild(form);

  var a = document.createElement("a");
  a.setAttribute("id", "button-close-comment");
  a.setAttribute("class", "icn-close2");
  a.textContent = "×";
  a.addEventListener("click", function (e) {
    that.hideDialog();
  });
  this.dialogNode.appendChild(a);
  document.documentElement.appendChild(this.dialogNode);
};*/

EPUB.Notation.prototype.createDialog = function () {
  var that = this;
  var div1 = document.createElement("div");
  div1.setAttribute("id","pup");

 var div2 = document.createElement('div');
  div2.setAttribute("id","back");
  div1.appendChild(div2);

  this.dialogNode = document.createElement('div');
  this.dialogNode.style.position = "absolute";
  this.dialogNode.style.left = "0px";
  this.dialogNode.style.top = "0px";
  this.dialogNode.style.display = "none";
  this.dialogNode.setAttribute("class", "pup_con");
  div1.appendChild(this.dialogNode);

  var img = document.createElement('img');
  img.setAttribute("src","images/pup_close.png");
  img.setAttribute("class","pup_close");
  img.addEventListener("click",function(){
    that.hideDialog();
  });
  this.dialogNode.appendChild(img);

  var p1 = document.createElement("p");
  p1.textContent = "笔记";
  p1.setAttribute("class","pup_title");
  this.dialogNode.appendChild(p1);

  var p2 = document.createElement("p");
  p2.setAttribute("class", "pup_hight");
  this.dialogNode.appendChild(p2);

  var textArea = document.createElement("textarea");
  textArea.setAttribute("id", "comment-content");
  textArea.setAttribute("class","pup_text");
  textArea.textContent = "留下你的笔记";
  this.dialogNode.appendChild(textArea);

  var a = document.createElement("p");
  a.setAttribute("class", "pup_save");
  a.textContent = "回车键保存";
  a.addEventListener("click",function(){
    that.sendNotation();
  });
  this.dialogNode.appendChild(a);
  /*
  var input = document.createElement("input");
  input.setAttribute("id", "button-finish-comment");
  input.setAttribute("type", "button");
  input.setAttribute("class", "u-btn3");
  input.setAttribute("value", "完成");
  input.addEventListener("click", function () {
    that.sendNotation();
  });
  div.appendChild(input);
  form.appendChild(div);
  this.dialogNode.appendChild(form);

  var a = document.createElement("a");
  a.setAttribute("id", "button-close-comment");
  a.setAttribute("class", "icn-close2");
  a.textContent = "×";
  a.addEventListener("click", function (e) {
    that.hideDialog();
  });
  this.dialogNode.appendChild(a);*/
  document.documentElement.appendChild(div1);
};

/**
 * 显示笔记内容窗口
 * @param x
 * @param y
 * @param text
 */
EPUB.Notation.prototype.showText = function (x, y, text) {
  this.textNode.getElementsByTagName("p")[0].textContent = text;
  this.textNode.style.left = x + "px";
  this.textNode.style.top = y + "px";
  this.textNode.style.display = "block";
};

/**
 * 显示笔记窗口
 * @param x
 * @param y
 */
EPUB.Notation.prototype.showDialog = function (x, y) {
  this.dialogNode.getElementsByClassName("pup_hight")[0].textContent = this.getString();
  document.getElementById("back").setAttribute("class","pup_bg");
  this.dialogNode.style.left = x + "px";
  this.dialogNode.style.top = y + "px";
  this.dialogNode.style.display = "block";
};

/**
 * 隐藏笔记内容窗口
 */
EPUB.Notation.prototype.hideText = function () {
  this.textNode.style.left = "0px";
  this.textNode.style.top = "0px";
  this.textNode.style.display = "none";
};

/**
 * 隐藏笔记窗口
 */
EPUB.Notation.prototype.hideDialog = function () {
  document.getElementById("back").removeAttribute("class");
  document.getElementById("comment-content").value = "留下你的笔记";
  this.dialogNode.style.left = "0px";
  this.dialogNode.style.top = "0px";
  this.dialogNode.style.display = "none";
};

/**
 *向服务器发送数据请求
 */
EPUB.Notation.prototype.sendNotation = function () {
  var data = {}, that = this;
  var items = Array.prototype.slice.call(this.bacRects);
  items.forEach(function (value) {
    var underRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    underRect.setAttribute("x", value.getAttribute("x"));
    underRect.setAttribute("y", parseInt(value.getAttribute("y")) + parseInt(value.getAttribute("height")));
    underRect.setAttribute("width", value.getAttribute("width"));
    underRect.setAttribute("height", "2");
    underRect.setAttribute("fill", "red");
    underRect.setAttribute("class", "svgBackRect");
    that.svg.removeChild(value);
    that.svg.insertBefore(underRect, that.svg.firstChild);
  });
  this.bacRects.length = 0;
  var offset = this.selectedOffset();
  var sendNotationText = document.getElementById("comment-content").textContent;
  data.offset = offset;
  data.context = sendNotationText;
  EPUB.STORENOTATION.push(data);
  this.hideDialog();
};

/**
 * 获取选取元素在页面里的开始节点与结束节点
 * @returns {{startOffset: number, endOffset: *}}
 */
EPUB.Notation.prototype.selectedOffset = function () {
  var startOffset = 0, endOffset = 0,
      svgArray = Array.prototype.slice.call(this.svg.children),
      backRect = this.svg.getElementsByClassName("svgBackRect");
  for (var i = 0; i < this.pageIndex - 1; i++) {
    startOffset += this.pages[i].length;
  }
  startOffset += svgArray.indexOf(this.svgSelected[0]) - backRect.length;

  endOffset = startOffset + this.svgSelected.length;
  localStorage.setItem("startOffset", startOffset);
  localStorage.setItem("endOffset", endOffset);
  return {
    "startOffset": startOffset,
    "endOffset": endOffset
  };
};

/**
 * 当页面第一次被加载时，显示批注信息
 */
EPUB.Notation.prototype.showNotation = function () {
  var that = this;
  if (EPUB.STORENOTATION.length > 0) {
    var pageEndLength = pageStartLength = 0;
    for (var i = 0; i < this.pageIndex; i++) {
      pageEndLength += this.pages[i].length;
      pageStartLength = pageEndLength - this.pages[i].length;
    }
    EPUB.STORENOTATION.forEach(function (value) {
      if (pageStartLength <= value.offset.startOffset && pageEndLength >= (value.offset.startOffset + value.offset.textlength)) {
        var page = that.pages[that.pageIndex - 1];

        var notationStart = value.offset.startOffset - pageStartLength;
        var notationEnd = value.offset.startOffset + value.offset.textlength - pageStartLength;
        for (var j = 0; j < page.length; j++) {
          if (j >= notationStart && j < notationEnd) {
            var glyph = page[j];
            var rectElem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rectElem.setAttribute("x", glyph.rect.px);
            rectElem.setAttribute("y", glyph.rect.py);
            rectElem.setAttribute("width", glyph.rect.width);
            rectElem.setAttribute("height", "2");
            rectElem.setAttribute("fill", "red");
            rectElem.setAttribute("class", "svgBackRect");
            that.svg.insertBefore(rectElem, that.svg.firstChild);
          }
        }
        var lastNode = page[notationEnd];
        var circleElem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circleElem.setAttribute("cx", lastNode.rect.px);
        circleElem.setAttribute("cy", lastNode.rect.py);
        circleElem.setAttribute("r", "5");
        circleElem.setAttribute("fill", "red");
        circleElem.addEventListener("mouseover",function(e){
          that.showText(e.x, e.y, value.context);
        });
        circleElem.addEventListener("mouseout",function(){
          that.hideText();
        });
        that.svg.insertBefore(circleElem, that.svg.lastChild);
      }
    });
  }
};
/*
 EPUB.Notation.prototype.showNotation = function () {
 var that = this;
 if (this.isNotation()) {
 if (this.pageIndex - 1 == this.notationPage) {
 var page = this.pages[this.pageIndex - 1];
 for (var j = 0; j < page.length; j++) {
 if (j >= this.notationStart && j < this.notationEnd) {
 var glyph = page[j];
 var rectElem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
 rectElem.setAttribute("x", glyph.rect.px);
 rectElem.setAttribute("y", glyph.rect.py);
 rectElem.setAttribute("width", glyph.rect.width);
 rectElem.setAttribute("height", "2");
 rectElem.setAttribute("fill", "red");
 rectElem.setAttribute("class", "svgBackRect");
 this.svg.insertBefore(rectElem, this.svg.firstChild);
 }
 }
 *//*var info = page[this.notationEnd-1];
 var infoRect = document.createElementNS("http://www.w3.org/2000/svg", "circle");
 infoRect.setAttribute("cx", info.rect.px+10);
 infoRect.setAttribute("cy", info.rect.py);
 infoRect.setAttribute("r", "5");
 infoRect.setAttribute("fill", "red");
 infoRect.setAttribute("class", "svgBackRect");
 infoRect.addEventListener("click",function(e){
 that.showDialog(info.rect.px, info.rect.py);
 });
 this.svg.insertBefore(infoRect, this.svg.firstChild);*//*
 }
 }
 };*/
