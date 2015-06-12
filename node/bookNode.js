/**
 * Created by wangwy on 15-6-8.
 */
var http = require('http');
var cp = require('child_process');
var jsdom = require('jsdom');
var Render = require('./render.js');
var worker;
var data;
var render;
/**
 * 守护进程，当此程序异常退出时重启子进程
 * @param server
 */
function spawn(server){
  worker = cp.spawn('node',[server]);
  worker.on('exit',function(code){
    if(code !== 0){
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
  process.on('SIGTERM',function(){
    worker.kill();
    process.exit(0);
  });
  var body = '';
  request.setEncoding('utf8');
  request.on('data', function (chunk) {
    body += chunk;
  });
  request.on('end',function(){
    try{
      data = JSON.parse(body);
      render = new Render();
      var spine = data.spine;
      var manifest = data.manifest;
      getHtml(manifest,spine,0,{},function(data){
        response.write(JSON.stringify(data));
        response.end();
      });
    }catch(er){
      response.statusCode = 400;
      return response.end('error: ' + er.message);
    }
  })
});

/**
 * 解析电子书详细信息，根据获取html
 * @param manifest
 * @param spine
 * @param num
 */
function getHtml(manifest,spine,num,data,callback){
  if(num < spine.length){
    http.get("http://www.timebooks.com.cn" + manifest[spine[num].id].url,function(res){
      res.setEncoding("utf8");
      var html='';
      res.on('data',function(chunk){
        html += chunk;
      });
      res.on('end',function(){
        data[spine[num].id] = html;
        parseHtml(html);
        ++num;
        getHtml(manifest,spine,num,data,callback);
      })
    }).on('error',function(e){
      console.log("Got error: " + e.message);
    });
  }else{
    callback(data);
  }
}

function parseHtml(html){
  jsdom.env(html,
      function(errors,window){
        var chapterElem = window.document.querySelectorAll("h1,h2,h3");
        if (chapterElem.length > 0) {
          console.log(chapterElem[0].textContent);
        }else{
          console.log("title");
        }
        render.initialize(window.document).then(function(docBody){
          render.getPagesNum(docBody);
          console.log(render.pages.length);
        });
      }
  )
}
server.listen("8088");
console.log("Server running at http://localhost:8088");

