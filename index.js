var request = require('superagent');
var readline = require('readline');
var wget = require('wget');
var path = require('path');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function binaryParser(res, callback) {
    res.setEncoding('binary');
    res.data = '';
    res.on('data', function (chunk) {
        res.data += chunk;
    });
    res.on('end', callback);
}

function saveFile(url, imgUrl) {
    // TODO: Check it is internal img
    url = url.replace('https', 'http'); // I don't know why
    var imgPath = path.basename(imgUrl);
    var src = url + imgUrl;

    request.get(src).end(function (iErr, iRes) {
        if (iErr) {
            console.log("ERROR");
            console.log(iErr);
        } else {
            if (iRes.redirects.length > 0) {
                src = iRes.redirects[0];
                var download = wget.download(src, imgPath, {});
                download.on('error', function (err) {
                    console.log(err);
                });
                download.on('end', function (output) {
                    console.log(output);
                });
            } else {
                console.log("NOTHING HERE");
            }
        }
    });
}

rl.question("Blog URL: ", function(url) {
    rl.question("Email: ", function(email) {
        rl.question("Password: ", function(password) {
            // todo: change to all posts
            request.post(url + '/ghost/api/v0.1/authentication/token/')
                    .send({grant_type: 'password', username: email, password: password, client_id: 'ghost-admin'})
                    .end(function (err, res) {
                        if (err) {
                            console.log("ERROR");
                            console.log(err);
                        }
                        else {
                            var token = res.body.access_token;
                            request.get(url + '/ghost/api/v0.1/posts')
                                .set('Authorization', 'bearer ' + token)
                                .end(function (dErr, dRes) {
                                    if (dErr) {
                                        console.log('ERROR');
                                        console.log(dErr);
                                    } else {
                                        var data = dRes.body.posts;

                                        for (var d in data) {
                                            console.log(data[d].title);

                                            var imgUrl = data[d].image;
                                            saveFile(url, imgUrl);
                                        }
                                    }
                                });
                        }

                        rl.close();
                    });
        });
    });
});
