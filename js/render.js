/**
 * Created by wangwy on 15-1-13.
 */
EPUB.Render = function (elem) {
  this.el = this.getEl(elem);
  this.fontSize = EPUB.FONTSIZE;
  this.fontFamily = EPUB.FONTFAMILY;
  this.wordWidth = EPUB.WORDWIDTH;
  this.paragraph = new EPUB.Paragraph();
  this.lineGap = EPUB.LINEGAP;
  this.currentPositionX = 0;
  this.currentPositionY = EPUB.FONTSIZE;
  this.offset = 0;
};

/**
 * 根据id获得element
 * @param elem
 * @returns {HTMLElement}
 */
EPUB.Render.prototype.getEl = function (elem) {
  return document.getElementById(elem);
};

/**
 * 获取页面中的元素
 * @param context
 */
EPUB.Render.prototype.initialize = function (context) {
  var deferred = new RSVP.defer();
  var documentBody = context.body;
  this.displayedPage = 1;
  this.currentPositionY = this.fontSize;
  this.currentPage = new Array();
  this.pages = new Array();
  this.pages.push(this.currentPage);
  deferred.resolve(documentBody);

  return deferred.promise;
};

/**
 * 获取一个文档中所有文本
 * @param elem
 */
EPUB.Render.prototype.getAllTextNodeContextAndRender = function (elem) {
  var nodes = elem.childNodes;
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i], nodeType = node.nodeType;
    if (node.nodeName == "p" || node.nodeName == "h1") {
      //一段结束，换行
      this.currentPositionY += (this.fontSize + this.lineGap * 2);
      this.currentPositionX = this.fontSize;
    }
    if (nodeType == 3 && !(/^\s+$/.test(node.nodeValue))) {
      this.typeSetting(node.textContent);
    } else if (nodeType == 1 || nodeType == 9 || nodeType == 11) {
      this.getAllTextNodeContextAndRender(node);
    }
  }

  this.displayedPages = this.pages.length;
};

/**
 * 将文本拆分并排版
 * @param txt
 */
EPUB.Render.prototype.typeSetting = function (txt) {
  var width = parseInt(this.el.style.width.slice(0, -2));
  var height = parseInt(this.el.style.height.slice(0, -2));
  //保证字符串是以空格结束，以便计算单词
  txt = txt.charAt(txt.length-1) === " " ? txt : txt + " ";
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
        this.currentPositionX += this.wordWidth;
        w = this.wordWidth;
      }
      else {
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
      this.changeLineOrPage(width, height, "");

      rect = new Rect(this.currentPositionX, this.currentPositionY, w, h);
      glyph = new Glyph(char, rect, this.offset);
      this.currentPage.push(glyph);
    }

  }
};

/**
 * 换行，换页计算
 * @param width
 * @param height
 * @param length
 */
EPUB.Render.prototype.changeLineOrPage = function (width, height, length) {
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

/**
 * 页面展示
 * @param index
 */
EPUB.Render.prototype.display = function (index) {
  this.el.innerHTML = "";
  this.displayedPage = index;
  var page = this.pages[this.displayedPage - 1];
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