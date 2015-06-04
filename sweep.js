var express = require('express');
var app = express();
var fs = require('fs');
var liner = require('./liner');
var exec = require('child_process').exec;

var source = fs.createReadStream('/Users/laura/bma-proto/proto/messaging.proto');

var messagingPattern = /^    CLIENT_[^_]|^    SERVER_[^_]/;
var codeDir = '/Users/laura/mobileweb/frontend/platform/public/js/ /Users/laura/mobileweb/frontend/core/public/js/ /Users/laura/mobileweb/frontend/badoo/public/js/ /Users/laura/mobileweb/frontend/hotornot/public/js/'
source.pipe(liner);

var deprecatedCommands = [];
var nonDeprecatedCommands = [];

var nonDeprecatedUnused = [];
var nonDeprecatedUsed = [];
var deprecatedUsed = [];
var deprecatedUnused = [];
var count = 0;

liner.on('readable', function () {
    var line;

    while (line = liner.read()) {

        if (messagingPattern.test(line)) {
            var deprecated = line.indexOf('[deprecated=true]') > 0;
            var commandName = line.substring(4, line.indexOf(' ='));

            if (deprecated) {
                deprecatedCommands.push(commandName);
            }
            else {
                nonDeprecatedCommands.push(commandName);
            }
        }
    }

});

liner.on('end', function () {

    console.log('Read the proto.');
    console.log('Finding deprecated commands in mw');

    //console.log('DEPRECATED', deprecatedCommands.length);
    for (var i = 0; i < deprecatedCommands.length; i++) {
        grepWithFork(codeDir, deprecatedCommands[i], onDone, true);
    }

    //console.log('NON DEPRECATED', nonDeprecatedCommands.length);
    // for (var j = 0; j < nonDeprecatedCommands.length; j++) {
    //     grepWithFork(codeDir, nonDeprecatedCommands[j], onDone, false);

    // }

    //console.log('\n\nDEPRECATED', deprecatedCommands);
    //console.log('\n\nNON DEPRECATED', nonDeprecatedCommands);

});

var onDone = function () {
    count++;

    if (count === /*nonDeprecatedCommands.length +*/ deprecatedCommands.length - 1) {
        //console.log('DEPRECATED USED', deprecatedUsed.length, deprecatedUsed);
        // console.log('DEPRECATED UNUSED', deprecatedUnused.length);//, deprecatedUsed);
        // console.log('NON DEPRECATED UNUSED', nonDeprecatedUnused.length, nonDeprecatedUnused);
        // console.log('NON DEPRECATED USED', nonDeprecatedUsed.length);//, nonDeprecatedUsed);

        // var total = nonDeprecatedUsed.length + nonDeprecatedUnused.length;
        // var used = nonDeprecatedUsed.length;

        var totalDep = deprecatedUsed.length + deprecatedUnused.length;
        var usedDep = deprecatedUsed.length;

        console.log('\n\n\nMOBILEWEB STATS:');
        //console.log('\nUsing ' + Math.round(used * 100 / (total + totalDep)) + '% of the proto (' + Math.round(used * 100 / total) + '% of active commands)');
        console.log('Still using ' + usedDep + ' deprecated commands');

        process.exit();
    }
};

var grepWithFork = function (filename, command, callback, deprecated) {
    var cmd = "egrep -R '" + command + "' " + filename;
    exec(cmd, function (err, stdout, stderr) {

        // Valid command we're not using
        if (stdout.length === 0) {
            if (!deprecated) {
                nonDeprecatedUnused.push(command);
            }
            else {
                deprecatedUnused.push(command);
            }
        }
        else {
            if (deprecated) {
                deprecatedUsed.push(command);
            }
            else {
                nonDeprecatedUsed.push(command);
            }
        }
        callback();
    });
};

app.get('/', function (req, res) {
    res.send('Hello World!');
});

var server = app.listen(3002, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});
