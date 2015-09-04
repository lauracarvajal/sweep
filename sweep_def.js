var express = require('express');
var app = express();
var fs = require('fs');
var liner = require('./liner');
var exec = require('child_process').exec;

var source = fs.createReadStream('/Users/laura/bma-proto/proto/definitions.proto');
//var source = fs.createReadStream('/Users/laura/bma-proto/proto/features/awards.proto');
//var source = fs.createReadStream('/Users/laura/bma-proto/proto/features/external_provider.proto');
//var source = fs.createReadStream('/Users/laura/bma-proto/proto/features/multimedia.proto');
//var source = fs.createReadStream('/Users/laura/bma-proto/proto/features/payments.proto');
//var source = fs.createReadStream('/Users/laura/bma-proto/proto/features/profile_score.proto');
//var source = fs.createReadStream('/Users/laura/bma-proto/proto/features/promo_banners.proto');
//var source = fs.createReadStream('/Users/laura/bma-proto/proto/features/push.proto');
//var source = fs.createReadStream('/Users/laura/bma-proto/proto/features/social.proto');
//var source = fs.createReadStream('/Users/laura/bma-proto/proto/features/stats.proto');

var pattern = /^    required|    optional|    repeated/;
var codeDir = '/Users/laura/mobileweb/frontend/platform/public/js /Users/laura/mobileweb/frontend/core/public/js /Users/laura/mobileweb/frontend/badoo/public/js /Users/laura/mobileweb/frontend/hotornot/public/js';
source.pipe(liner);

var deprecatedFields = [];
var deprecatedUsed = [];

var count = 0;
var lineNumber = 0;

function camelCase(input) {

    var result = input.toLowerCase().replace(/_(.)/g, function(match, group1) {
        return group1.toUpperCase();
    });

    result = result.charAt(0).toUpperCase() + result.slice(1);

    return result;
}

liner.on('readable', function () {
    var line;
    lineNumber++;

    while (line = liner.read()) {

        var deprecated = line.indexOf('[deprecated=true]') > 0;
        var commandName;
        var getter;
        var setter;

        // message object, enum object or field
        if (pattern.test(line)) {

            // message field
            //if (line.indexOf('    ')) {
            commandName = line.substring(4 + 8 + 1, line.indexOf(' ='));
            commandName = commandName.substring(commandName.indexOf(' ') + 1, commandName.length);
            getter = 'get' + camelCase(commandName) + '(';
            setter = 'set' + camelCase(commandName) + '(';

                //console.log('getter', getter)
                //console.log('setter', setter)
            //}

            // message object or enum object
            // else {
            //     console.log('message or enum', line)
            // }
        }
        // enum item
        else if (line.indexOf('    ')) {
            commandName = line.substring(4, line.indexOf(' ='));
        }

        if (deprecated && setter) {
            if (deprecatedFields.indexOf(setter) === -1) {
                deprecatedFields.push(setter);
            }
        }
        if (deprecated && getter) {
            if (deprecatedFields.indexOf(getter) === -1) {
                deprecatedFields.push(getter);
            }
        }
    }

});

liner.on('end', function () {

    console.log('Read the proto definitions.');
    console.log('Finding deprecated definitions in mw');

    console.log('DEPRECATED', deprecatedFields.length);
    for (var i = 0; i < deprecatedFields.length; i++) {
        grepWithFork(codeDir, deprecatedFields[i], onDone, true);
    }

});

var onDone = function () {
    count++;

    if (count ===  deprecatedFields.length - 1) {
        console.log('DEPRECATED USED:', deprecatedUsed.length, '\n', deprecatedUsed);

        var usedDep = deprecatedUsed.length;

        console.log('\n\n\nMOBILEWEB STATS:');
        //console.log('\nUsing ' + Math.round(used * 100 / (total + totalDep)) + '% of the proto (' + Math.round(used * 100 / total) + '% of active commands)');
        console.log('Still using ' + usedDep + ' deprecated commands');

        process.exit();
    }
};

var grepWithFork = function (filename, command, callback, deprecated) {

    var cmd = "fgrep -R '" + command + "' " + filename;

    var cmdAlt;

    if (command.indexOf('ALLOW_') !== -1) {
        console.log('alt', command.substring(6, command.length));
        cmdAlt = "fgrep -R '" + command.substring(6, command.length) + "' " + filename;
    }
    else {
        cmdAlt = null;
    }

    exec(cmd, function (err, stdout, stderr) {

        // Valid command we're not using
        if (stdout.length === 0) {

        }
        else {
            if (deprecated) {
                //console.log('found somewhere: ', command)
                deprecatedUsed.push(command);
            }
        }
        callback();
    });

    if (cmdAlt) {
        exec(cmdAlt, function (err, stdout, stderr) {
            console.log('exec alt')
            // Valid command we're not using
            if (stdout.length === 0) {

            }
            else {
                if (deprecated) {
                    deprecatedUsed.push(command);
                }
            }
            callback();
        });
    }
};

app.get('/', function (req, res) {
    res.send('Hello World!');
});

var server = app.listen(3002, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});
