var express = require('express');
var app = express();
var fs = require('fs');
var stream = require('stream');
var liner = new stream.Transform({ objectMode: true });

liner._transform = function (chunk, encoding, done) {
    var data = chunk.toString();
    if (this._lastLineData) {
        data = this._lastLineData + data;
    }

    var lines = data.split('\n');
    this._lastLineData = lines.splice(lines.length - 1 , 1)[0];

    lines.forEach(this.push.bind(this));
    done();
};

liner._flush = function (done) {
    if (this._lastLineData) {
        this.push(this._lastLineData);
    }
    this._lastLineData = null;
    done();
};

app.get('/', function (req, res) {
    res.send('Hello World!');
});

var source = fs.createReadStream('/Users/laura/bma-proto/proto/messaging.proto')

source.pipe(liner);

liner.on('readable', function () {
    var line, deprecated;
    while (line = liner.read()) {
        //console.log(line);
        if (/^    SERVER_|^    CLIENT_/.test(line)) {

            deprecated = line.indexOf('deprecated') > 0;
            console.log(line.substring(4, line.indexOf(' =')), deprecated);
        }
    }
});

var server = app.listen(3002, function () {

    var host = server.address().address;
    var port = server.address().port;

    var contents;

    console.log('Example app listening at http://%s:%s', host, port);

    // fileSystem.readFile('', 'utf8',  function (err, data) {
    //     contents = data;
    // });
});
