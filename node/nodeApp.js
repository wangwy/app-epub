/**
 * Created by wangwy on 15-6-8.
 */
var http = require('http');
var cp = require('child_process');
var jsdom = require('jsdom');
var fs = require('fs');
var Render = require('./render.js');
var bookData;
var worker;
var render;
/**
 * 守护进程，当此程序异常退出时重启子进程
 * @param server
 */
function spawn(server) {
  worker = cp.spawn('node', [server]);
  worker.on('exit', function (code) {
    if (code !== 0) {
      spawn(server);
    }
  });
}

/**
 * 创建服务用于接收电子书传送过来的电子书详细信息bookData，返回章节页码
 * @type {Server}
 */
var server = http.createServer(function (request, response) {
  spawn('bookNode.js');
  process.on('SIGTERM', function () {
    worker.kill();
    process.exit(0);
  });
  var body = '';
  request.setEncoding('utf8');
  request.on('data', function (chunk) {
    body += chunk;
  });
  request.on('end', function () {
    try {
      bookData = JSON.parse(body);
      render = new Render();
      var spine = bookData.spine;
      var manifest = bookData.manifest;
      readFiles(manifest, spine, function (data) {
        response.write(JSON.stringify(data));
        response.end();
      })
    } catch (er) {
      response.statusCode = 400;
      return response.end('error: ' + er.message);
    }
  })
});

/**
 * 解析电子书详细信息，根据获取html
 * @param manifest
 * @param spine
 */
function readFiles(manifest, spine, callback) {
  var output = {};
  (function next(i, len) {
    if (i < len) {
      fs.readFile(".." + manifest[spine[i].id].url, 'utf-8', function (err, data) {
        if (err) {
          callback(err);
        } else {
          parseHtml(data, ".." + manifest[spine[i].id].url, function (pageNum) {
            if (i == 0) {
              output[i] = {"id": spine[i].id, "startNum": pageNum, "endNum": pageNum, "pageNum": pageNum};
            } else {
              output[i] = {"id": spine[i].id, "startNum": output[i - 1]["endNum"] + 1, "endNum": pageNum + output[i - 1]["endNum"], "pageNum": pageNum};
            }
            next(i + 1, len);
          });
        }
      });
    } else {
      output["allNum"] = output[i - 1]["endNum"];
      for (var j = 0; j < i; j++) {
        if (j == 0) {
          output[j]["percentage"] = output[j]["pageNum"] / output["allNum"];
        } else {
          output[j]["percentage"] = output[j]["pageNum"] / output["allNum"] + output[j - 1]["percentage"];
        }
      }
      callback(output);
    }
  }(0, spine.length))
}

/**
 *解析html计算章节页码
 * @param html
 * @param callback
 */
function parseHtml(html, url, callback) {
  jsdom.env(html,
      function (errors, window) {
        var docBody = render.initialize(window.document, bookData.elem, url);
          render.getPagesNum(docBody);
          callback(render.pages.length);
      }
  )
}
if (!module.parent) {
  server.listen("8088");
  console.log("Server running at http://localhost:8088");
}

module.exports = server;