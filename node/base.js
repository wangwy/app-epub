/**
 * Created by wangwy on 15-1-8.
 */
var EPUB = {};
EPUB.VERSION = "1.0.0";
EPUB.LINEGAP = 15;

EPUB.ELEMENTS = {
  "P": {
    fontSize: 18,
    fontFamily: "Monaco,Kai,Terminal,新宋体,Monospace,文泉驿等宽正黑"
  },
  "A": {
    fontSize: 18,
    fontFamily: "Monaco,Kai,Terminal,新宋体,Monospace,文泉驿等宽正黑"
  },
  "SPAN": {
    fontSize: 18,
    fontFamily: "Monaco,Kai,Terminal,新宋体,Monospace,文泉驿等宽正黑"
  },
  "H1": {
    fontSize: 22,
    fontFamily: "Monaco,Kai,Terminal,新宋体,Monospace,文泉驿等宽正黑"
  },
  "H2": {
    fontSize: 20,
    fontFamily: "Monaco,Kai,Terminal,新宋体,Monospace,文泉驿等宽正黑"
  },
  "H3": {
    fontSize: 18,
    fontFamily: "Monaco,Kai,Terminal,新宋体,Monospace,文泉驿等宽正黑"
  },
  "IMG": {
    fontSize: 0,
    fontFamily: "Monaco,Kai,Terminal,新宋体,Monospace,文泉驿等宽正黑"
  },
  "svg": {
    fontSize: 0,
    fontFamily: "Monaco,Kai,Terminal,新宋体,Monospace,文泉驿等宽正黑"
  },
  "TEXT": {
    fontSize: 18,
    fontFamily: "Monaco,Kai,Terminal,新宋体,Monospace,文泉驿等宽正黑"
  },
  "IMAGE": {
    fontSize: 0,
    fontFamily: "Monaco,Kai,Terminal,新宋体,Monospace,文泉驿等宽正黑"
  }
};

EPUB.USERID = "";//用户id
EPUB.BOOKID = "";//书籍id
EPUB.AUTHTOKEN = "";//认证

EPUB.BASEPATH = "";

module.exports = EPUB;