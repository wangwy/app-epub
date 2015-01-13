/**
 * Created by wangwy on 15-1-7.
 */
EPUB.Book = function (elem, bookUrl) {
  this.el = this.getEl(elem);
  this.fontSize = EPUB.FONTSIZE;
   this.fontFamily = EPUB.FONTFAMILY;
   this.wordWidth = EPUB.WORDWIDTH;
   this.paragraph = new EPUB.Paragraph();
   this.lineGap = EPUB.LINEGAP;
   this.currentPositionX = 0;
   this.currentPositionY = EPUB.FONTSIZE;
   this.offset = 0;
   this.chapterPros = 0;
  this.format = new EPUB.Format(bookUrl);
  this.beforeDisplay();
};

EPUB.Book.prototype.beforeDisplay = function () {
  var book = this;
  book.loadOpfFile(this.format.bookUrlOptions.href).then(function (context) {
    book.bookData = book.format.formatOpfFile(context);
    var manifest = book.bookData.manifest,
        spine = book.bookData.spine;
    var chapterXml = EPUB.Request.loadFile(manifest[spine[6].id].url, 'xml');
    chapterXml.then(function (context) {
      return book.initialize(context);
    }).then(function(){
      book.display(0);
    });
  });
};

EPUB.Book.prototype.getEl = function (elem) {
  return document.getElementById(elem);
};

EPUB.Book.prototype.initialize = function (context) {
  var chapterDocument = context.documentElement, that = this;
  that.currentPage = new Array();
  that.pages = new Array();
  that.pages.push(this.currentPage);
  var items = chapterDocument.querySelectorAll('p');
  var epubText = Array.prototype.slice.call(items);
  epubText.forEach(function (value) {
    var tag = value.tagName;
    if (tag === "p") {
      var txt = value.innerHTML;
      that.typeSetting(txt);
    }
  });
  this.displayedPages = this.pages.length;
};

EPUB.Book.prototype.typeSetting = function (txt) {
  //是否为段首paragraph head
  var isParaHead = true;
  var width = parseInt(this.el.style.width.slice(0, -2));
  var height = parseInt(this.el.style.height.slice(0, -2));
  this.currentPositionX = this.fontSize * 2;
  var w, h = this.fontSize;
  var world = "";
  for (var i = 0; i < txt.length; i++) {
    var char = txt.charAt(i);
    var charCode = txt.charCodeAt(i);
    if (this.paragraph.isEnglish(charCode)) {
      world += char;
      continue;
    } else {
      if (this.paragraph.isDbcCase(charCode)) {
        if (!isParaHead)
          this.currentPositionX += this.wordWidth;

        w = this.wordWidth;
      }
      else {
        if (!isParaHead)
          this.currentPositionX += this.fontSize;

        w = this.fontSize;
      }
      var rect, glyph;
      if (world) {
        w = this.wordWidth;
        this.changeLineOrPage(width, height, world.length);
        rect = new Rect(this.currentPositionX, this.currentPositionY, w, h);
        glyph = new Glyph(world, rect, this.offset);
        this.currentPage.push(glyph);
        this.currentPositionX += this.wordWidth * world.length;
        world = "";
      }
      w = this.fontSize;
      isParaHead = false;
      this.changeLineOrPage(width, height, "");

      rect = new Rect(this.currentPositionX, this.currentPositionY, w, h);
      glyph = new Glyph(char, rect, this.offset);
      this.currentPage.push(glyph);
    }

  }
  //一段结束，换行
  this.currentPositionY += (this.fontSize + this.lineGap * 2);
};

EPUB.Book.prototype.changeLineOrPage = function (width, height, length) {
  var offset = 0;
  if (length > 1) {
    offset = this.wordWidth * length;
  } else {
    offset = this.fontSize;
  }
  //换行计算
  if (this.currentPositionX + offset > width) {
    this.currentPositionY += (this.fontSize + this.lineGap);
    this.currentPositionX = 0;
  }
  //换页计算
  if (this.currentPositionY + this.fontSize + this.lineGap > height) {
    this.currentPositionY = this.fontSize;
    this.currentPage = new Array();
    this.pages.push(this.currentPage);
  }
};

EPUB.Book.prototype.display = function (index) {
  this.el.innerHTML = "";
  var page = this.pages[index];
  var textHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"" + this.el.style.width + "\" height=\"" + this.el.style.height + "\"  font-family=\"" + this.fontFamily + "\">";
  var preGlyph;
  for (var i = 0; i < page.length; i++) {
    var glyph = page[i];
    preGlyph = glyph;
    textHTML += "<text font-size='" + this.fontSize + "' x='" + preGlyph.rect.px + "' y='" + preGlyph.rect.py + "'>" + glyph.txt + "</text>";
  }
  textHTML += "</svg>";
  this.el.innerHTML = textHTML;
};

EPUB.Book.prototype.nextPage = function () {
  if (this.chapterPros < this.displayedPages - 1) {
    this.chapterPros++;
    this.display(this.chapterPros);
  } else {
    alert("已经是最后一页！");
  }
};

EPUB.Book.prototype.prevPage = function () {
  if (this.chapterPros > 0) {
    this.chapterPros--;
    this.display(this.chapterPros)
  } else {
    alert("已经是第一页！");
  }
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

function Rect(x, y, w, h) {
  this.px = x;
  this.py = y;
  this.w = w;
  this.h = h;
}

function Glyph(txt, rect, offset) {
  this.txt = txt;
  this.rect = rect;
  this.offset = offset;
}