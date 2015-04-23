var request = require('superagent');
var readline = require('readline');
var wget = require('wget');
var path = require('path');
var fs = require('fs');
var ensureDir = require('ensureDir');
//var process = require('process');

var imgMatchRegex = /(!\[.*?\]\()(.+?)(\))/g;
var markdownPath = path.join('.', 'markdown');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function saveFile(url, imgUrl) {
    if (imgUrl == null) return;

    url = url.replace('https', 'http'); // I don't know why
    var src = url + imgUrl;
    var folderPath = path.join('.', imgUrl.replace(path.basename(imgUrl), ''));
    
    request.get(src).end(function(iErr, iRes) {
        if (iErr) {
            console.log("ERROR");
            console.log(iErr);
        } else {
            if (iRes.redirects.length > 0) {
                src = iRes.redirects[0];
                ensureDir(folderPath, 0755, function(err) {
                    if (err) {
                        console.log("ERROR with folder");
                    } else {
                        var download = wget.download(src, path.join('.', imgUrl), {});
                        download.on('error', function(err) {
                            console.log(err);
                        });
                        download.on('end', function(output) {
                            console.log(output);
                        });
                    }
                });

            } else {
                console.log("NOTHING HERE");
            }
        }
    });
}

function askPasswordAndContinue(url, email) {
    rl.question("Password: ", function(password) {
        request.post(url + '/ghost/api/v0.1/authentication/token/')
            .send({ grant_type: 'password', username: email, password: password, client_id: 'ghost-admin' })
            .end(function(err, res) {
                if (err) {
                    console.log("ERROR");
                    console.log(err);
                } else {
                    request.get(url + '/ghost/api/v0.1/posts?limit=all')
                        .set('Authorization', 'bearer ' + res.body.access_token)
                        .end(function(dErr, dRes) {
                            if (dErr) {
                                console.log('ERROR');
                                console.log(dErr);
                            } else {
                                var data = dRes.body.posts;

                                for (var d in data) {
                                    // Save Markdown
                                    fs.writeFile(path.join(markdownPath, data[d].slug + ".md"), data[d].markdown, function(fileErr) {
                                        if (fileErr) console.log(fileErr);
                                    });

                                    // SEO image
                                    var imgUrl = data[d].image;
                                    saveFile(url, imgUrl);

                                    // Discover all images in post, saving only from the same server
                                    var match;
                                    while (match = imgMatchRegex.exec(data[d].markdown)) {
                                        if (match[2][0] == '/') saveFile(url, match[2]);
                                    }
                                }
                            }
                        });
                }
                rl.close();
            });
    });
}

ensureDir(markdownPath, 0755, function(dirErr) {
    if (dirErr) {
        console.log(dirErr);
    } else {
        if (process.argv.length == 4) {
            askPasswordAndContinue(process.argv[2], process.argv[3]);
        } else {
            rl.question("Blog URL: ", function(url) {
                rl.question("Email: ", function(email) {
                    askPasswordAndContinue(url, email);
                });
            });
        }
    }
});