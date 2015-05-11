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

  var commentContent = document.getElementById("comment-content");
  commentContent.addEventListener("blur", function () {
    if (commentContent.value == "") {
      commentContent.value = "留下你的笔记";
    }
  });
  commentContent.addEventListener("focus", function () {
    if (commentContent.value == "留下你的笔记") {
      commentContent.value = "";
    }
  });
  var saveButton = document.getElementById("noteSave");
  saveButton.addEventListener("click", function () {
    if (that.getString(that.svgSelected).length > 255) {
      alert("选择内容过大");
    } else if (commentContent.value.length > 255) {
      alert("笔记内容过大");
    } else {
      that.saveNote();
    }
  });

  //笔记内容框
  this.textNode = document.getElementById("note");

  //书签
  this.markNode = document.getElementById("markNode");
  this.markNode.addEventListener("click", function () {
    var markid = that.markNode.getAttribute("data-markid");
    if (markid) {
      that.deleteMark(markid);
    } else {
      that.saveMark();
    }
  });

  this.shareNode = document.getElementById("shareNode");
  this.shareNode.addEventListener("click", function () {
    that.hideShareNode();
  });

  var shareButton = document.getElementById("share");
  shareButton.addEventListener("click", function (e) {
    that.showShareNode(e.pageX, e.pageY)
  });

  var showDialog = document.getElementById("show-dialog");
  showDialog.addEventListener('click', function () {
    that.showDialog();
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
    if(navigator.userAgent.indexOf("Firefox") !== -1){//判断是否是火狐浏览器
      document.removeEventListener("DOMMouseScroll",that.render.book.wheelPage,false);
    }else{
      document.removeEventListener("mousewheel", that.render.book.wheelPage, false);
    }
  } else {
    this.hideHasNote();
    this.hideHasDel();
    this.hideShareNode();
    this.hideText();

    if(navigator.userAgent.indexOf("Firefox") !== -1){//判断是否是火狐浏览器
      document.addEventListener("DOMMouseScroll",that.render.book.wheelPage,false);
    }else{
      document.addEventListener("mousewheel", that.render.book.wheelPage, false);
    }
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
  var that = this;
  if(navigator.userAgent.indexOf("Firefox") !== -1){//判断是否是火狐浏览器
    document.removeEventListener("DOMMouseScroll",that.render.book.wheelPage,false);
  }else{
    document.removeEventListener("mousewheel", that.render.book.wheelPage, false);
  }
  this.textNode.getElementsByTagName("p")[0].textContent = text;
  this.textNode.style.display = "block";
  var height = this.textNode.offsetHeight;
  y + parseInt(height) > this.render.height ? y = y - height : y;
  this.textNode.style.left = x + "px";
  this.textNode.style.top = y + "px";
};

/**
 * 显示笔记窗口
 */
EPUB.Notation.prototype.showDialog = function () {
  this.group = [];
  var groupid, that = this;
  this.svgSelected.forEach(function (value) {
    if (value.parentNode.tagName == "g") {
      groupid = value.parentNode.getAttribute("id");
      if (that.group.indexOf(groupid) == -1) {
        that.group.push(groupid);
      }
    }
  });
  var notesSelectedString = "", notesSelectedPosition = [], svgArray = Array.prototype.slice.call(document.getElementsByClassName("context"));
  if (that.group.length > 0) {
    var notesSelected = this.render.notes.filter(function (value) {
      return that.group.indexOf(value.id.toString()) != -1
    });

    notesSelected.forEach(function (value) {
      if(value.note_content != "留下你的笔记"){
        notesSelectedString += value.note_content + "\n";
      }
      notesSelectedPosition = notesSelectedPosition.concat(value.position.split(","));
    });
    notesSelectedPosition = notesSelectedPosition.concat([this.selectedOffset().startOffset.toString(), this.selectedOffset().endOffset.toString()]);
    this.svgSelected = svgArray.slice(Math.min.apply(this, notesSelectedPosition)-that.render.position, Math.max.apply(this, notesSelectedPosition)-that.render.position);
  }
  this.dialogNode.getElementsByClassName("pup_hight")[0].textContent = this.getString(this.svgSelected);
  if(notesSelectedString != ""){
    document.getElementById("comment-content").value = notesSelectedString;
  }
  document.getElementById("back").setAttribute("class", "pup_bg");
  this.dialogNode.style.display = "block";
};

/**
 * 隐藏笔记内容窗口
 */
EPUB.Notation.prototype.hideText = function () {
  var that = this;
  if(navigator.userAgent.indexOf("Firefox") !== -1){//判断是否是火狐浏览器
    document.addEventListener("DOMMouseScroll",that.render.book.wheelPage,false);
  }else{
    document.addEventListener("mousewheel", that.render.book.wheelPage, false);
  }
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
  this.dialogNode.style.display = "none";
};

/**
 * 显示分享窗口
 * @param x
 * @param y
 */
EPUB.Notation.prototype.showShareNode = function (x, y) {
  this.shareNode.style.left = x + "px";
  this.shareNode.style.top = y + "px";
  this.shareNode.style.display = "block";
};

/**
 * 隐藏分享窗口
 */
EPUB.Notation.prototype.hideShareNode = function () {
  this.shareNode.style.left = 0 + "px";
  this.shareNode.style.top = 0 + "px";
  this.shareNode.style.display = "none";
};

/**
 * 删除笔记
 * @param noteid
 */
EPUB.Notation.prototype.deletNotation = function (noteid) {
  var that = this,
      data = {
        "id": noteid,
        "user_id": EPUB.USERID,
        "auth_token": EPUB.AUTHTOKEN
      };
  var deffer = new RSVP.defer();
  EPUB.Request.bookStoreRequest("/retech-bookstore/mobile/post/my/note/delete", data).then(function (r) {
    if (r.flag == "1") {
      var backRect = document.getElementsByClassName(noteid);
      var items = Array.prototype.slice.call(backRect);
      items.forEach(function (value) {
        that.svg.removeChild(value);
      });
      var g = that.svg.getElementById(noteid);
      var gChild = Array.prototype.slice.call(g.childNodes);
      gChild.forEach(function (value) {
        that.svg.insertBefore(value, g);
      });
      that.svg.removeChild(g);

      that.render.book.getNotes().then(function () {
        that.render.notes = that.render.book.getChapterNotes(that.render.book.spineNum);
      });
      deffer.resolve(true);
    }
    deffer.resolve(false);
  });
  return deffer.promise;
};

/**
 * 删除选中的笔记
 * @param group
 * @returns {Promise.promise|*}
 */
EPUB.Notation.prototype.delSelectedNotation = function (group) {
  var that = this;
  var promises = group.map(function (value) {
    return that.deletNotation(value);
  });
  return RSVP.all(promises);
};

/**
 *保存笔记
 */
EPUB.Notation.prototype.saveNote = function () {
  var that = this,
      data = {
        "user_id": EPUB.USERID,
        "auth_token": EPUB.AUTHTOKEN,
        "book_id": EPUB.BOOKID,
        "chapter_index": that.render.spineNum,
        "chapter_name": that.render.chapterName,
        "position": that.selectedOffset().startOffset + "," + that.selectedOffset().endOffset,
        "position_offset": that.selectedOffset().startOffset + "," + that.svgSelected.length,
        "summary_content": that.getString(that.svgSelected),
        "note_content": document.getElementById("comment-content").value,
        "summary_underline_color": "red",
        "add_time": new Date().Format("yyyy-MM-dd hh:mm:ss"),
        "process": that.render.book.progress
      };
  that.delSelectedNotation(that.group).then(function () {
    return EPUB.Request.bookStoreRequest("/retech-bookstore/mobile/post/my/note/save", data)
  }).then(function (r) {
    if (r.flag == "1") {

      that.createUnderline(r.note_id);

      if(data.note_content != "留下你的笔记"){
        that.createTextCircle(r.note_id, data.note_content);
      }

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
  var pageStartPosition = this.render.position;
  var summary = that.getString(that.svg.childNodes).slice(0, 100);
  var data = {
    "user_id": EPUB.USERID,
    "auth_token": EPUB.AUTHTOKEN,
    "book_id": EPUB.BOOKID,
    "chapter_index": that.render.spineNum,
    "chapter_name": that.render.chapterName,
    "position": pageStartPosition,
    "add_time": new Date().Format("yyyy-MM-dd hh:mm:ss"),
    "summary_content": summary
  };

  EPUB.Request.bookStoreRequest("/retech-bookstore/mobile/post/my/bookmark/add", data).then(function (r) {
    if (r.flag == "1") {
      that.markNode.setAttribute("class", "icon-gernal clicktag");
//      that.markNode.style.backgroundPosition = "-106px -70px";
      that.markNode.setAttribute("data-markid", r.bookmark_id);
      that.render.book.getMarks().then(function () {
        that.render.marks = that.render.book.getChapterMarks(that.render.book.spineNum);
      });
    }
  });
};

/**
 * 删除书签
 * @param markid
 */
EPUB.Notation.prototype.deleteMark = function (markid) {
  var that = this,
      data = {
        "user_id": EPUB.USERID,
        "auth_token": EPUB.AUTHTOKEN,
        "id": markid
      };

  EPUB.Request.bookStoreRequest("/retech-bookstore/mobile/post/my/bookmark/delete", data).then(function (r) {
    if (r.flag == "1") {
      that.markNode.setAttribute("class", "icon-gernal icon-tag");
//      that.markNode.style.backgroundPosition = "-106px 0px";
      that.markNode.setAttribute("data-markid", "");
      that.render.book.getMarks().then(function () {
        that.render.marks = that.render.book.getChapterMarks(that.render.book.spineNum);
      });
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
    if (value.tagName != "image") {
      var underRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      underRect.setAttribute("x", value.getAttribute("x"));
      underRect.setAttribute("y", value.getAttribute("y"));
      underRect.setAttribute("width", value.getAttribute("data-width"));
      underRect.setAttribute("height", "2");
      underRect.setAttribute("fill", "red");
      underRect.setAttribute("class", noteid);
      underRect.addEventListener("click", function (e) {
        that.show(e.pageX, e.pageY)
      });
      that.svg.appendChild(underRect);
    }
  });

  that.svgSelected.forEach(function (value) {
    g.appendChild(value);
  });

  g.addEventListener("click", function (e) {
    var g = e.target.parentNode;
    var string = that.getString(g.childNodes);

    window.jiathis_config.summary = string;
    var sharedButton = document.getElementById("shared");
    sharedButton.addEventListener("click", function (e) {
      that.showShareNode(e.pageX, e.pageY)
    });

    var copiedButton = document.getElementById("copied-button");
    copiedButton.setAttribute("data-clipboard-text", string);
    var client = new ZeroClipboard(copiedButton);

    var delA = document.getElementById("del-note");
    delA.setAttribute("data-noteid", noteid);

    that.showHasDel(e.pageX, e.pageY);
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
  circleElem.addEventListener("click", function (e) {
    that.showText(e.pageX, e.pageY, digestnote);
  });
  that.svg.appendChild(circleElem);
  that.bacRects.length = 0;
};

/**
 * 获取选取元素在页面里的开始节点与结束节点
 * @returns {{startOffset: number, endOffset: *}}
 */
EPUB.Notation.prototype.selectedOffset = function () {
  var startOffset = this.render.position, endOffset = 0,
      svgArray = Array.prototype.slice.call(document.getElementsByClassName("context"));
  startOffset += svgArray.indexOf(this.svgSelected[0]);

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
    pageStartLength = this.render.position;
    for (var j = 0; j < this.pages[this.pageIndex - 1].length; j++) {
      pageEndLength += this.pages[this.pageIndex - 1][j].length;
    }
    pageEndLength += pageStartLength;
    that.render.notes.forEach(function (value) {
      var startOffset = value.position.split(",")[0], endOffset = value.position.split(",")[1];
      var notationStart, notationEnd, svgArray;
      if (pageStartLength > startOffset && pageStartLength < endOffset && pageEndLength >= endOffset) {
        notationStart = 0;
        notationEnd = endOffset - pageStartLength;
        svgArray = Array.prototype.slice.call(document.getElementsByClassName("context"));
        that.svgSelected = svgArray.slice(notationStart, notationEnd);
        that.createUnderline(value.id);

        if(value.note_content != "留下你的笔记"){
          that.createTextCircle(value.id, value.note_content);
        }
      } else if (pageStartLength <= startOffset && pageEndLength >= endOffset) {
        notationStart = startOffset - pageStartLength;
        notationEnd = endOffset - pageStartLength;
        svgArray = Array.prototype.slice.call(document.getElementsByClassName("context"));
        that.svgSelected = svgArray.slice(notationStart, notationEnd);
        that.createUnderline(value.id);

        if(value.note_content != "留下你的笔记"){
          that.createTextCircle(value.id, value.note_content);
        }
      } else if (pageStartLength <= startOffset && pageEndLength < endOffset) {
        notationStart = startOffset - pageStartLength;
        notationEnd = pageEndLength - pageStartLength;
        svgArray = Array.prototype.slice.call(document.getElementsByClassName("context"));
        that.svgSelected = svgArray.slice(notationStart, notationEnd);
        that.createUnderline(value.id);
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
    pageStartPosition = this.render.position;
    for (var j = 0; j < this.pages[this.pageIndex - 1].length; j++) {
      pageEndPosition += this.pages[this.pageIndex - 1][j].length;
    }
    pageEndPosition += pageStartPosition;
    that.render.marks.forEach(function (mark) {
      if (mark.position >= pageStartPosition && mark.position < pageEndPosition) {
        showMark = mark;
      }
    });
  }

  if (showMark) {
    that.markNode.setAttribute("class", "icon-gernal clicktag");
    that.markNode.setAttribute("data-markid", showMark.id);
  } else {
    that.markNode.setAttribute("class", "icon-gernal icon-tag");
    that.markNode.setAttribute("data-markid", "");
  }
};

