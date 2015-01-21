/**
 * Created by wangwy on 15-1-13.
 */
EPUB.Render = function (elem) {
  this.el = this.getEl(elem);
  this.paragraph = new EPUB.Paragraph();
  this.lineGap = EPUB.LINEGAP;
  this.format = new EPUB.Format();
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
  this.imagesAll = {};
  var that = this;
  var deffer = new RSVP.defer();
  var documentBody = context.body;
  this.displayedPage = 1;
  this.currentPositionY = 12;
  this.currentPositionX = 0;
  this.currentPage = new Array();
  this.pages = new Array();
  this.pages.push(this.currentPage);
  var items = context.querySelectorAll("img");
  if(items.length > 0){
    var images = Array.prototype.slice.call(items);
    var count = images.length;
    images.forEach(function (value) {
      var image = new Image();
      image.src = value.src;
      var url = that.format.formatUrl(value.src);
      image.onload = function () {
        count--;
        if (!that.imagesAll.hasOwnProperty(url.filename)) {
          that.imagesAll[url.filename] = {
            src: url.path,
            height: image.height,
            width: image.width
          };
        }if(count == 0){
          deffer.resolve(documentBody);
        }
      };
    });
  }else{
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
    if (node.nodeName == "p" || node.nodeName == "h1" || node.nodeName == "h2" || node.nodeName == "img") {
      //一段结束，换行
      this.currentPositionY += (EPUB.ELEMENTS[node.nodeName].fontSize + this.lineGap * 2);
      this.currentPositionX = EPUB.ELEMENTS[node.nodeName].fontSize;
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

EPUB.Render.prototype.imageSetting = function (ele) {
  var url = this.format.formatUrl(ele.src);
  var img = this.imagesAll[url.filename];
  var image = new imageNode(img.src, 0, this.currentPositionY, img.height, img.width);
  this.currentPage.push(image);
  this.currentPositionY += img.height
};

/**
 * 将文本拆分并排版
 * @param txt
 */
EPUB.Render.prototype.typeSetting = function (ele) {
  var width = parseInt(this.el.style.width.slice(0, -2));
  var height = parseInt(this.el.style.height.slice(0, -2));
  var txt = ele.textContent, eleStyle = EPUB.ELEMENTS[ele.parentElement.tagName];
  //保证字符串是以空格结束，以便计算单词
  txt = txt.charAt(txt.length - 1) === " " ? txt : txt + " ";
  var world = "";
  for (var i = 0; i < txt.length; i++) {
    var char = txt.charAt(i);
    var charCode = txt.charCodeAt(i);
    if (this.paragraph.isEnglish(charCode)) {
      world += char;
      continue;
    } else {
      if (this.paragraph.isDbcCase(charCode)) {
        this.currentPositionX += eleStyle.fontSize / 2 + 3;
      }
      else {
        this.currentPositionX += eleStyle.fontSize;
      }
      var rect, glyph;
      if (world) {
        this.changeLineOrPage(width, height, eleStyle, world.length);
        rect = new Rect(eleStyle.fontFamily, eleStyle.fontSize, this.currentPositionX, this.currentPositionY);
        glyph = new Glyph(world, rect);
        this.currentPage.push(glyph);
        this.currentPositionX += (eleStyle.fontSize / 2 + 3) * world.length;
        world = "";
      }
      this.changeLineOrPage(width, height, eleStyle, "");

      rect = new Rect(eleStyle.fontFamily, eleStyle.fontSize, this.currentPositionX, this.currentPositionY);
      glyph = new Glyph(char, rect);
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
EPUB.Render.prototype.changeLineOrPage = function (width, height, eleStyle, length) {
  var offset = 0;
  if (length > 1) {
    offset = (eleStyle.fontSize / 2 + 3) * length;
  } else {
    offset = eleStyle.fontSize;
  }
  //换行计算
  if (this.currentPositionX + offset > width) {
    this.currentPositionY += (eleStyle.fontSize + this.lineGap);
    this.currentPositionX = 0;
  }
  //换页计算
  if (this.currentPositionY + eleStyle.fontSize + this.lineGap > height) {
    this.currentPositionY = eleStyle.fontSize;
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
  var textHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"" + this.el.style.width + "\" height=\"" + this.el.style.height + "\">";
  for (var i = 0; i < page.length; i++) {
    var glyph = page[i];
    if (glyph.type == "text") {
      textHTML += "<text   font-family=\"" + glyph.rect.fontFamily + "\" font-size='" + glyph.rect.fontSize + "' x='" + glyph.rect.px + "' y='" + glyph.rect.py + "'>" + glyph.txt + "</text>";
    } else if (glyph.type == "image") {
      textHTML += "<image xlink:href='" + glyph.src + "' x='" + glyph.x + "' y='" + glyph.y + "'  height='" + glyph.h + "' width='" + glyph.w + "'/>";
    }
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

/**
 * 文本节点属性
 * @param fontFamily
 * @param fontSize
 * @param x
 * @param y
 * @constructor
 */
function Rect(fontFamily, fontSize, x, y) {
  this.fontFamily = fontFamily;
  this.fontSize = fontSize;
  this.px = x;
  this.py = y;
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