/**
 * Created by wangwy on 15-6-17.
 */
var cluster = require('cluster');
var os = require('os');

//获取CPU数量
var numCPUs = os.cpus().length;

var workers = {};
if (cluster.isMaster) {
  //主进程分支
  cluster.on('death', function (worker) {
    //当一个工作进程结束时，重启工作进程
    delete workers[worker.pid];
    worker = cluster.fork();
    workers[worker.pid] = worker;
  });
  for (var i = 0; i < numCPUs; i++) {
    var worker = cluster.fork();
    workers[worker.pid] = worker;
  }
} else {
  var nodeApp = require('./nodeApp.js');
  nodeApp.listen("8088");
  console.log("Server running at http://localhost:8088");
}

process.on('SIGTERM',function(){
  for(var pid in workers){
    process.kill(pid);
  }
  process.exit(0);
});
