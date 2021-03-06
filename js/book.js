/**
 * Created by wangwy on 15-1-7.
 * 书本的基本功能操作
 */
EPUB.Book = function (elem) {
  this.el = this.getEl(elem);
  this.render = new EPUB.Render(this);
  this.events = new EPUB.Events(this, this.el);
  this.format = new EPUB.Format(this);
  this.createEvent("book:progress");
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
  book.addLoading();
  book.getBook(EPUB.USERID, EPUB.BOOKID, EPUB.AUTHTOKEN).then(function (path) {
    book.bookUrl = EPUB.Utils.parseUrl(path).directory;
    return book.loadOpfFile(book.bookUrl);
  }).then(function (context) {
    book.bookData = book.format.formatOpfFile(context);
    book.manifest = book.bookData.manifest;
    book.spine = book.bookData.spine;
    book.bookData.elem = {"clientWidth": book.el.clientWidth, "clientHeight": book.el.clientHeight};
    window.addEventListener("resize", function () {
      book.initialChapter(book.renderContext).then(function () {
        var displayNum = book.render.calculateDisplayNum(book.render.position);
        book.render.display(displayNum);
        book.createBookPosition();
      })
    });
    if (EPUB.USERID != "") {
      window.onbeforeunload = function (event) {
        var message = '离开此页将关闭浏览器，你的阅读进度将自动保存';
        if (typeof event == 'undefined') {
          event = window.event;
        }
        if (event) {
          event.returnValue = message;
          book.saveProgress();
        }
        return message;
      };
    }
  }).then(function () {
    return book.getProgress();
  }).then(function () {
    return book.getNotes();
  }).then(function () {
    return book.getMarks();
  }).then(function () {
    return book.display();
  }).then(function (context) {
    return book.initialChapter(context);
  }).then(function () {
    var displayNum = book.render.calculateDisplayNum(book.render.position);
    book.render.display(displayNum);
  }).then(function () {
    book.getbookPageNumObj();
    book.remLoading();
  })
};

/**
 * 获取所有章节的页码
 * @returns {*}
 */
EPUB.Book.prototype.getbookPageNumObj = function () {
  var that = this;
  return EPUB.Request.bookStoreRequest("/node/", this.bookData, "json").then(function (r) {
    that.bookPageNumObj = r;
    that.createBookPosition();
  });
};

/**
 * 计算当前进度
 */
EPUB.Book.prototype.createBookPosition = function () {
  var position = 0;
  if (this.bookPageNumObj) {
    if (this.spineNum != 0) {
      position = (this.bookPageNumObj[this.spineNum - 1].percentage + (this.render.displayedPage / this.render.pages.length) * (this.bookPageNumObj[this.spineNum].pageNum / this.bookPageNumObj.allNum)) * 100;
    } else {
      position = this.render.displayedPage / this.bookPageNumObj.allNum * 100;
    }
    if (position <= 99) {
      position = Math.round(position);
    } else if (position > 99 && position < 100) {
      position = 99;
    } else {
      position = 100;
    }
    document.getElementsByClassName("rdprogres")[0].textContent = position + "%";
    this.tell("book:progress",position);
  }
};

/**
 * 根据书籍id获取书籍路径
 * @param userId
 * @param bookId
 * @param authToken
 * @returns {Promise.promise|*}
 */
EPUB.Book.prototype.getBook = function (userId, bookId, authToken) {
  var data = {"user_id": userId, "book_id": bookId, "auth_token": authToken, "platform": "web"};
  var deferred = new RSVP.defer();
  EPUB.Request.bookStoreRequest(EPUB.BASEPATH + "/mobile/post/get_epub_info", data).then(function (r) {
    deferred.resolve(r.path);
  });
  return deferred.promise;
};
/**
 * 页面展示
 * @param mark
 */
EPUB.Book.prototype.display = function (url, spineNum) {
  var that = this;
  that.addLoading();
  var deferred = new RSVP.defer();
  this.spineNum = spineNum || this.spineNum;
  if (this.spineNum >= this.spine.length) {
    this.spineNum = 0;
  }
  var path = url || that.manifest[that.spine[this.spineNum].id].url;
  that.render.chapterUrl = path;
  EPUB.Request.loadFile(path, 'xml').then(function (context) {
    //获得章节标题
    that.render.chapterName = that.spineNum.toString();
    var chapterElem = context.querySelectorAll("h1,h2,h3");
    if (chapterElem.length > 0) {
      that.render.chapterName = chapterElem[0].textContent;
    }
    var chapterNode = document.getElementById("chapterId");
    chapterNode.textContent = that.render.chapterName;
    deferred.resolve(context);
    that.renderContext = context;
    that.remLoading();
  });
  return deferred.promise;
};

/**
 * 初始化章节
 * @param context
 * @returns {*|Promise}
 */
EPUB.Book.prototype.initialChapter = function (context) {
  var that = this;
  that.addLoading();
  var retru = this.render.initialize(context).then(function (docBody) {
    that.render.spineNum = that.spineNum;
    that.render.getPagesNum(docBody);
    that.render.notes = that.getChapterNotes(that.spineNum);
    that.render.marks = that.getChapterMarks(that.spineNum);
    that.remLoading();
  });
  return retru;
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
    if (this.spineNum < this.spine.length - 1) {
      this.spineNum++;
      this.display().then(function (context) {
        return that.initialChapter(context);
      }).then(function () {
        that.render.display(1);
      });
    } else {
      that.progress = "yes";
      EPUB.Utils.showAlert("已经是最后一页");
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
      this.display().then(function (context) {
        return that.initialChapter(context);
      }).then(function () {
        var num = that.render.pages.length;
        that.render.display(num);
      });
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
          that.display(item.url, item.spineNum).then(function (context) {
            return that.initialChapter(context);
          }).then(function () {
            that.render.display(1);
          });

          that.addPageListener();
          document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
          document.getElementsByClassName("menubox")[0].style.display = "none";
          document.getElementById("btnMenu").setAttribute("class", "icon-gernal icon-menu");
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
 * 保存阅读进度
 */
EPUB.Book.prototype.saveProgress = function () {
  var data = {
    "user_id": EPUB.USERID,
    "auth_token": EPUB.AUTHTOKEN,
    "book_id": EPUB.BOOKID,
    "chapter_index": this.spineNum,
    "position": this.render.position,
    "progress": this.progress,
    "platform": "web"
  };
  EPUB.Request.bookStoreRequest(EPUB.BASEPATH + "/mobile/post/my/readprogress/save", data)
};

/**
 * 获取阅读进度
 * @returns {*}
 */
EPUB.Book.prototype.getProgress = function () {
  var that = this,
      path = EPUB.BASEPATH + "/mobile/post/my/singlebook/readprogress/get",
      data = {
        "user_id": EPUB.USERID,
        "auth_token": EPUB.AUTHTOKEN,
        "book_id": EPUB.BOOKID,
        "platform": "web"
      };

  var getProgressRet = EPUB.Request.bookStoreRequest(path, data).then(function (r) {
    if (r.flag != 0 && r.user_readprogress != "") {
      that.spineNum = r.user_readprogress.chapter_index;
      that.render.position = r.user_readprogress.position;
      that.progress = r.user_readprogress.progress;
    } else {
      that.spineNum = 0;
      that.render.position = 0;
      that.progress = "no";
    }
  });
  return getProgressRet;
};

/**
 * 获取笔记列表
 */
EPUB.Book.prototype.getNotes = function () {
  var that = this,
      path = EPUB.BASEPATH + "/mobile/post/my/singlebook/note/list",
      data = {
        "user_id": EPUB.USERID,
        "auth_token": EPUB.AUTHTOKEN,
        "book_id": EPUB.BOOKID,
        "platform": "web"
      };

  var getNoteRet = EPUB.Request.bookStoreRequest(path, data).then(function (r) {
    if (r.flag != 0) {
      that.notelist = r.user_note_list;
      that.createNote(that.notelist);
    } else {
      that.notelist = [];
    }
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
      span1.textContent = item.add_time;
      div.appendChild(span1);

      var p = document.createElement("p");
      p.setAttribute("class", "coninfop");
      p.textContent = item.summary_content;
      p.addEventListener("click", function (e) {
        that.display('', item.chapter_index).then(function (context) {
          return that.initialChapter(context);
        }).then(function () {
          var num = that.render.calculateDisplayNum(parseInt(item.position.split(",")[0]));
          that.render.display(num);
        });

        that.addPageListener();
        document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
        document.getElementsByClassName("menubox")[0].style.display = "none";
        document.getElementById("btnMenu").setAttribute("class", "icon-gernal icon-menu");
      });
      div.appendChild(p);

      var span2 = document.createElement("span");
      span2.setAttribute("class", "browcolor");
      span2.textContent = item.note_content;
      div.appendChild(span2);

      var span3 = document.createElement("span");
      span3.setAttribute("class", "redcolor");
      if (item.note_content != "") {
        span3.textContent = "注：";
      }
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
      path = EPUB.BASEPATH + "/mobile/post/my/singlebook/bookmark/list",
      data = {
        "user_id": EPUB.USERID,
        "book_id": EPUB.BOOKID,
        "auth_token": EPUB.AUTHTOKEN,
        "platform": "web"
      };

  var getMarkRet = EPUB.Request.bookStoreRequest(path, data).then(function (r) {
    if (r.flag != 0) {
      that.markList = r.user_bookmark_list;
      that.createMark(that.markList);
    } else {
      that.markList = [];
    }
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
      markListSpan.textContent = value.add_time;
      markListDiv.appendChild(markListSpan);

      var markListP = document.createElement("p");
      markListP.setAttribute("class", "coninfop");
      markListP.textContent = value.summary_content;
      markListP.addEventListener("click", function () {
        that.display('', value.chapter_index).then(function (context) {
          return that.initialChapter(context);
        }).then(function () {
          var num = that.render.calculateDisplayNum(parseInt(value.position));
          that.render.display(num);
        });

        that.addPageListener();
        document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
        document.getElementsByClassName("menubox")[0].style.display = "none";
        document.getElementById("btnMenu").setAttribute("class", "icon-gernal icon-menu");
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
    if (value.chapter_index == spineNum) {
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
    if (value.chapter_index == spineNum) {
      marks.push(value);
    }
  });
  return marks;
};

/**
 * 鼠标滚动、按键盘方向键时翻页函数
 * @param e
 */
EPUB.Book.prototype.pageHandle = function (e) {
  if (e.wheelDelta > 0 || e.detail < 0 || e.keyCode == 37 || e.keyCode == 38) {
    book.prevPage();
  } else if (e.wheelDelta < 0 || e.detail > 0 || e.keyCode == 39 || e.keyCode == 40) {
    book.nextPage();
  }
};

/**
 * 取消全屏
 * @param el
 */
EPUB.Book.prototype.cancelFullScreen = function (el) {
  var requestMethod = el.cancelFullScreen || el.webkitCancelFullScreen || el.mozCancelFullScreen || el.msExitFullscreen;
  if (requestMethod) {
    requestMethod.call(el);
  } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
    var wscript = new ActiveXObject("WScript.Shell");
    if (wscript !== null) {
      wscript.SendKeys("{F11}");
    }
  }
};

/**
 * 全屏显示
 * @param el
 * @returns {boolean}
 */
EPUB.Book.prototype.requestFullScreen = function (el) {
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
};

/**
 * 显示目录、书签、笔记
 * @param num
 */
EPUB.Book.prototype.showMenuBox = function (num) {
  document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
  document.getElementsByClassName("menubox")[0].style.display = "";
  this.render.selections.notation.hideAllDialog();
  var menubox = document.getElementsByClassName("menubox")[0];
  EPUB.Utils.startrun(menubox, "right", num, function () {
    EPUB.Utils.startrun(menubox, "opacity", "100")
  });
};

/**
 * 添加鼠标滚动翻页、键盘翻页事件
 */
EPUB.Book.prototype.addPageListener = function () {
  var that = this;
  if (navigator.userAgent.indexOf("Firefox") !== -1) {//判断是否是火狐浏览器
    document.addEventListener("DOMMouseScroll", that.pageHandle, false);
  } else {
    document.addEventListener("mousewheel", that.pageHandle, false);
  }
  document.addEventListener("keydown", that.pageHandle, false);
};

/**
 * 移除鼠标滚动翻页、键盘翻页事件
 */
EPUB.Book.prototype.remPageListener = function () {
  var that = this;
  if (navigator.userAgent.indexOf("Firefox") !== -1) {//判断是否是火狐浏览器
    document.removeEventListener("DOMMouseScroll", that.pageHandle, false);
  } else {
    document.removeEventListener("mousewheel", that.pageHandle, false);
  }
  document.removeEventListener("keydown", that.pageHandle, false);
};

/**
 * 添加加载锁定屏幕效果
 */
EPUB.Book.prototype.addLoading = function () {
  var div = document.createElement("div");
  div.setAttribute("id", "loadingEffect");

  var overlayDiv = document.createElement("div");
  overlayDiv.style.position = "absolute";
  overlayDiv.style.top = 0;
  overlayDiv.style.left = 0;
  overlayDiv.style.bottom = 0;
  overlayDiv.style.right = 0;
  overlayDiv.style.backgroundColor = "#000";
  overlayDiv.style.opacity = 0;
  div.appendChild(overlayDiv);

  var messageDiv = document.createElement("div");
  messageDiv.style.position = "absolute";
  messageDiv.style.maxWidth = "200px";
  messageDiv.style.width = "auto";
  messageDiv.textContent = "正在加载，请稍候......";
  messageDiv.style.background = "#333";
  messageDiv.style.font = "14px/20px '宋体','Arail'";
  messageDiv.style.color = "#fff";
  messageDiv.style.padding = "10px";
  messageDiv.style.display = "block";
  messageDiv.style.opacity = 0;
  messageDiv.style.top = '50%';
  messageDiv.style.left = '50%';
  messageDiv.style.border = "none";
  div.appendChild(messageDiv);
  document.getElementsByTagName("body")[0].appendChild(div);
  messageDiv.style.marginLeft = -(messageDiv.getBoundingClientRect().width/2) + "px";
  messageDiv.style.marginTop = -(messageDiv.getBoundingClientRect().height/2) + "px";
  var x = 0;
  var t = setInterval(function () {
    if (x > 1) {
      clearInterval(t);
    }
    x += 0.05;
    messageDiv.style.opacity = x;
  }, 25);
  this.remPageListener();
};

/**
 * 移除加载锁定屏幕效果
 */
EPUB.Book.prototype.remLoading = function () {
  var elem = document.getElementById("loadingEffect");
  if (elem) {
    document.getElementsByTagName("body")[0].removeChild(elem);
  }
  this.addPageListener();
};

/**
 * 根据百分比获得书籍进度
 * @param percent
 * @returns {{spineNum: number, displayNum: number}}
 */
EPUB.Book.prototype.goProgressByPercent = function (percent) {
  var spineNum = 1;
  var displayNum = 1;
  var that = this;
  var pageNum = this.bookPageNumObj.allNum * percent;
  for(var num in this.bookPageNumObj){
    if(this.bookPageNumObj[num].endNum && (this.bookPageNumObj[num].endNum >= pageNum)){
      spineNum = num;
      break;
    }
  }
  that.display('', spineNum).then(function (context) {
    return that.initialChapter(context);
  }).then(function () {
    displayNum = Math.ceil(((pageNum - that.bookPageNumObj[spineNum].startNum + 1)/that.bookPageNumObj[spineNum].pageNum)*(that.render.pages.length));
    if(displayNum == 0){
      displayNum = 1;
    }
    that.render.display(displayNum);
  });
};