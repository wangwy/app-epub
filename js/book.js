/**
 * Created by wangwy on 15-1-7.
 * 书本的基本功能操作
 */
EPUB.Book = function (elem, bookUrl) {
  this.spineNum = 6;
  this.bookUrl = bookUrl;
  this.render = new EPUB.Render(elem);
  this.el = this.render.el;
  this.events = new EPUB.Events(this, this.el);
  this.format = new EPUB.Format(this);
  this.createEvent("book:tocReady");
  this.createEvent("book:noteReady");
  this.beforeDisplay();
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
    book.getNote();
    return true;
  }).then(function () {
    book.display().then(function () {
      book.render.spineNum = book.spineNum;
      book.render.chapterName = book.format.toc[book.spineNum].label;
      book.render.display(1);
    });
  });
};

/**
 * 页面展示
 * @param mark
 */
EPUB.Book.prototype.display = function ( url, spineNum) {
  var that = this;
  this.spineNum = spineNum || this.spineNum;
  var path = url || that.manifest[that.spine[that.spineNum].id].url;
  var chapterXml = EPUB.Request.loadFile(path, 'xml').then(function (context) {
    return that.render.initialize(context);
  }).then(function (context) {
    return that.render.getPagesNum(context);
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
        that.render.spineNum = that.spineNum;
        that.render.chapterName = that.format.toc[that.spineNum].label;
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
  var prev,that = this;
  prev = this.render.prevPage();
  if (!prev) {
    if (this.spineNum > 0) {
      this.spineNum--;
      this.display().then(function () {
        var  num = that.render.pages.length;
        that.render.spineNum = that.spineNum;
        that.render.chapterName = that.format.toc[that.spineNum].label;
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

  var ul = document.createElement("ul");
  ul.setAttribute("class", "menuconlist");
  tocDiv.appendChild(ul);

  if (doc instanceof Array) {
    doc.forEach(function (item) {
      var li = document.createElement("li");
      ul.appendChild(li);
      var span = document.createElement("span");
      //a.href = item.href;
      span.addEventListener("click", function () {
        that.display(item.url, item.spineNum).then(function () {
          that.render.spineNum = that.spineNum;
          that.render.chapterName = that.format.toc[that.spineNum].label;
          that.render.display(1);
        });
        document.getElementById('menubox_bg').style.display = (document.getElementById('menubox_bg').style.display == 'none') ? '' : 'none';
        document.getElementsByClassName("menubox")[0].style.display = "none";
        that.showMenu = true;
      });
      span.textContent = item.label;
      li.appendChild(span);
    });
  }
};

/**
 * 获取笔记列表
 */
EPUB.Book.prototype.getNote = function () {
  var that = this,
      path = "/bookstore/mobile/get/my/readnote",
      data = {
        "userid": "1",
        "authtoken": "dfdfdf",
        "pagesize": "10",
        "pagenum": "1",
        "bookid": "14"};
  EPUB.Request.modifyNote(path, data).then(function (r) {
    that.notelist = r.notelist;
    that.tell("book:noteReady");
  });
};

/**
 * 创建笔记列表
 * @param notelist
 */
EPUB.Book.prototype.createNote = function (notelist) {
  var that = this;
  var noteDialog = document.getElementById("test2_3");
  var recordp = noteDialog.getElementsByClassName("redcolor")[0];
  recordp.textContent = notelist.length;
  if (notelist.length > 0) {
    notelist.forEach(function (item) {
      var div = document.createElement("div");
      div.setAttribute("class", "coninfbox");
      noteDialog.appendChild(div);

      var span1 = document.createElement("span");
      span1.setAttribute("class", "browcolor");
      span1.textContent = item.adddate;
      div.appendChild(span1);

      var p = document.createElement("p");
      p.setAttribute("class", "coninfop");
      p.textContent = item.summary;
      p.addEventListener("click",function(e){
        that.display('',item.catindex).then(function(){
          that.render.spineNum = that.spineNum;
          that.render.chapterName = that.format.toc[that.spineNum].label;
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
  }
};
