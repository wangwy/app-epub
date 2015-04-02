/**
 * Created by wangwy on 15-1-7.
 * 书本的基本功能操作
 */
EPUB.Book = function (elem, bookUrl) {
  this.spineNum = 6;
  this.bookUrl = bookUrl;
  this.el = this.getEl(elem);
  this.render = new EPUB.Render(this);
  this.events = new EPUB.Events(this, this.el);
  this.format = new EPUB.Format(this);
  this.beforeDisplay();
};

/**
 * 根据id获得element
 * @param elem
 * @returns {HTMLElement}
 */
EPUB.Book.prototype.getEl = function (elem) {
  return document.getElementById(elem);
};

/**
 * 获取书本的基本信息于章节所指页
 */
EPUB.Book.prototype.beforeDisplay = function () {
  var book = this;
  book.loadOpfFile(this.format.bookUrlOptions.href).then(function (context) {
    var bookData = book.format.formatOpfFile(context);
    book.manifest = bookData.manifest;
    book.spine = bookData.spine;
  }).then(function () {
    return book.getNotes();
  }).then(function () {
    return book.getMarks();
  }).then(function () {
    return book.display();
  }).then(function () {
    book.render.display(1);
  });
};

/**
 * 页面展示
 * @param mark
 */
EPUB.Book.prototype.display = function (url, spineNum) {
  var that = this;
  this.spineNum = spineNum || this.spineNum;
  var path = url || that.manifest[that.spine[that.spineNum].id].url;
  var chapterXml = EPUB.Request.loadFile(path, 'xml').then(function (context) {
    //获得章节标题
    var chapterString = context.getElementsByTagName("header")[0].getElementsByTagName("h1")[0].textContent;
    var chapterNode = document.getElementById("chapterId");
    chapterNode.textContent = chapterString;

    return that.render.initialize(context);
  }).then(function (context) {
    that.render.spineNum = that.spineNum;
    that.render.chapterName = that.format.toc[that.spineNum].label;
    that.render.getPagesNum(context);
    that.render.notes = that.getChapterNotes(that.spineNum);
    that.render.marks = that.getChapterMarks(that.spineNum);
  });
  return chapterXml;
};

/**
 * 通过/META-INF/container.xml获得rootfile节点里full-path属性所指的文件(OPS/package.opf)
 * @param bookPath
 * @returns {*}
 */
EPUB.Book.prototype.loadOpfFile = function (bookPath) {
  var book = this;
  var containerPath = bookPath + "META-INF/container.xml",
      opfFileXml;

  opfFileXml = EPUB.Request.loadFile(containerPath, 'xml').then(function (context) {
    return book.format.formatContainerXML(context);
  }).then(function (paths) {
    book.render.bookUrl = paths.bookUrl;
    return EPUB.Request.loadFile(bookPath + paths.packagePath, 'xml');
  });
  return opfFileXml;
};

/**
 * 下一页
 */
EPUB.Book.prototype.nextPage = function () {
  var next, that = this;
  next = this.render.nextPage();
  if (!next) {
    if (this.spineNum < this.spine.length) {
      this.spineNum++;
      this.display().then(function () {
        that.render.display(1);
      });
    } else {
      alert("已经是最后一页");
    }
  }
};

/**
 * 上一页
 */
EPUB.Book.prototype.prevPage = function () {
  var prev, that = this;
  prev = this.render.prevPage();
  if (!prev) {
    if (this.spineNum > 0) {
      this.spineNum--;
      this.display().then(function () {
        var num = that.render.pages.length;
        that.render.display(num);
      });
    } else {
      alert("已经是第一页");
    }
  }
};

/**
 * 获得目录列表
 * @returns {Array}
 */
EPUB.Book.prototype.getTOC = function () {
  return this.format.toc;
};

/**
 * 创建目录
 * @param doc
 */
EPUB.Book.prototype.createToc = function (doc) {
  var that = this;
  var tocDiv = document.getElementById("test2_1");
  tocDiv.setAttribute("class", "tablistx block");
  tocDiv.innerHTML = "";

  if (doc.length > 0) {
    function tocList(parentNode, items, n) {
      var offsetEm = n;
      var ul = document.createElement("ul");
      ul.setAttribute("class", "menuconlist");
      parentNode.appendChild(ul);
      items.forEach(function (item) {
        var li = document.createElement("li");
        li.setAttribute("style", "padding-left:" + offsetEm + "em");
        ul.appendChild(li);
        var a = document.createElement("a");
        a.addEventListener("click", function () {
          that.display(item.url, item.spineNum).then(function () {
            that.render.display(1);
          });
          document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
          document.getElementsByClassName("menubox")[0].style.display = "none";
          that.showMenu = true;
        });
        a.textContent = item.label;
        li.appendChild(a);
        if (item.subitems.length > 0) {
          tocList(ul, item.subitems, offsetEm + 2);
        }
      });
    }

    tocList(tocDiv, doc, 0)
  } else {
    var noTocDiv = document.createElement("div");
    noTocDiv.setAttribute("class", "noconbox");
    tocDiv.appendChild(noTocDiv);

    var noTocA = document.createElement("a");
    noTocA.setAttribute("class", "nomenu nothings");
    noTocA.textContent = "没有目录";
    noTocDiv.appendChild(noTocA);
  }
};

/**
 * 获取笔记列表
 */
EPUB.Book.prototype.getNotes = function () {
  var that = this,
      path = "/bookstore/mobile/get/my/readnote",
      data = {
        "userid": EPUB.USERID,
        "authtoken": EPUB.AUTHTOKEN,
        "pagesize": "10",
        "pagenum": "1",
        "bookid": EPUB.BOOKID};
  var getNoteRet = EPUB.Request.bookStoreRequest(path, data).then(function (r) {
    that.notelist = r.notelist;
    that.createNote(that.notelist);
  });
  return getNoteRet;
};

/**
 * 创建笔记列表
 * @param notelist
 */
EPUB.Book.prototype.createNote = function (notelist) {
  var that = this;
  var noteElem = document.getElementById("test2_3");
  noteElem.innerHTML = "";
  if (notelist.length > 0) {
    var recordNumDiv = document.createElement("div");
    noteElem.appendChild(recordNumDiv);

    var recordNumP = document.createElement("p");
    recordNumP.setAttribute("class", "recordp");
    recordNumP.textContent = "条记录";
    recordNumDiv.appendChild(recordNumP);

    var recordNumSpan = document.createElement("span");
    recordNumSpan.setAttribute("class", "redcolor");
    recordNumP.insertBefore(recordNumSpan, recordNumP.firstChild);

    recordNumSpan.textContent = notelist.length;

    notelist.forEach(function (item) {
      var div = document.createElement("div");
      div.setAttribute("class", "coninfbox");
      noteElem.appendChild(div);

      var span1 = document.createElement("span");
      span1.setAttribute("class", "browcolor");
      span1.textContent = item.adddate;
      div.appendChild(span1);

      var p = document.createElement("p");
      p.setAttribute("class", "coninfop");
      p.textContent = item.summary;
      p.addEventListener("click", function (e) {
        that.display('', item.catindex).then(function () {
          var num = that.render.calculateDisplayNum(parseInt(item.ranges.split(",")[0]));
          that.render.display(num);
        });
        document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
        document.getElementsByClassName("menubox")[0].style.display = "none";
        that.showMenu = true;
      });
      div.appendChild(p);

      var span2 = document.createElement("span");
      span2.setAttribute("class", "browcolor");
      span2.textContent = item.digestnote;
      div.appendChild(span2);

      var span3 = document.createElement("span");
      span3.setAttribute("class", "redcolor");
      span3.textContent = "注：";
      span2.insertBefore(span3, span2.firstChild);
    });
  } else {
    var div = document.createElement("div");
    div.setAttribute("class", "noconbox");
    noteElem.appendChild(div);

    var a = document.createElement("a");
    a.setAttribute("class", "nonote nothings");
    a.textContent = "没有笔记";
    div.appendChild(a);

    var p = document.createElement("p");
    p.setAttribute("class", "nothingp");
    p.textContent = "在阅读时长按以选中文字添加笔记";
    div.appendChild(p);
  }
};

/**
 * 获得标签列表
 */
EPUB.Book.prototype.getMarks = function () {
  var that = this,
      path = "/bookstore/mobile/get/my/bookmark",
      data = {
        "userid": EPUB.USERID,
        "authtoken": EPUB.AUTHTOKEN,
        "pagesize": "10",
        "pagenum": "1",
        "bookid": EPUB.BOOKID
      };
  var getMarkRet = EPUB.Request.bookStoreRequest(path, data).then(function (r) {
    that.markList = r.bookmarklist;
    that.createMark(that.markList);
  });
  return getMarkRet;
};

/**
 * 创建书签列表
 * @param bookmarklist
 */
EPUB.Book.prototype.createMark = function (marklist) {
  var that = this,
      markElem = document.getElementById("test2_2");
  markElem.innerHTML = "";
  if (marklist.length > 0) {
    var makrDiv = document.createElement("div");
    markElem.appendChild(makrDiv);

    var markNumP = document.createElement("p");
    markNumP.setAttribute("class", "recordp");
    markNumP.textContent = "条记录";
    makrDiv.appendChild(markNumP);

    var markNumSpan = document.createElement("span");
    markNumSpan.setAttribute("class", "redcolor");
    markNumSpan.textContent = marklist.length;
    markNumP.insertBefore(markNumSpan, markNumP.firstChild);

    marklist.forEach(function (value) {
      var markListDiv = document.createElement("div");
      markListDiv.setAttribute("class", "coninfbox");
      makrDiv.appendChild(markListDiv);

      var markListSpan = document.createElement("span");
      markListSpan.setAttribute("class", "browcolor");
      markListSpan.textContent = value.adddate;
      markListDiv.appendChild(markListSpan);

      var markListP = document.createElement("p");
      markListP.setAttribute("class", "coninfop");
      markListP.textContent = value.summary;
      markListP.addEventListener("click", function () {
        that.display('', value.catindex).then(function () {
          var num = that.render.calculateDisplayNum(parseInt(value.positions));
          that.render.display(num);
        });
        document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
        document.getElementsByClassName("menubox")[0].style.display = "none";
        that.showMenu = true;
      });
      markListDiv.appendChild(markListP);
    });

  } else {
    var div = document.createElement("div");
    div.setAttribute("class", "noconbox");
    markElem.appendChild(div);

    var a = document.createElement("a");
    a.setAttribute("class", "notag nothings");
    a.textContent = "暂时没有书签";
    div.appendChild(a);

    var p = document.createElement("p");
    p.setAttribute("class", "nothingp");
    p.textContent = "在阅读时点击屏幕右上角可添加书签";
    div.appendChild(p);
  }
};

/**
 * 获取某一章节的笔记列表
 * @param spineNum
 * @returns {Array}
 */
EPUB.Book.prototype.getChapterNotes = function (spineNum) {
  var notes = [];
  this.notelist.forEach(function (value) {
    if (value.catindex == spineNum) {
      notes.push(value);
    }
  });
  return notes;
};

/**
 * 获取某一章节的书签列表
 * @param spineNum
 * @returns {Array}
 */
EPUB.Book.prototype.getChapterMarks = function (spineNum) {
  var marks = [];
  this.markList.forEach(function (value) {
    if (value.catindex == spineNum) {
      marks.push(value);
    }
  });
  return marks;
};