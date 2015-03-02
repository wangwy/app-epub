/**
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
