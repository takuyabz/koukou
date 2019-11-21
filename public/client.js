const socket = io();//.connect("http://localhost:3086");


let buffer = 2048;
let context;
let processor;
let input;
let globalStream;
var audioData = [];
const property = {
  audio: true,
  video: false
};

function record() {
  context = new AudioContext();
  processor = context.createScriptProcessor(buffer, 1, 1);
  processor.connect(context.destination);
  context.resume();

  var recording = function (stream) {
    globalStream = stream;
    input = context.createMediaStreamSource(stream);
    input.connect(processor);
    processor.onaudioprocess = function (audio) {
      audioStream(audio);
    };
  };
  navigator.mediaDevices.getUserMedia(property).then(recording);
}

function audioStream(audio) {
  var input = audio.inputBuffer.getChannelData(0);
  var bufferData = new Float32Array(buffer);

  for (var i = 0; i < buffer; i++) {
    bufferData[i] = input[i];
  }

  audioData.push(bufferData);
}

function stop() {
  return new Promise((resolve) => {

    socket.on("reply", (data) => {
      console.log(data);
      // TODO 結果を返す
      resolve(data);
    });
    socket.emit("stop", audioData);

    let trac = globalStream.getTracks()[0];
    trac.stop();
    audioData = [];
    input.disconnect(processor);
    processor.disconnect(context.desetination);
    context.close().then(function () {
      input = null;
      processor = null;
      context = null;
      // startButton.disabled = false;
    });
  });
}

// record();

// setTimeout(() => {
//   stop();
// }, 3000);