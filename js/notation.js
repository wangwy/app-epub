/**
 * Created by wangwy on 15-1-22.
 * 鼠标选择后弹出复制、标记等功能菜单
 */
EPUB.Notation = function (selection) {
  this.render = selection.render;
  this.pages = [];
  this.svg = [];
  this.svgSelected = [];
  this.bacRects = [];
  this.showPostion = {};
  this.string = "";
  this.initialDialog();
};

/**
 * 带笔记的功能菜单显示
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
 * 带删除的功能菜单显示
 * @param x
 * @param y
 */
EPUB.Notation.prototype.showHasDel = function (x, y) {
  var that = this;
  var nodes = Array.prototype.slice.call(this.node.querySelectorAll('a[search]'));
  nodes.forEach(function (node) {
    if (node.className == "ujs_search_link_go") node.href = that.string;
  });
  this.nodeHasDel.style.display = "block";
  var w = this.nodeHasDel.offsetWidth;
  var h = this.nodeHasDel.offsetHeight;
  var wx = window.scrollX;
  var wy = window.scrollY;
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var xm = wx + ww - w;
  var ym = wy + wh - h;
  x = (x + 10) > xm ? xm : (x + 10) < wx ? wx : x + 10;
  y = y > ym ? ym : y < wy ? wy : y;
  this.nodeHasDel.style.left = x + "px";
  this.nodeHasDel.style.top = y + "px";
};

/**
 * 隐藏带笔记的功能菜单
 */
EPUB.Notation.prototype.hideHasNote = function () {
  this.node.style.left = "0px";
  this.node.style.top = "0px";
  this.node.style.display = "none";
};

/**
 * 隐藏带删除的功能菜单
 */
EPUB.Notation.prototype.hideHasDel = function () {
  this.nodeHasDel.style.left = "0px";
  this.nodeHasDel.style.top = "0px";
  this.nodeHasDel.style.display = "none";
};

/**
 * 初始化所有窗口
 */
EPUB.Notation.prototype.initialDialog = function () {
  var that = this;

  //有笔记功能的功能框
  this.node = document.getElementById("noteSearch");
  this.node.addEventListener("click", function (e) {
    e.stopPropagation();
    that.hideHasNote();
  }, false);

  //有删除功能的功能框
  this.nodeHasDel = document.getElementById("delSearch");
  this.nodeHasDel.addEventListener("click", function () {
    that.hideHasDel();
  });
  var delNode = document.getElementById("del-note");
  delNode.addEventListener("click", function (e) {
    var delNoteid = delNode.getAttribute("data-noteid");
    if (delNoteid) {
      that.deletNotation(delNoteid);
    }
  });

  //笔记框
  this.dialogNode = document.getElementsByClassName("pup_con")[0];
  var img = this.dialogNode.getElementsByTagName("img")[0];
  img.addEventListener("click", function () {
    that.hideDialog();
  });
  var saveButton = document.getElementById("noteSave");
  saveButton.addEventListener("click", function () {
    that.sendNotation();
  });

  //笔记内容框
  this.textNode = document.getElementById("popup-note");

  //书签
  this.markNode = document.getElementById("markNode");
  this.markNode.addEventListener("click", function () {
    var markId = that.markNode.getAttribute("data-markId");
    if (markId) {
      that.deleteMark(markId);
    } else {
      that.saveMark();
    }
  });

  this.shareNode = document.getElementById("shareNode");
  this.shareNode.addEventListener("click",function(){
      that.hideShareNode();
  });
};

/**
 * 初始化功能菜单
 */
EPUB.Notation.prototype.initNotation = function () {
  var that = this;
  if (this.svgSelected.length > 0) {
    this.show(this.showPostion.x, this.showPostion.y);
    var copyText = this.getString(that.svgSelected);

    var copyButton = document.getElementById("copy-button");
    copyButton.setAttribute("data-clipboard-text", copyText);
    var client = new ZeroClipboard(copyButton);

    window.jiathis_config.summary = copyText;
    var shareButton = document.getElementById("share");
    shareButton.addEventListener("click",function(e){
      that.showShareNode(e.clientX, e.clientY)
    });

    var showDialog = document.getElementById("show-dialog");
    showDialog.addEventListener('click', function () {
      that.showDialog(that.showPostion.x, that.showPostion.y);
    });
  } else {
    this.hideHasNote();
    this.hideHasDel();
    this.hideShareNode();
  }
};

/**
 * 获取选中文本
 * @returns {string}
 */
EPUB.Notation.prototype.getString = function (node) {
  var s = "";
  if (node.length > 0) {
    var item = Array.prototype.slice.call(node);
    item.forEach(function (value) {
      s += value.textContent;
    });
  }
  return s;
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
  this.dialogNode.getElementsByClassName("pup_hight")[0].textContent = this.getString(this.svgSelected);
  document.getElementById("back").setAttribute("class", "pup_bg");
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
 * 显示分享窗口
 * @param x
 * @param y
 */
EPUB.Notation.prototype.showShareNode = function(x,y){
  this.shareNode.style.left = x + "px";
  this.shareNode.style.top = y + "px";
  this.shareNode.style.display = "block";
};

/**
 * 隐藏分享窗口
 */
EPUB.Notation.prototype.hideShareNode = function(){
  this.shareNode.style.left = 0 + "px";
  this.shareNode.style.top = 0 + "px";
  this.shareNode.style.display = "none";
};

/**
 * 删除笔记
 * @param noteid
 */
EPUB.Notation.prototype.deletNotation = function (noteid) {
  var that = this, data = {
    "userid": EPUB.USERID,
    "authtoken": EPUB.AUTHTOKEN,
    "noteid": noteid
  };
  EPUB.Request.bookStoreRequest("/bookstore/mobile/post/delete/my/readnote", data).then(function (r) {
    if (r.flag == "1") {
      var backRect = that.svg.getElementsByClassName(noteid);
      var items = Array.prototype.slice.call(backRect);
      items.forEach(function (value) {
        that.svg.removeChild(value);
      });
      var g = that.svg.getElementById(noteid);
      var gChild = Array.prototype.slice.call(g.children);
      gChild.forEach(function (value) {
        that.svg.insertBefore(value, g);
      });
      that.svg.removeChild(g);

      that.render.book.getNotes().then(function () {
        that.render.notes = that.render.book.getChapterNotes(that.render.book.spineNum);
      });
    }
  });
};

/**
 *保存笔记
 */
EPUB.Notation.prototype.sendNotation = function () {
  var that = this, data = {
    "userid": EPUB.USERID,
    "authtoken": EPUB.AUTHTOKEN,
    "bookid": EPUB.BOOKID,
    "process": EPUB.PROCESS,
    "adddate": new Date().Format("yyyy-MM-dd hh:mm:ss"),
    "catindex": that.render.spineNum,
    "catname": that.render.chapterName,
    "summary": this.getString(that.svgSelected),
    "digestnote": document.getElementById("comment-content").value,
    "linecolor": "",
    "numbers": that.selectedOffset().startOffset + "," + that.selectedOffset().endOffset,
    "ranges": that.selectedOffset().startOffset + "," + that.svgSelected.length,
    "noteid": ''
  };
  EPUB.Request.bookStoreRequest("/bookstore/mobile/post/save/my/readnote", data).then(function (r) {
    if (r.flag == "1") {

      that.createUnderline(r.noteid);

      that.createTextCircle(r.noteid, data.digestnote);

      that.render.book.getNotes().then(function () {
        that.render.notes = that.render.book.getChapterNotes(that.render.book.spineNum);
      });
    }
  });
  //删除背景
  that.bacRects.forEach(function (value) {
    that.svg.removeChild(value);
  });
  that.bacRects.length = 0;
  that.hideDialog();
};

/**
 * 保存书签
 */
EPUB.Notation.prototype.saveMark = function () {
  var that = this;
  var pageStartPosition = 0;
  for (var i = 0; i < this.pageIndex - 1; i++) {
    for(var j = 0; j < this.pages[i].length; j++){
      pageStartPosition += this.pages[i][j].length;
    }
  }
  var summary = that.getString(that.svg.children).slice(0, 100);
  var data = {
    "userid": EPUB.USERID,
    "authtoken": EPUB.AUTHTOKEN,
    "bookid": EPUB.BOOKID,
    "adddate": new Date().Format("yyyy-MM-dd hh:mm:ss"),
    "catindex": that.render.spineNum,
    "catname": that.render.chapterName,
    "summary": summary,
    "positions": pageStartPosition
  };
  EPUB.Request.bookStoreRequest("/bookstore/mobile/post/save/my/bookmark", data).then(function (r) {
    if (r.flag == "1") {
      that.markNode.style.background = "url(images/redsign.png) no-repeat";
      that.markNode.setAttribute("data-markId", r.id);
      that.render.book.getMarks();
    }
  });
};

/**
 * 删除书签
 * @param markId
 */
EPUB.Notation.prototype.deleteMark = function (markId) {
  var that = this, data = {
    "userid": EPUB.USERID,
    "authtoken": EPUB.AUTHTOKEN,
    "bookmarkid": markId
  };
  EPUB.Request.bookStoreRequest("/bookstore/mobile/post/delete/my/bookmark", data).then(function (r) {
    if (r.flag == "1") {
      that.markNode.style.background = "url(images/sign.png) no-repeat";
      that.markNode.setAttribute("data-markId", "");
      that.render.book.getMarks();
    }
  });
};

/**
 * 根据选择区域创建下划线
 * @param items
 * @param data
 */
EPUB.Notation.prototype.createUnderline = function (noteid) {
  var that = this;
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("id", noteid);
  that.svg.insertBefore(g, that.svgSelected[0]);

  that.svgSelected.forEach(function (value) {
    var underRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    underRect.setAttribute("x", value.getAttribute("x"));
    underRect.setAttribute("y", value.getAttribute("y"));
    underRect.setAttribute("width", value.getAttribute("data-width"));
    underRect.setAttribute("height", "2");
    underRect.setAttribute("fill", "red");
    underRect.setAttribute("class", noteid);
    underRect.addEventListener("click", function (e) {
      that.show(e.clientX, e.clientY)
    });
    that.svg.appendChild(underRect);
  });

  that.svgSelected.forEach(function (value) {
    g.appendChild(value);
  });

  g.addEventListener("click", function (e) {
    var g = e.target.parentElement;
    var string = that.getString(g.childNodes);

    window.jiathis_config.summary = string;
    var sharedButton = document.getElementById("shared");
    sharedButton.addEventListener("click",function(e){
      that.showShareNode(e.clientX, e.clientY)
    });

    var copiedButton = document.getElementById("copied-button");
    copiedButton.setAttribute("data-clipboard-text", string);
    var client = new ZeroClipboard(copiedButton);

    var delA = document.getElementById("del-note");
    delA.setAttribute("data-noteid", noteid);

    that.showHasDel(e.clientX, e.clientY);
  });
};

/**
 * 创建提示笔记内容框的圆点
 * @param x
 * @param y
 * @param data
 */
EPUB.Notation.prototype.createTextCircle = function (noteid, digestnote) {
  var that = this;
  var textElem = that.svgSelected[that.svgSelected.length - 1];
  var x = parseInt(textElem.getAttribute("x"), 10) + parseInt(textElem.getAttribute("data-width"), 10),
      y = parseInt(textElem.getAttribute("y"), 10);
  var circleElem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circleElem.setAttribute("cx", x);
  circleElem.setAttribute("cy", y);
  circleElem.setAttribute("r", "5");
  circleElem.setAttribute("fill", "red");
  circleElem.setAttribute("class", noteid);
  circleElem.addEventListener("mouseover", function (e) {
    that.showText(e.x, e.y, digestnote);
  });
  circleElem.addEventListener("mouseout", function () {
    that.hideText();
  });
  that.svg.appendChild(circleElem);
  that.bacRects.length = 0;
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
    for(var j = 0; j < this.pages[i].length; j++){
      startOffset += this.pages[i][j].length;
    }
  }
  startOffset += svgArray.indexOf(this.svgSelected[0]) - backRect.length;

  endOffset = startOffset + this.svgSelected.length;
  return {
    "startOffset": startOffset,
    "endOffset": endOffset
  };
};

/**
 * 当页面被加载时，显示批注信息
 */
EPUB.Notation.prototype.showNotation = function () {
  var that = this;
  if (that.render.notes.length > 0) {
    var pageEndLength = 0, pageStartLength = 0;
    for (var i = 0; i < this.pageIndex; i++) {
      pageStartLength = pageEndLength;
      for(var j = 0; j < this.pages[i].length; j++){
        pageEndLength += this.pages[i][j].length;
      }
    }
    that.render.notes.forEach(function (value) {
      var startOffset = value.numbers.split(",")[0], endOffset = value.numbers.split(",")[1];
      if (pageStartLength <= startOffset && pageEndLength >= endOffset) {
        var notationStart = startOffset - pageStartLength;
        var notationEnd = endOffset - pageStartLength;
        var svgArray = Array.prototype.slice.call(that.svg.children);
        that.svgSelected = svgArray.slice(notationStart, notationEnd);
        that.createUnderline(value.id);
        that.createTextCircle(value.id, value.digestnote);
      }
    });
  }
};

/**
 * 当页面被加载时显示书签
 */
EPUB.Notation.prototype.showMark = function () {
  var that = this,
      showMark = "";
  if (that.render.marks.length > 0) {
    var pageEndPosition = 0, pageStartPosition = 0;
    for (var i = 0; i < this.pageIndex; i++) {
      pageStartPosition = pageEndPosition;
      for(var j = 0; j < this.pages[i].length; j++){
        pageEndPosition += this.pages[i][j].length;
      }
    }
    that.render.marks.forEach(function (mark) {
      if (mark.positions >= pageStartPosition && mark.positions < pageEndPosition) {
        showMark = mark;
      }
    });
  }

  if (showMark) {
    that.markNode.style.background = "url(images/redsign.png) no-repeat";
    that.markNode.setAttribute("data-markId", showMark.id);
  } else {
    that.markNode.style.background = "url(images/sign.png) no-repeat";
    that.markNode.setAttribute("data-markId", "");
  }
};
