/**
 * Created by wangwy on 15-1-7.
 */
EPUB.Book = function (elem, bookUrl) {
  this.spineNum = 1;
  this.render = new EPUB.Render(elem);
  this.format = new EPUB.Format(bookUrl);
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
    return true;
  }).then(function () {
    book.display("next");
  });
};

/**
 * 页面展示
 * @param mark
 */
EPUB.Book.prototype.display = function (mark) {
  var that = this;
  var num;
  var chapterXml = EPUB.Request.loadFile(that.manifest[that.spine[that.spineNum].id].url, 'xml');
  chapterXml.then(function (context) {
    return that.render.initialize(context);
  }).then(function (context) {
    return that.render.getPagesNum(context);
  }).then(function () {
    if (mark === "next") {
      num = 1;
    } else if (mark === "prev") {
      num = that.render.pages.length;
    }
    that.render.display(num);
  });
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
  var next;
  next = this.render.nextPage();
  if (!next) {
    if (this.spineNum < this.spine.length) {
      this.spineNum++;
      this.display("next");
    } else {
      alert("已经是最后一页");
    }
  }
};

/**
 * 上一页
 */
EPUB.Book.prototype.prevPage = function () {
  var prev;
  prev = this.render.prevPage();
  if (!prev) {
    if (this.spineNum > 0) {
      this.spineNum--;
      this.display("prev");
    } else {
      alert("已经是第一页");
    }
  }
};
