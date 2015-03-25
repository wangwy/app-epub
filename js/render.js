/**
 * Created by wangwy on 15-1-13.
 * 段落内容渲染
 */
EPUB.Render = function (book) {
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
      var url = EPUB.Utils.parseUrl(value.src);
      image.onload = function () {
        count--;
        if (!that.imagesAll.hasOwnProperty(url.filename)) {
          that.imagesAll[url.filename] = {
            src: url.origin + that.bookUrl + value.getAttribute("src"),
            height: image.height,
            width: image.width
          };
        }
        if (count == 0) {
          deffer.resolve(documentBody);
        }
      };
      image.src = url.origin + that.bookUrl + value.getAttribute("src");
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
  var url = EPUB.Utils.parseUrl(ele.src);
  var img = this.imagesAll[url.filename];
  var image = new imageNode(img.src, 0, this.currentPositionY, img.height, img.width);
  this.currentLine.push(image);
  this.currentPositionY += img.height
};

/**
 * 将文本拆分并排版
 * @param txt
 */
EPUB.Render.prototype.typeSetting = function (ele) {
  var width = parseInt(this.el.style.width.slice(0, -2));
  var height = parseInt(this.el.style.height.slice(0, -2));
  var txt = ele.textContent, eleStyle = EPUB.ELEMENTS[ele.parentNode.tagName];
  for (var i = 0; i < txt.length; i++) {
    var char = txt.charAt(i);
    var charCode = txt.charCodeAt(i);
    var rect, glyph, xOffset;
    this.changeLineOrPage(width, height, eleStyle, charCode);
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

  var offset = (width - chLength) / enNum;
  var x = 0;
  for (var j = 0, length = this.currentLine.length; j < length; j++) {
    if (j == 0 && this.paragraph.isSpace(this.currentLine[0].txt.charCodeAt(0))) {
      continue;
    } else {
      glyph = this.currentLine[j];
      glyph.rect.px = x;
      if (this.paragraph.isDbcCase(glyph.txt.charCodeAt(0))) {
        glyph.rect.fontSize = (offset / glyph.rect.width) * glyph.rect.fontSize;
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
  var page = this.pages[this.displayedPage - 1];
  var textHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"" + this.el.style.width + "\" height=\"" + this.el.style.height + "\">";
  for (var i = 0; i < page.length; i++) {
    for (var j = 0; j < page[i].length; j++) {
      var glyph = page[i][j];
      if (glyph.type == "text") {
        textHTML += "<text   font-family=\"" + glyph.rect.fontFamily + "\" font-size='" + glyph.rect.fontSize + "' data-width = '" + glyph.rect.width + "' data-height = '" + glyph.rect.height + "' x='" + glyph.rect.px + "' y='" + glyph.rect.py + "'>" + glyph.txt + "</text>";
      } else if (glyph.type == "image") {
        textHTML += "<image xlink:href='" + glyph.src + "' x='" + glyph.x + "' y='" + glyph.y + "'  height='" + glyph.h + "' width='" + glyph.w + "'/>";
      }
    }
  }
  textHTML += "</svg>";
  this.el.innerHTML = textHTML;
  this.selections.initSelection();
};

/**
 * 根据偏移量计算显示页码
 * @param offset
 */
EPUB.Render.prototype.calculateDisplayNum = function (offset) {
  var num = 0;
  for (var i = 0, length = this.pages.length; i < length; i++) {
    num += this.pages[i].length;
    if (num > offset) {
      return i + 1;
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
}