var request = require('superagent');
var wget = require('wget');
var path = require('path');
var fs = require('fs');
var ensureDir = require('ensureDir');
var inquirer = require('inquirer');

var imgMatchRegex = /(!\[.*?\]\()(.+?)(\))/g;

var saveFile = function(url, imgUrl) {
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
                        //download.on('error', function(err) {
                        //    console.log(err);
                        //});
                        //download.on('end', function(output) {
                        //    console.log(output);
                        //});
                    }
                });

            } else {
                console.log("NOTHING HERE");
            }
        }
    });
};

var processor = {
    Post: function (url, token, mainPath) {
        request.get(url + '/ghost/api/v0.1/posts?limit=all')
            .set('Authorization', 'bearer ' + token)
            .end(function(dErr, dRes) {
                if (dErr) {
                    console.log('ERROR');
                    console.log(dErr);
                } else {
                    var data = dRes.body.posts;
                    var authors = { "1": "geo", "2": "rox" };

                    for (var d in data) {
                        var date = data[d].published_at;

                        if (date == null || date.length == 0) continue;

                        var title = date.substring(0, 10) + '-' + data[d].slug + '.md';
                        var content = '---\r\nlayout: post\r\ntitle: "' + data[d].title + '"\r\ntags: ' +
                            (data[d].tags ? data[d].tags.map(function(el) {
                                return '- ' + el;
                            }).join("\r\n") : '') + '\r\nauthor: ' + authors[data[d].created_by] +
                            '\r\nimage: ' + data[d].image + '\r\n---\r\n' +
                            data[d].markdown.replace(/\r?\n/g, "\r\n");

                        // Save Markdown
                        fs.writeFile(path.join(mainPath, title), content, { encoding: 'utf8' }, function (fileErr) {
                            if (fileErr) console.log(fileErr);
                        });
                    }
                }
            });
    },
    Images: function (url, token, mainPath) {
        request.get(url + '/ghost/api/v0.1/posts?limit=all')
            .set('Authorization', 'bearer ' + token)
            .end(function (dErr, dRes) {
                if (dErr) {
                    console.log('ERROR');
                    console.log(dErr);
                } else {
                    var data = dRes.body.posts;

                    for (var d in data) {
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
    },
    Tags: function (url, token, mainPath) {
        request.get(url + '/ghost/api/v0.1/tags?limit=all')
            .set('Authorization', 'bearer ' + token)
            .end(function (dErr, dRes) {
                if (dErr) {
                    console.log('ERROR');
                    console.log(dErr);
                } else {
                    var data = dRes.body.tags;
                    for (var d in data) {
                        fs.mkdirSync(path.join(mainPath, data[d].slug));
                        var content = '---\r\nlayout: tagpage\r\ntag: ' + data[d].slug +
                            '\r\ntitle: ' + data[d].name +
                            '\r\image: ' + data[d].image +
                            '\r\description: ' + data[d].description + '\r\n' +
                            '---';

                        fs.writeFile(path.join(mainPath, data[d].slug, "index.html"), content, { encoding: 'utf8' }, function (fileErr) {
                            if (fileErr) console.log(fileErr);
                        });
                    }
                }
            });
    }
};

inquirer.prompt({
    type: 'checkbox',
    name: 'options',
    choices: ['Post', 'Images', 'Tags'],
    message: 'What do you want to backup?'
}, function (data) {
    if (data.options.length == 0) return;
    var questions = [{
        type: 'input',
        name: 'url',
        message: 'Blog URL'
    },{
        type: 'input',
        name: 'email',
        message: 'Email'
    },{
        type: 'password',
        name: 'password',
        message: 'Password'
    }];
    if (process.argv.length >= 2) questions[0].default = process.argv[2];
    if (process.argv.length >= 3)  questions[1].default = process.argv[3];
    
    inquirer.prompt(questions, function(answers) {
        request.post(answers.url + '/ghost/api/v0.1/authentication/token/')
            .send({ grant_type: 'password', username: answers.email, password: answers.password, client_id: 'ghost-admin' })
            .end(function(err, res) {
                if (err) {
                    console.log("ERROR");
                    console.log(err);
                } else {
                    for (var d in data.options) {
                        var key = data.options[d];
                        fs.mkdirSync(path.join('.', key));
                        processor[key](answers.url, res.body.access_token, path.join('.', key));
                    }
                }
            });
    });
});