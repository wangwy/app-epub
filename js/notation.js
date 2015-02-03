/**
 * Created by wangwy on 15-1-22.
 * 鼠标选择后弹出复制、标记等功能菜单
 */
EPUB.Notation = function () {
  this.svgSelected = [];
  this.showPostion = {};
  this.string = "";
  this.create();
  this.createDialog();
};

/**
 * 功能菜单显示
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
 * 功能菜单隐藏
 */
EPUB.Notation.prototype.hide = function () {
  this.node.style.left = "0px";
  this.node.style.top = "0px";
  this.node.style.display = "none";
};

/**
 * 功能菜单创建
 */
EPUB.Notation.prototype.create = function () {
  var that = this;
  this.node = document.createElement("search");
  this.node.style.position = "absolute";
  this.node.style.border = "none";
  this.node.style.zIndex = "1000000";
  this.node.style.left = "0px";
  this.node.style.top = "0px";
  this.node.style.display = "none";
  this.node.style.background = "#333";
  this.node.style.cursor = "pointer";
  this.node.style.color = "#fff";
  this.node.addEventListener("click", function (e) {
    e.stopPropagation();
    that.hide();
  }, false);
  this.node.innerHTML += "<a id='copy-button'> 复制 </a>";
  this.node.innerHTML += "<a> 分享 </a>";
  this.node.innerHTML += "<a id='show-dialog'> 笔记 </a>";
  this.node.innerHTML += "<a> 删除 </a>";
  document.documentElement.appendChild(this.node);
};

/**
 * 初始化功能菜单
 */
EPUB.Notation.prototype.initNotation = function () {
  var that = this;
  if (this.svgSelected.length > 0) {
    this.show(this.showPostion.x, this.showPostion.y);
    var copyText = this.getString();
    var copyButton = document.getElementById("copy-button");
    copyButton.setAttribute("data-clipboard-text", copyText);
    var client = new ZeroClipboard(copyButton);
    var showDialog = document.getElementById("show-dialog");
    showDialog.addEventListener('click', function () {
      that.showDialog(that.showPostion.x, that.showPostion.y);
    });
  } else {
    this.hide();
  }
};

/**
 * 获取选中文本
 * @returns {string}
 */
EPUB.Notation.prototype.getString = function () {
  var s = "";
  if (this.svgSelected.length > 0) {
    var item = Array.prototype.slice.call(this.svgSelected);
    item.forEach(function (value) {
      s += value.textContent;
    });
  }
  return s;
};

/**
 * 创建笔记窗口
 */
EPUB.Notation.prototype.createDialog = function () {
  var that = this;
  this.dialogNode = document.createElement('div');
  this.dialogNode.style.position = "absolute";
  this.dialogNode.style.left = "0px";
  this.dialogNode.style.top = "0px";
  this.dialogNode.style.display = "none";
  this.dialogNode.setAttribute("class", "u-inputpanel");
  this.dialogNode.setAttribute("id", "popup-comment");
  var h2 = document.createElement("h2");
  h2.textContent = "批注";
  this.dialogNode.appendChild(h2);

  var p = document.createElement("p");
  p.setAttribute("class", "txt");
  this.dialogNode.appendChild(p);

  var form = document.createElement("form");

  var textArea = document.createElement("textarea");
  textArea.setAttribute("id", "comment-content");
  form.appendChild(textArea);

  var div = document.createElement("div");
  div.setAttribute("class", "btn");

  var input = document.createElement("input");
  input.setAttribute("id", "button-finish-comment");
  input.setAttribute("type", "button");
  input.setAttribute("class", "u-btn3");
  input.setAttribute("value", "完成");
  input.addEventListener("click",function(e){
    that.hideDialog();
  });
  div.appendChild(input);
  form.appendChild(div);
  this.dialogNode.appendChild(form);

  var a = document.createElement("a");
  a.setAttribute("id", "button-close-comment");
  a.setAttribute("class", "icn-close2");
  a.textContent = "×";
  a.addEventListener("click",function(e){
    that.hideDialog();
  });
  this.dialogNode.appendChild(a);
  document.documentElement.appendChild(this.dialogNode);
};

/**
 * 显示笔记窗口
 * @param x
 * @param y
 */
EPUB.Notation.prototype.showDialog = function(x,y){
  this.dialogNode.getElementsByClassName("txt")[0].textContent = this.getString();
  this.dialogNode.style.left = x + "px";
  this.dialogNode.style.top = y + "px";
  this.dialogNode.style.display = "block";
};

/**
 * 隐藏笔记窗口
 */
EPUB.Notation.prototype.hideDialog = function(){
  this.dialogNode.style.left = "0px";
  this.dialogNode.style.top = "0px";
  this.dialogNode.style.display = "none";
};