var express = require("express");
var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.send("Hello world");
});

io.on("connection", function (socket) {
  socket.on("chat message", function (msg) {
    console.log("message: " + msg);
  });

  socket.on("stop", async function (data) {
    var sampleRateHertz = 44100;
    var result = await exportWAV(data, sampleRateHertz);
    console.log("stop record");
    io.emit("reply", result);
  });
});

http.listen(3000, function () {
  console.log("listening on *:3000");
})

const WavEncoder = require("wav-encoder");
const fs = require("fs");

function objlen(data) {
  return Object.keys(data).length;
}

function exportWAV(data, sampleRate) {

  var mergeBuffers = function (data) {
    var sampleLength = 0;
    for (var i = 0; i < data.length; i++) {
      sampleLength += objlen(data[i]);
    }

    var samples = new Float32Array(sampleLength);
    var sampleIndex = 0;

    for (var i = 0; i < data.length; i++) {
      for (var j = 0; j < objlen(data[i]); j++) {
        samples[sampleIndex] = data[i][j];
        sampleIndex++;
      }
    }
    return samples;
  };

  var audioData = {
    sampleRate: 44100,
    channelData: [mergeBuffers(data)]
  };

  var exec = require("child_process").exec;
  var path = "o/";
  var time = 5;
  var fileName = "demo.wav";

  return WavEncoder.encode(audioData)
    .then((buffer) => {
      return new Promise((resolve) => {
        fs.writeFile(fileName, Buffer.from(buffer), function (e) {
          if (e) {
            console.log(e);
          } else {
            console.log("success");
            resolve();
          }
        });
      })
    })
    .then(() => {
      return new Promise((resolve) => {
        exec("rm -r " + path, function (err, stdout, stderr) {
          resolve();
        });
      });
    })
    .then(() => {
      return new Promise((resolve) => {
        exec("mkdir " + path, function (err, stdout, stderr) {
          resolve();
        });
      })
    })
    .then(() => {
      return new Promise((resolve) => {
        var cmd = `sox -V3 ${fileName} o/o.wav silence -l 1 0.01 1% 1 0.01 1% : newfile : restart`;
        exec(cmd, function (err, stdout, stderr) {
          resolve();
        });
      });
    })
    .then(() => {
      return new Promise((resolve) => {
        var cmd = "ls o/*";
        exec(cmd, function (err, stdout, stderr) {
          var r = ((stdout.split("\n").length) - 2) / time;
          var result = r.toFixed(3);
          console.log(result);
          resolve(result);
        });
      });
    });
}
/*
var exec = require("child_process").exec;
  var path = "o/";
  exec("rm -r " + path, function (err, stdout, stderr) {
    exec("mkdir " + path, function (err, stdout, stderr) {
      var cmd = `sox -V3 ${fileName} o/o.wav silence -l 1 0.01 1% 1 0.01 1% : newfile : restart`;
      exec(cmd, function (err, stdout, stderr) {
        //
        var cmd = "ls o/*";
        exec(cmd, function (err, stdout, stderr) {
          //
          var r = ((stdout.split("\n").length) - 2) / time;
          console.log(r.toFixed(3));
        });
      });
    });
  });
*/