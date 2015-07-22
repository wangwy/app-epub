/**
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
  this.height = this.el.clientHeight - 80;
  this.imagesAll = {};
  var that = this;
  var deffer = new RSVP.defer();
  var documentBody = context.getElementsByTagName("body")[0];
  this.displayedPage = 1;
  this.currentPositionY = 18;
  this.currentPositionX = 0;
  this.currentLine = new Array();
  this.currentPage = new Array();
  this.pages = new Array();
  this.currentPage.push(this.currentLine);
  this.pages.push(this.currentPage);
  //现将页面里的图片下载下来然后再解析内容。
  var items = context.querySelectorAll("img,image");
  if (items.length > 0) {
    var images = Array.prototype.slice.call(items);
    var count = images.length;
    images.forEach(function (value) {
      var image = new Image();
      var htmlUrl = EPUB.Utils.parseUrl(that.chapterUrl);
      var url;
      if(value.tagName == "img"){
        url = EPUB.Utils.parseUrl(value.getAttribute("src"));
      }else{
        url = EPUB.Utils.parseUrl(value.getAttribute("xlink:href"));
      }
      image.onload = function () {
        count--;
        if (!that.imagesAll.hasOwnProperty(url.filename)) {
          that.imagesAll[url.filename] = {
            src: htmlUrl.directory + url.path,
            height: image.height,
            width: image.width
          };
        }
        if (count == 0) {
          deffer.resolve(documentBody);
        }
      };
      image.src = htmlUrl.directory + url.path;
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
      if (node.nodeName == "img" || node.nodeName == "image") {
        this.currentPositionY -= this.lineGap / 2;
        this.imageSetting(node);
      }
    }
    if (nodeType == 3 && !(/^\s+$/.test(node.nodeValue))) {
      this.textSetting(node);
      this.reSettingLine(this.width);//每个段落结束判断一行是否重新需要排列
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
  var url;
  if(ele.tagName == "img"){
    url = EPUB.Utils.parseUrl(ele.getAttribute("src"));
  }else{
    url = EPUB.Utils.parseUrl(ele.getAttribute("xlink:href"));
  }
  var img = this.imagesAll[url.filename];
  var hScale = img.height / (this.height - this.currentPositionY - this.lineGap * 2);
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
    this.currentPositionY += (height + this.lineGap * 1.5)
  } else if (hScale > 5) {
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
    this.currentPositionY += (height + this.lineGap * 1.5);
  }
};

/**
 * 将文本拆分并排版
 * @param txt
 */
EPUB.Render.prototype.textSetting = function (ele) {
  var txt = ele.textContent, eleStyle = EPUB.ELEMENTS[ele.parentNode.tagName] || EPUB.ELEMENTS["p"];
  txt = txt.trim();
  for (var i = 0; i < txt.length; i++) {
    var char = txt.charAt(i);
    var charCode = txt.charCodeAt(i);
    var rect, glyph, xOffset;
    this.changeLine(this.width, this.height, eleStyle, charCode);
    if (this.paragraph.isSpace(charCode) && this.currentPositionX == 0) {//去掉每行最开始时空格
      rect = new Rect(eleStyle.fontFamily, eleStyle.fontSize, this.currentPositionX, this.currentPositionY, 0, eleStyle.fontSize);
    } else {
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
 * @param eleStyle
 * @param charCode
 */
EPUB.Render.prototype.changeLine = function (width, height, eleStyle, charCode) {
  var offset = eleStyle.fontSize;
  this.changeLineArr = [];//用于存储当缩小比例小于0.8时要截取每行最后的英文字符换
  //换行计算
  if ((this.currentPositionX + offset > width) && (this.paragraph.isEnglish(charCode) || this.paragraph.isNotChPu(charCode))) {
    //当行尾为标点符号或者是英文时不换行
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
  this.changePage(eleStyle,height);
  if (this.changeLineArr.length > 0) {//将里面存的值重新计算x,y坐标并将其存到另一行中
    var glyph;
    for (var i = 0; i < this.changeLineArr.length; i++) {
      glyph = this.changeLineArr[i];
      glyph.rect.px = this.currentPositionX;
      this.currentPositionX += glyph.rect.width;
      glyph.rect.py = this.currentPositionY;
      this.currentLine.push(glyph);
    }
    this.changeLineArr = [];
  }
};

/**
 * 换页计算
 * @param eleStyle
 * @param height
 */
EPUB.Render.prototype.changePage = function (eleStyle, height) {
  if (this.currentPositionY + eleStyle.fontSize + this.lineGap > height) {
    this.currentPositionY = eleStyle.fontSize;
    this.currentLine = new Array();
    this.currentPage = new Array();
    this.currentPage.push(this.currentLine);
    this.pages.push(this.currentPage);
    return true;
  }
  return false;
};

/**
 * 每一行重新排版
 * @param width
 */
EPUB.Render.prototype.reSettingLine = function (width) {
  if(this.currentPositionX > width){
    var x = this.currentLine[0].rect.px, glyph;
    var offsetScale = this.getTextOffsetScale(width);
    if (offsetScale >= 0.8) {
      for (var j = 0, length = this.currentLine.length; j < length; j++) {
        if (j == 0 && this.paragraph.isSpace(this.currentLine[0].txt.charCodeAt(0))) {
          continue;
        } else {
          glyph = this.currentLine[j];
          glyph.rect.px = x;
          if (this.paragraph.isDbcCase(glyph.txt.charCodeAt(0))) {
            glyph.rect.width = offsetScale * glyph.rect.width;
            x += glyph.rect.width;
          } else {
            x += glyph.rect.width;
          }
        }
      }
    } else {//当缩小比例小于0.8时要截取每行最后的英文字符换到另一行
      var oldLen = this.currentLine.length;
      for (var len = oldLen - 1; len > 0; len--) {
        if (this.paragraph.isEnglish(this.currentLine[len].txt.charCodeAt(0)) || this.paragraph.isNotChPu(this.currentLine[len].txt.charCodeAt(0))) {
          this.changeLineArr.unshift(this.currentLine.pop());
        } else {
          this.changeLineArr.unshift(this.currentLine.pop());
          break;
        }
      }
      this.reSettingLine(width);
    }
  }
};

/**
 * 获得每个text元素宽度改变比例（中文字符不变）
 * @param width
 * @returns {number}
 */
EPUB.Render.prototype.getTextOffsetScale = function (width) {
  var length = this.currentLine.length;
  var unChLen = 0, chLen = 0, glyph;
  for (var i = 0; i < length; i++) {
    glyph = this.currentLine[i];
    if (this.paragraph.isDbcCase(glyph.txt.charCodeAt(0))) {
      chLen += glyph.rect.width;
    } else {
      unChLen += glyph.rect.width;
    }
  }
  var x = this.currentLine[0].rect.px;
  var offsetScale = (width - unChLen - x) / chLen;
  return offsetScale;
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
        textHTML += "<image class=\"context\" xlink:href='" + glyph.src + "' x='" + glyph.x + "' y='" + glyph.y + "'  height='" + glyph.h + "' width='" + glyph.w + "' data-height = '" + glyph.h + "'/>";
      }
    }
  }
  textHTML += "</svg>";
  this.el.innerHTML = textHTML;
  this.book.createBookPosition();
  this.selections.initSelection();
};

/**
 * 获取本页起点偏移量
 * @param index
 * @returns {number}
 */
EPUB.Render.prototype.getPosition = function (index) {
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