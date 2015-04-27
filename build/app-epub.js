/**
 * Created by wangwy on 15-1-9.
 */
var EPUB = EPUB || {};
EPUB.App = {};
(function (root) {
  root.ePub = function (ele,userid,bookid,authtoken) {
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
  ACTIVE: function () {
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
  }
};
new tab('test2_li_now_');

var width = getComputedStyle(document.getElementsByClassName("menubox")[0])["width"].slice(0, -2);
EPUB.SHOWMENU = true;
var btnZoom = document.getElementById("btnZoom");

var menubox = document.getElementsByClassName("menubox")[0];

//控制目录显示或者隐藏
btnZoom.addEventListener("click", function () {
  document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
  document.getElementsByClassName("menubox")[0].style.display = "";
  if (EPUB.SHOWMENU) {
    startrun(menubox, "right", 0, function () {
      startrun(menubox, "opacity", "100")
    });
    EPUB.SHOWMENU = false;
  } else {
    startrun(menubox, "right", -width, function () {
      startrun(menubox, "opacity", "100");
    });
    EPUB.SHOWMENU = true;
  }
});

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
};/**
 * Created by wangwy on 15-1-8.
 */
EPUB.VERSION = "1.0.0";
EPUB.LINEGAP = 15;

EPUB.ELEMENTS = {
  "p": {
    fontSize: 18,
    fontFamily: "Monospace, 'Microsoft Yahei', 微软雅黑, STHeiti, Hei,'Heiti SC',黑体"
  },
  "a": {
    fontSize: 18,
    fontFamily: "Monospace, 'Microsoft Yahei', 微软雅黑, STHeiti, Hei,'Heiti SC',黑体"
  },
  "span": {
    fontSize: 18,
    fontFamily: "Monospace, 'Microsoft Yahei', 微软雅黑, STHeiti, Hei,'Heiti SC',黑体"
  },
  "h1": {
    fontSize: 22,
    fontFamily: "Monospace, 'Microsoft Yahei', 微软雅黑, STHeiti, Hei,'Heiti SC',黑体"
  },
  "h2": {
    fontSize: 20,
    fontFamily: "Monospace, 'Microsoft Yahei', 微软雅黑, STHeiti, Hei,'Heiti SC',黑体"
  },
  "h3": {
    fontSize: 18,
    fontFamily: "Monospace, 'Microsoft Yahei', 微软雅黑, STHeiti, Hei,'Heiti SC',黑体"
  },
  "img": {
    fontSize: 0,
    fontFamily: "Monospace, 'Microsoft Yahei', 微软雅黑, STHeiti, Hei,'Heiti SC',黑体"
  }
};

EPUB.USERID = "";//用户id
EPUB.BOOKID = "";//书籍id
EPUB.AUTHTOKEN = "";//认证

;/**
 * Created by wangwy on 15-1-7.
 * 书本的基本功能操作
 */
EPUB.Book = function (elem) {
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
  book.getBook(EPUB.USERID, EPUB.BOOKID, EPUB.AUTHTOKEN).then(function (path) {
    book.bookUrl = EPUB.Utils.parseUrl(path).directory;
    return book.loadOpfFile(book.bookUrl);
  }).then(function (context) {
    var bookData = book.format.formatOpfFile(context);
    book.manifest = bookData.manifest;
    book.spine = bookData.spine;
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
    window.addEventListener("resize", function () {
      book.initialChapter(book.renderContext).then(function () {
        var displayNum = book.render.calculateDisplayNum(book.render.position);
        book.render.display(displayNum);
      })
    });
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
    var displayNum = book.render.calculateDisplayNum(book.render.position);
    book.render.display(displayNum);
  });
};

/**
 * 根据书籍id获取书籍路径
 * @param userId
 * @param bookId
 * @param authToken
 * @returns {Promise.promise|*}
 */
EPUB.Book.prototype.getBook = function (userId, bookId, authToken) {
  var data = {"user_id": userId, "book_id": bookId, "auth_token": authToken}
  var deferred = new RSVP.defer();
  EPUB.Request.bookStoreRequest("/retech-bookstore/mobile/post/get_epub_info", data).then(function (r) {
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
  var deferred = new RSVP.defer();
  this.spineNum = spineNum || this.spineNum;
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
  var retru = this.render.initialize(context).then(function (docBody) {
    that.render.spineNum = that.spineNum;
    that.render.getPagesNum(docBody);
    that.render.notes = that.getChapterNotes(that.spineNum);
    that.render.marks = that.getChapterMarks(that.spineNum);
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
      this.display().then(function (context) {
        return that.initialChapter(context);
      }).then(function () {
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
          that.display(item.url, item.spineNum).then(function (context) {
            return that.initialChapter(context);
          }).then(function () {
            that.render.display(1);
          });
          document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
          document.getElementsByClassName("menubox")[0].style.display = "none";
          EPUB.SHOWMENU = true;
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
    "progress": this.progress
  };
  EPUB.Request.bookStoreRequest("/retech-bookstore/mobile/post/my/readprogress/save", data)
};

/**
 * 获取阅读进度
 * @returns {*}
 */
EPUB.Book.prototype.getProgress = function () {
  var that = this,
      path = "/retech-bookstore/mobile/post/my/singlebook/readprogress/get",
      data = {
        "user_id": EPUB.USERID,
        "auth_token": EPUB.AUTHTOKEN,
        "book_id": EPUB.BOOKID
      };

  var getProgressRet = EPUB.Request.bookStoreRequest(path, data).then(function (r) {
    if (r.user_readprogress != "") {
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
      path = "/retech-bookstore/mobile/post/my/singlebook/note/list",
      data = {
        "user_id": EPUB.USERID,
        "auth_token": EPUB.AUTHTOKEN,
        "book_id": EPUB.BOOKID
      };

  var getNoteRet = EPUB.Request.bookStoreRequest(path, data).then(function (r) {
    that.notelist = r.user_note_list;
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
        document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
        document.getElementsByClassName("menubox")[0].style.display = "none";
        EPUB.SHOWMENU = true;
      });
      div.appendChild(p);

      var span2 = document.createElement("span");
      span2.setAttribute("class", "browcolor");
      span2.textContent = item.note_content;
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
      path = "/retech-bookstore/mobile/post/my/singlebook/bookmark/list",
      data = {
        "user_id": EPUB.USERID,
        "book_id": EPUB.BOOKID,
        "auth_token": EPUB.AUTHTOKEN
      };

  var getMarkRet = EPUB.Request.bookStoreRequest(path, data).then(function (r) {
    that.markList = r.user_bookmark_list;
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
        document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
        document.getElementsByClassName("menubox")[0].style.display = "none";
        EPUB.SHOWMENU = true;
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
};;/**
 * Created by wangwy on 15-3-2.
 */
EPUB.Events = function (obj, el) {
  this.events = {};
  if (!el) {
    this.el = document.createElement('div');
  } else {
    this.el = el;
  }

  obj.createEvent = this.createEvent;
  obj.tell = this.tell;
  obj.listen = this.listen;
  obj.deafen = this.deafen;

  return this;
};

/**
 * 创建事件
 * @param evt
 * @returns {CustomEvent}
 */
EPUB.Events.prototype.createEvent = function (evt) {
  var e = new CustomEvent(evt);
  this.events[evt] = e;
  return e;
};

/**
 * 触发事件
 * @param evt
 * @param msg
 */
EPUB.Events.prototype.tell = function (evt, msg) {
  var e;
  if (!this.events[evt]) {
    console.warn("No event: ", evt, "defined yet, creating.");
    e = this.createEvent(evt);
  } else {
    e = this.events[evt];
  }

  if (msg) e.msg = msg;
  this.el.dispatchEvent(e);
};

/**
 * 监听事件
 * @param evt
 * @param func
 * @param bindto
 */
EPUB.Events.prototype.listen = function(evt, func, bindto){
  if(!this.events[evt]){
    console.warn("No event: ", evt, "defined yet, creating");
    this.createEvent(evt);
    return;
  }

  if(bindto){
    this.el.addEventListener(evt, func.bind(bindto), false);
  }else{
    this.el.addEventListener(evt, func, false);
  }
};

/**
 * 移除事件
 * @param evt
 * @param func
 */
EPUB.Events.prototype.deafen = function(evt, func){
  this.el.removeEventListener(evt, func, false);
};
;/**
 * Created by wangwy on 15-1-12.
 * 初始化书本等信息
 */
EPUB.Format = function (book) {
  this.book = book;
//  this.bookUrlOptions = EPUB.Utils.parseUrl(this.baseUrl);
};

/**
 * 格式化META-INF/container.xml
 * @param containerXML
 * @returns {{packagePath: string, encoding: string}}
 */
EPUB.Format.prototype.formatContainerXML = function (containerXML) {
  this.baseUrl = this.book.bookUrl || '';
  var rootfile, fullpath, encoding;
  rootfile = containerXML.querySelector("rootfile");
  fullpath = rootfile.getAttribute("full-path");
  this.bookUrl = this.baseUrl + EPUB.Utils.parseUrl(fullpath).base;
  encoding = containerXML.xmlEncoding;
  return {
    'packagePath': fullpath,
    'encoding': encoding,
    'bookUrl': this.bookUrl
  }
};

/**
 * 格式化opf文件
 * @param opfFileXML
 * @returns {{metadata: *, manifest: {}, spine: Array}}
 */
EPUB.Format.prototype.formatOpfFile = function (opfFileXML) {
  var that = this;
  var metadataNode, manifestNode, spineNode;
  var metadata, manifest, spine;

  metadataNode = opfFileXML.querySelector("metadata");
  manifestNode = opfFileXML.querySelector("manifest");
  spineNode = opfFileXML.querySelector("spine");

  metadata = this.formatMetadata(metadataNode);
  manifest = this.formatManifest(manifestNode);
  spine = this.formatSpine(spineNode,manifest);
  spine.forEach(function(item){
    that.spineIndex[item.href] = item.index;
  });
  return {
    'metadata': metadata,
    'manifest': manifest,
    'spine': spine
  }
};

/**
 * 格式化书本元数据
 * @param xml
 */
EPUB.Format.prototype.formatMetadata = function (xml) {
  var metadata = {};

  metadata.bookTitle = this.getXMLTextByTag(xml, 'title');
  metadata.creator = this.getXMLTextByTag(xml, 'creator');
  metadata.description = this.getXMLTextByTag(xml, 'description');
  metadata.pubdate = this.getXMLTextByTag(xml, 'pubdate');
  metadata.publisher = this.getXMLTextByTag(xml, 'publisher');
  metadata.identifier = this.getXMLTextByTag(xml, 'identifier');
  metadata.language = this.getXMLTextByTag(xml, 'language');
  metadata.rights = this.getXMLTextByTag(xml, 'rights');

  return metadata;
};

/**
 * 通过标签名获取标签内容
 * @param xml
 * @param tag
 * @returns {string}
 */
EPUB.Format.prototype.getXMLTextByTag = function (xml, tag) {
  var found = xml.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", tag),
      el;
  if (!found || found.length === 0) return '';
  el = found[0];
  if (el.childNodes.length) {
    return el.childNodes[0].nodeValue;
  }
  return '';
};

/**
 * 格式化书页清单
 * @param xml
 * @returns {{}}
 */
EPUB.Format.prototype.formatManifest = function (xml) {
  var manifest = {}, that = this;

  var selected = xml.querySelectorAll("item"),
      items = Array.prototype.slice.call(selected);

  items.forEach(function (item) {
    var id = item.getAttribute('id'),
        href = item.getAttribute('href') || '',
        type = item.getAttribute('media-type') || '',
        properties = item.getAttribute('properties') || '';

    manifest[id] = {
      'href': href,
      'url': that.bookUrl + href,
      'type': type,
      'properties': properties
    };

    if (item.getAttribute('media-type') == "application/x-dtbncx+xml") {
      that.formatToc(href);
    }
  });

  return manifest;
};

/**
 * 格式化书脊
 * @param xml
 * @returns {Array}
 */
EPUB.Format.prototype.formatSpine = function (spineNode, manifest) {
  var spine = [];
  this.spineIndex = {};
  var selected = spineNode.getElementsByTagName("itemref"),
      items = Array.prototype.slice.call(selected);
  items.forEach(function (item, index) {
    var id = item.getAttribute("idref"),
        properties = item.getAttribute("properties") || '',
        linear = item.getAttribute("linear") || '';
    var vert = {
      'id': id,
      'properties': properties,
      'linear': linear,
      'href': manifest[id].href,
      'url': manifest[id].url,
      'index': index
    };
    spine.push(vert);
  });

  return spine;
};

/**
 * 格式化目录
 * @param path
 */
EPUB.Format.prototype.formatToc = function (path) {
  var that = this,
      url = this.bookUrl + path;
  this.toc = [];
  EPUB.Request.loadFile(url, 'xml').then(function (contents) {
    var navMap = contents.getElementsByTagName("navMap")[0];

    function getTOC(nodes, parent) {
      var list = [];
      var items = Array.prototype.slice.call(nodes);
      items.forEach(function (item) {
        var id = item.getAttribute('id'),
            content = item.getElementsByTagName("content")[0],
            href = content.getAttribute('src'),
            url = that.bookUrl + href,
            navLabel = item.getElementsByTagName("navLabel")[0],
            text = item.getElementsByTagName("navLabel")[0].textContent ? item.getElementsByTagName("navLabel")[0].textContent : "",
            subitems = item.getElementsByTagName("navPoint") || false,
            subs = false,
            childof = (item.parentNode == parent);

        if(!childof) return;

        if(subitems){
          subs = getTOC(subitems, item)
        }

        list.push({
          "id":id,
          "href": href,
          "label": text,
          "url": url,
          "spineNum": parseInt(that.spineIndex[href]),
          "subitems": subs
        });
      });
      return list;
    }
    that.toc = getTOC(navMap.getElementsByTagName("navPoint"), navMap);
    that.book.createToc(that.book.getTOC());
  });
};;/**
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
    shareButton.addEventListener("click", function (e) {
      that.showShareNode(e.pageX, e.pageY)
    });

    var showDialog = document.getElementById("show-dialog");
    showDialog.addEventListener('click', function () {
      that.showDialog();
    });
  } else {
    this.hideHasNote();
    this.hideHasDel();
    this.hideShareNode();
    this.hideText();
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
  var height = EPUB.Utils.getCss(this.textNode, "height").slice(0, -2);
  y + parseInt(height) > this.render.height ? y = y - height : y;
  this.textNode.style.left = x + "px";
  this.textNode.style.top = y + "px";
  this.textNode.style.display = "block";
};

/**
 * 显示笔记窗口
 */
EPUB.Notation.prototype.showDialog = function () {
  this.dialogNode.getElementsByClassName("pup_hight")[0].textContent = this.getString(this.svgSelected);
  document.getElementById("back").setAttribute("class", "pup_bg");
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
  var deffer = new RSVP.defer(), that = this, count = group.length;
  if (group.length > 0) {
    group.forEach(function (vaule) {
      that.deletNotation(vaule).then(function () {
        count--
      });
      if (count == 0) {
        deffer.resolve(true);
      }
    });
  }
  deffer.resolve(true);
  return deffer.promise;
};

/**
 *保存笔记
 */
EPUB.Notation.prototype.sendNotation = function () {
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
  var group = [], groupid;
  this.svgSelected.forEach(function (value) {
    if (value.parentNode.tagName == "g") {
      groupid = value.parentNode.getAttribute("id");
      if (group.indexOf(groupid) == -1) {
        group.push(groupid);
      }
    }
  });
  that.delSelectedNotation(group).then(function(){
    return EPUB.Request.bookStoreRequest("/retech-bookstore/mobile/post/my/note/save", data)
  }).then(function (r) {
    if (r.flag == "1") {

      that.createUnderline(r.note_id);

      that.createTextCircle(r.note_id, document.getElementById("comment-content").value);

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
      that.markNode.style.backgroundPosition = "-106px -70px";
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
      that.markNode.style.backgroundPosition = "-106px 0px";
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
        that.createTextCircle(value.id, value.note_content);
      } else if (pageStartLength <= startOffset && pageEndLength >= endOffset) {
        notationStart = startOffset - pageStartLength;
        notationEnd = endOffset - pageStartLength;
        svgArray = Array.prototype.slice.call(document.getElementsByClassName("context"));
        that.svgSelected = svgArray.slice(notationStart, notationEnd);
        that.createUnderline(value.id);
        that.createTextCircle(value.id, value.note_content);
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
    that.markNode.style.backgroundPosition = "-106px -70px";
    that.markNode.setAttribute("data-markid", showMark.id);
  } else {
    that.markNode.style.backgroundPosition = "-106px 0px";
    that.markNode.setAttribute("data-markid", "");
  }
};

;/**
 * Created by wangwy on 15-1-8.
 * 段落内容判断
 */
EPUB.Paragraph = function () {
};

/**
 * 是否是非中文字符
 * @param c
 * @returns {boolean}
 */
EPUB.Paragraph.prototype.isDbcCase = function (c) {
  if ((c >= 32 && c <= 127) || (c >= 65377 && c <= 65439)) {
    return true;
  } else {
    return false;
  }
};

/**
 * 判断是否是空格
 * @param c
 * @returns {boolean}
 */
EPUB.Paragraph.prototype.isSpace = function (c) {
  if (c == 32) {
    return true;
  } else {
    return false;
  }
};

/**
 * 判断是否是英文字符
 * @param c
 * @returns {boolean}
 */
EPUB.Paragraph.prototype.isEnglish = function (c) {
  if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) {
    return true;
  } else {
    return false;
  }
};

/**
 * 判断是否是标点符号
 * @param c
 * @returns {boolean}
 */
EPUB.Paragraph.prototype.isPunctuation = function (c) {
  if ((c >= 33 && c <= 47) || (c >= 58 && c <= 63)) {
    return true;
  } else {
    return false;
  }
};

/**
 * 判断是否为中文
 * @param c
 * @returns {boolean}
 */
EPUB.Paragraph.prototype.isChinese = function (c) {
  if (c >= 10000) {
    return true;
  } else {
    return false;
  }
};;/**
 * Created by wangwy on 15-1-13.
 * 段落内容渲染
 */
EPUB.Render = function (book) {
  this.position = 0;
  this.book = book;
  this.el = this.book.el;
  this.paragraph = new EPUB.Paragraph();
  this.lineGap = EPUB.LINEGAP;
  this.selections = new EPUB.Selections(this);
};

/**
 * 获取页面中的元素
 * @param context
 */
EPUB.Render.prototype.initialize = function (context) {
  this.width = this.el.clientWidth;
  this.height = this.el.clientHeight - 60;
  this.imagesAll = {};
  var that = this;
  var deffer = new RSVP.defer();
  var documentBody = context.getElementsByTagName("body")[0];
  this.displayedPage = 1;
  this.currentPositionY = 12;
  this.currentPositionX = 0;
  this.currentLine = new Array();
  this.currentPage = new Array();
  this.pages = new Array();
  this.currentPage.push(this.currentLine);
  this.pages.push(this.currentPage);
  var items = context.querySelectorAll("img");
  if (items.length > 0) {
    var images = Array.prototype.slice.call(items);
    var count = images.length;
    images.forEach(function (value) {
      var image = new Image();
      var htmlUrl = EPUB.Utils.parseUrl(that.chapterUrl);
      var url = EPUB.Utils.parseUrl(value.getAttribute("src"));
      image.onload = function () {
        count--;
        if (!that.imagesAll.hasOwnProperty(url.filename)) {
          that.imagesAll[url.filename] = {
            src: htmlUrl.directory + value.getAttribute("src"),
            height: image.height,
            width: image.width
          };
        }
        if (count == 0) {
          deffer.resolve(documentBody);
        }
      };
      image.src = htmlUrl.directory + value.getAttribute("src");
    });
  } else {
    deffer.resolve(documentBody);
  }
  return deffer.promise;
};

/**
 * 获取一个章节分为几页
 * @param elem
 * @returns {Array.length|*}
 */
EPUB.Render.prototype.getPagesNum = function (elem) {
  this.getAllTextNodeContextAndRender(elem);
  this.displayedPages = this.pages.length;
  return this.displayedPages;
};

/**
 * 获取一个文档中所有文本
 * @param elem
 */
EPUB.Render.prototype.getAllTextNodeContextAndRender = function (elem) {
  var nodes = elem.childNodes;
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i], nodeType = node.nodeType;
    if (EPUB.ELEMENTS.hasOwnProperty(node.nodeName) && node.nodeName != "span") {
      //一段结束，换行
      this.currentPositionY += (EPUB.ELEMENTS[node.nodeName].fontSize + this.lineGap);
      this.currentPositionX = EPUB.ELEMENTS[node.nodeName].fontSize * 2;
      this.currentLine = new Array();
      this.currentPage.push(this.currentLine);
      if (node.nodeName == "img") {
        this.currentPositionY -= this.lineGap/2;
        this.imageSetting(node);
      }
    }
    if (nodeType == 3 && !(/^\s+$/.test(node.nodeValue))) {
      this.typeSetting(node);
    } else if (nodeType == 1 || nodeType == 9 || nodeType == 11) {
      this.getAllTextNodeContextAndRender(node);
    }
  }
  this.displayedPages = this.pages.length;
};

/**
 * 设置图片
 * @param ele
 */
EPUB.Render.prototype.imageSetting = function (ele) {
  var url = EPUB.Utils.parseUrl(ele.getAttribute("src"));
  var img = this.imagesAll[url.filename];
  var hScale = img.height / (this.height - this.currentPositionY - this.lineGap*2);
  var wScale = img.width / this.width;
  var image;
  var maxScale = Math.max(hScale, wScale);
  var height = 0, width = 0, x = 0;
  if (maxScale > 1 && hScale < 5) {
    height = img.height / maxScale;
    width = img.width / maxScale;
    if (width < this.width) {
      x = (this.width - width) / 2;
    }
    image = new imageNode(img.src, x, this.currentPositionY, height, width);
    this.currentLine.push(image);
    this.currentLine = new Array();
    this.currentPage.push(this.currentLine);
    this.currentPositionY += (height+this.lineGap * 1.5)
  }else if(hScale > 5){
    hScale = img.height / this.height;
    wScale = img.width / this.width;
    maxScale = Math.max(hScale, wScale);
    height = img.height / maxScale;
    width = img.width / maxScale;
    if (width < this.width) {
      x = (this.width - width) / 2;
    }
    this.currentLine = new Array();
    image = new imageNode(img.src, x, 12, height, width);
    this.currentLine.push(image);
    this.currentPage = new Array();
    this.currentPage.push(this.currentLine);
    this.pages.push(this.currentPage);
    this.currentPositionY += height
  } else {
    height = img.height;
    width = img.width;
    if (width < this.width) {
      x = (this.width - width) / 2;
    }
    image = new imageNode(img.src, x, this.currentPositionY, height, width);
    this.currentLine.push(image);
    this.currentLine = new Array();
    this.currentPage.push(this.currentLine);
    this.currentPositionY += (height+this.lineGap * 1.5);
  }
};

/**
 * 将文本拆分并排版
 * @param txt
 */
EPUB.Render.prototype.typeSetting = function (ele) {
  var txt = ele.textContent, eleStyle = EPUB.ELEMENTS[ele.parentNode.tagName] || EPUB.ELEMENTS["p"];
  for (var i = 0; i < txt.length; i++) {
    var char = txt.charAt(i);
    var charCode = txt.charCodeAt(i);
    var rect, glyph, xOffset;
    this.changeLineOrPage(this.width, this.height, eleStyle, charCode);
    if (this.paragraph.isDbcCase(charCode)) {
      if (this.paragraph.isSpace(charCode) && this.currentPositionX == 0) {
        rect = new Rect(eleStyle.fontFamily, eleStyle.fontSize, this.currentPositionX, this.currentPositionY, 0, eleStyle.fontSize);
      } else {
        xOffset = this.getXOffsetByCharCode(eleStyle, charCode);
        rect = new Rect(eleStyle.fontFamily, eleStyle.fontSize, this.currentPositionX, this.currentPositionY, xOffset, eleStyle.fontSize);
        this.currentPositionX += xOffset;
      }
    }
    else {
      xOffset = this.getXOffsetByCharCode(eleStyle, charCode);
      rect = new Rect(eleStyle.fontFamily, eleStyle.fontSize, this.currentPositionX, this.currentPositionY, xOffset, eleStyle.fontSize);
      this.currentPositionX += xOffset;
    }
    glyph = new Glyph(char, rect);
    this.currentLine.push(glyph);
  }
};

/**
 * 换行，换页计算
 * @param width
 * @param height
 * @param length
 */
EPUB.Render.prototype.changeLineOrPage = function (width, height, eleStyle, charCode) {
  var offset = eleStyle.fontSize;
  //换行计算
  if ((this.currentPositionX + offset > width) && ((this.paragraph.isPunctuation(charCode)) || this.paragraph.isEnglish(charCode))) {

  } else {
    if (this.currentPositionX + offset > width) {
      if (this.currentPositionX >= width) {
        this.reSettingLine(width);
      }
      this.currentPositionY += (eleStyle.fontSize + this.lineGap);
      this.currentPositionX = 0;
      this.currentLine = new Array();
      this.currentPage.push(this.currentLine);
    }
  }
  //换页计算
  if (this.currentPositionY + eleStyle.fontSize + this.lineGap > height) {
    this.currentPositionY = eleStyle.fontSize;
    this.currentLine = new Array();
    this.currentPage = new Array();
    this.currentPage.push(this.currentLine);
    this.pages.push(this.currentPage);
  }
};

/**
 * 每一行重新排版
 * @param width
 */
EPUB.Render.prototype.reSettingLine = function (width) {
  var length = this.currentLine.length;
  var enNum = 0, chLength = 0, glyph;
  for (var i = 0; i < length; i++) {
    glyph = this.currentLine[i];
    if (glyph.type == "text") {
      if (this.paragraph.isDbcCase(glyph.txt.charCodeAt(0))) {
        enNum++;
      } else {
        chLength += glyph.rect.width;
      }
    }
  }
  var x = this.currentLine[0].rect.px;
  var offset = (width - chLength - x) / enNum;
  for (var j = 0, length = this.currentLine.length; j < length; j++) {
    if (j == 0 && this.paragraph.isSpace(this.currentLine[0].txt.charCodeAt(0))) {
      continue;
    } else {
      glyph = this.currentLine[j];
      glyph.rect.px = x;
      if (this.paragraph.isDbcCase(glyph.txt.charCodeAt(0))) {
//        glyph.rect.fontSize = (offset / glyph.rect.width) * glyph.rect.fontSize;
        glyph.rect.width = offset;
        x += offset;
      } else {
        x += glyph.rect.width;
      }
    }
  }
};

/**
 * 页面展示
 * @param index
 */
EPUB.Render.prototype.display = function (index) {
  this.el.innerHTML = "";
  this.displayedPage = index;
  this.position = this.getPosition(index);
  var page = this.pages[this.displayedPage - 1];
  var textHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"" + this.width + "\" height=\"" + this.height + "\">";
  for (var i = 0; i < page.length; i++) {
    for (var j = 0; j < page[i].length; j++) {
      var glyph = page[i][j];
      if (glyph.type == "text") {
        textHTML += "<text class=\"context\"  font-family=\"" + glyph.rect.fontFamily + "\" font-size='" + glyph.rect.fontSize + "' data-width = '" + glyph.rect.width + "' data-height = '" + glyph.rect.height + "' x='" + glyph.rect.px + "' y='" + glyph.rect.py + "'>" + glyph.txt + "</text>";
      } else if (glyph.type == "image") {
        textHTML += "<image class=\"context\" xlink:href='" + glyph.src + "' x='" + glyph.x + "' y='" + glyph.y + "'  height='" + glyph.h + "' width='" + glyph.w + "' data-height = '"+glyph.h+"'/>";
      }
    }
  }
  textHTML += "</svg>";
  this.el.innerHTML = textHTML;
  this.selections.initSelection();
};

/**
 * 获取本页起点偏移量
 * @param index
 * @returns {number}
 */
EPUB.Render.prototype.getPosition = function(index){
  var pageStartPosition = 0;
  for (var i = 0; i < index - 1; i++) {
    for (var j = 0; j < this.pages[i].length; j++) {
      pageStartPosition += this.pages[i][j].length;
    }
  }
  return pageStartPosition;
};
/**
 * 根据偏移量计算显示页码
 * @param offset
 */
EPUB.Render.prototype.calculateDisplayNum = function (offset) {
  var num = 0;
  for (var i = 0, length = this.pages.length; i < length; i++) {
    for (var j = 0, pageLength = this.pages[i].length; j < pageLength; j++) {
      num += this.pages[i][j].length;
      if (num > offset) {
        return i + 1;
      }
    }
  }
};

/**
 * 根据节点与字节码计算x坐标的偏移量
 * @param elem
 * @param charCode
 * @returns {number}
 */
EPUB.Render.prototype.getXOffsetByCharCode = function (elem, charCode) {
  var xOffset = 0;
  if (this.paragraph.isDbcCase(charCode)) {
    xOffset = elem.fontSize / 2 + 3
  } else {
    xOffset = elem.fontSize;
  }
  return xOffset;
};
/*EPUB.Render.prototype.display = function (index) {
 this.el.innerHTML = "";
 this.displayedPage = index;
 localStorage.setItem("pageIndex", index);
 var page = this.pages[this.displayedPage - 1];
 var textHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"" + this.el.style.width + "\" height=\"" + this.el.style.height + "\">";
 for (var i = 0; i < page.length; i++) {
 var glyph = page[i];
 if (glyph.type == "text") {
 if(index-1 == this.notationPage && i >= this.notationStart-1 && i < this.notationEnd-1){
 textHTML += "<rect   height='2' width = '"+glyph.rect.width+"' x='" + glyph.rect.px + "' y='" + glyph.rect.py + "' fill='red'></rect>";
 textHTML += "<text   font-family=\"" + glyph.rect.fontFamily + "\" font-size='" + glyph.rect.fontSize + "' data-width = '" + glyph.rect.width + "' data-height = '" + glyph.rect.height + "' x='" + glyph.rect.px + "' y='" + glyph.rect.py + "'>" + glyph.txt + "</text>";
 }else{
 textHTML += "<text   font-family=\"" + glyph.rect.fontFamily + "\" font-size='" + glyph.rect.fontSize + "' data-width = '" + glyph.rect.width + "' data-height = '" + glyph.rect.height + "' x='" + glyph.rect.px + "' y='" + glyph.rect.py + "'>" + glyph.txt + "</text>";
 }
 } else if (glyph.type == "image") {
 textHTML += "<image xlink:href='" + glyph.src + "' x='" + glyph.x + "' y='" + glyph.y + "'  height='" + glyph.h + "' width='" + glyph.w + "'/>";
 }
 }
 textHTML += "</svg>";
 this.el.innerHTML = textHTML;
 this.selections.initSelection();
 };*/

/*EPUB.Render.prototype.display = function(index){
 this.el.innerHTML = "";
 this.displayedPage = index;
 localStorage.setItem("pageIndex", index);
 var page = this.pages[this.displayedPage - 1];
 var svgElem = document.createElement("svg");
 this.el.appendChild(svgElem);
 svgElem.setAttribute("xmlns","http://www.w3.org/2000/svg");
 svgElem.setAttribute("version","1.1");
 svgElem.setAttribute("width",this.el.style.width);
 svgElem.setAttribute("height",this.el.style.height);
 for(var i = 0; i < page.length; i++){
 var glyph = page[i];
 var textElem = document.createElement("text");
 textElem.setAttribute("font-family",glyph.rect.fontFamily);
 textElem.setAttribute("font-size",glyph.rect.fontSize);
 textElem.setAttribute("x",glyph.rect.px);
 textElem.setAttribute("y",glyph.rect.py);
 textElem.textContent = glyph.txt;
 svgElem.appendChild(textElem);
 }
 };*/

/*EPUB.Render.prototype.isNotation = function () {
 var startOffset = localStorage.getItem("startOffset");
 var endOffset = localStorage.getItem("endOffset");
 var pageLength = 0;
 for(var i = 0, length = this.pages.length; i < length; i++){
 pageLength += this.pages[i].length;
 if(pageLength > startOffset) {
 pageLength -= this.pages[i].length;
 this.notationPage = i;
 this.notationStart = startOffset - pageLength;
 this.notationEnd = endOffset - pageLength;
 break;
 }
 }

 };*/

/**
 * 下一页
 */
EPUB.Render.prototype.nextPage = function () {
  if (this.displayedPage < this.displayedPages) {
    this.displayedPage++;
    this.display(this.displayedPage);
    return true;
  } else {
    return false;
  }
};

/**
 * 上一页
 */
EPUB.Render.prototype.prevPage = function () {
  if (this.displayedPage > 1) {
    this.displayedPage--;
    this.display(this.displayedPage);
    return true;
  } else {
    return false;
  }
};

/**
 * 文本节点属性
 * @param fontFamily
 * @param fontSize
 * @param x
 * @param y
 * @constructor
 */
function Rect(fontFamily, fontSize, x, y, width, height) {
  this.fontFamily = fontFamily;
  this.fontSize = fontSize;
  this.px = x;
  this.py = y;
  this.width = width;
  this.height = height;
}

/**
 * 文本节点
 * @param txt
 * @param rect
 * @constructor
 */
function Glyph(txt, rect) {
  this.txt = txt;
  this.rect = rect;
  this.type = "text";
}

/**
 * 图片节点
 * @param src
 */
function imageNode(src, x, y, h, w) {
  this.src = src;
  this.x = x;
  this.y = y;
  this.h = h;
  this.w = w;
  this.type = "image";
};/**
 * Created by wangwy on 15-1-7.
 * 与后台的请求
 */
var EPUB = EPUB || {};
EPUB.Request = {};
EPUB.Request.loadFile = function (url, type) {
  var deferred = new RSVP.defer();
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.onreadystatechange = handler;
  if (type == "json") {
    xhr.setRequestHeader("Accept", "application/json");
  }
  xhr.send();
  function handler() {
    if (this.readyState === this.DONE) {
      if (this.status === 200 || this.responseXML) {
        var r;
        if (type == 'xml') {
          r = new DOMParser().parseFromString(this.responseText,'text/xml');
        } else if (type == 'json') {
          r = JSON.parse(this.responseText);
        } else {
          r = this.responseText;
        }
        deferred.resolve(r);
      }
    }
  }

  return deferred.promise;
};


/**
 * 后台数据交互接口
 * @param url
 * @param data
 * @returns {promise|S.promise|$$enumerator$$Enumerator.promise|deferred.promise}
 */
EPUB.Request.bookStoreRequest = function (url, data) {
  var deferred = new RSVP.defer();
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.onreadystatechange = handler;
  xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
  xhr.send(EPUB.Utils.JsonToFormData(data));

  function handler() {
    if (this.readyState === 4) {
      var r = JSON.parse(this.responseText);
      deferred.resolve(r);
    }
  }

  return deferred.promise;
};

;/**
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
  this.svg.onmousedown = function () {
    return false
  };
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
    that.createRects();
    that.inserRects();
  }

  this.svg.addEventListener("mousedown", function (e) {
//    that.svgPosition = that.getElementPosition(that.svg);
    that.svgPosition = EPUB.Utils.offset(that.svg);
    //选择区域起点坐标
    that.startXY = {x: e.pageX, y: e.pageY};
    //鼠标点击区域坐标
    that.unChangeXY = that.startXY;
    that.reInitSelections();
    that.svg.addEventListener("mousemove", handle, false);
  }, false);
  this.svg.addEventListener("mouseup", function (e) {
    that.svg.removeEventListener("mousemove", handle, false);
    that.notation.svgSelected = that.selectionElements;
    that.notation.bacRects = that.rects;
    that.notation.showPostion = {x: e.pageX, y: e.pageY};
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
  var items = Array.prototype.slice.call(document.getElementsByClassName("context")), that = this;
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
      if (value.tagName != "image") {
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
;/**
 * Created by wangwy on 15-3-9.
 */
EPUB.Utils = {};

/**
 * 格式化路径
 * @param url
 * @returns {{protocol: string, host: string, path: string, origin: string, directory: string, base: string, filename: string, extension: string, fragment: string, href: *}}
 */
EPUB.Utils.parseUrl = function (url) {
  var uri = {
        protocol: '',
        host: '',
        path: '',
        origin: '',
        directory: '',
        base: '',
        filename: '',
        extension: '',
        fragment: '',
        href: url
      },
      blob = url.indexOf('blob:'),
      doubleSlash = url.indexOf('://'),
      search = url.indexOf('?'),
      fragment = url.indexOf('#'),
      withoutProtocol,
      dot,
      firstSlash;

  if (blob === 0) {
    uri.protocol = "blob";
    uri.base = url.indexOf(0, fragment);
    return uri;
  }

  if (fragment != -1) {
    uri.search = url.slice(fragment + 1);
    uri.href = url.slice(0, fragment);
  }

  if (search != -1) {
    uri.search = url.slice(search + 1);
    uri.href = url.slice(0, search);
  }

  if (doubleSlash != -1) {
    uri.protocol = url.slice(0, doubleSlash);
    withoutProtocol = url.slice(doubleSlash + 3);
    firstSlash = withoutProtocol.indexOf('/');

    if (firstSlash === -1) {
      uri.host = uri.path;
      uri.path = "";
    } else {
      uri.host = withoutProtocol.slice(0, firstSlash);
      uri.path = withoutProtocol.slice(firstSlash);
    }

    uri.origin = uri.protocol + "://" + uri.host + "/";
    uri.directory = this.formatFolder(uri.path);
    uri.base = uri.origin + uri.directory;
  } else {
    uri.path = url;
    uri.directory = this.formatFolder(url);
    uri.base = uri.directory;
  }

  uri.filename = url.replace(uri.base, '');
  dot = uri.filename.lastIndexOf('.');
  if (dot != -1) {
    uri.extension = uri.filename.slice(dot + 1);
  }
  return uri;
};

/**
 * 获取文件
 * @param url
 * @returns {string}
 */
EPUB.Utils.formatFolder = function (url) {
  var lastSlash = url.lastIndexOf('/');
  if (lastSlash == -1) var folder = '';
  folder = url.slice(0, lastSlash + 1);
  return folder;
};

/**
 * 对Date的扩展，将 Date 转化为指定格式的String
 * @param fmt
 * @returns {*}
 * @constructor
 */
Date.prototype.Format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
};

/**
 * 获取css属性的值
 * @param o
 * @param key
 * @returns {*}
 */
EPUB.Utils.getCss = function (o, key) {
  return o.currentStyle ? o.currentStyle[key] : window.getComputedStyle(o, null)[key];
};


/**
 * 获取元素在页面中的文档坐标
 * @param element
 * @returns {{top: number, left: number}}
 */
EPUB.Utils.offset = function (element) {
  var docElem, win, elem = element, box = {top: 0, left: 0}, doc = elem && elem.ownerDocument;
  if (!doc) {
    return;
  }
  docElem = doc.documentElement;
  if (!this.contains(docElem, elem)) {
    return box;
  }

  if (typeof elem.getBoundingClientRect() !== "undefined") {
    box = elem.getBoundingClientRect();
  }
  win = this.getWindow(doc);
  return {
    top: box.top + win.pageYOffset - docElem.clientTop,
    left: box.left + win.pageXOffset - docElem.clientLeft
  };
};

/**
 * 判断a,b是否是断开的节点
 * @param a
 * @param b
 * @returns {boolean}
 */
EPUB.Utils.contains = function (a, b) {
  var adown = a.nodeType === 9 ? a.documentElement : a,
      bup = b && b.parentNode;
  return a === bup || !!( bup && bup.nodeType === 1 && adown.contains(bup) );
};

/**
 * 判断这个节点是否是window
 * @param obj
 * @returns {boolean}
 */
EPUB.Utils.isWindow = function (obj) {
  return obj != null && obj === obj.window;
};

/**
 * 获取window
 * @param elem
 * @returns {*}
 */
EPUB.Utils.getWindow = function (elem) {
  return this.isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
};

/**
 * 将json转换成formdata形式的字符串
 * @param json
 * @returns {string}
 * @constructor
 */
EPUB.Utils.JsonToFormData = function (json) {
  var string = "";
  for (var o in json) {
    string += o + "=" + json[o] + "&"
  }
  return string.slice(0, -1);
};