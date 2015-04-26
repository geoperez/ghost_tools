var readline = require('readline');
var ensureDir = require('ensureDir');
var request = require('superagent');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askPasswordAndContinue(url, email, callback) {
    rl.question("Password: ", function (password) {
        request.post(url + '/ghost/api/v0.1/authentication/token/')
            .send({ grant_type: 'password', username: email, password: password, client_id: 'ghost-admin' })
            .end(function (err, res) {
                if (err) {
                    console.log("ERROR");
                    console.log(err);
                } else {
                    callback(url, res.body.access_token);
                }

                rl.close();
            });
    });
}

exports.process = function(basePath, callback) {
    ensureDir(basePath, 0755, function (dirErr) {
        if (dirErr) {
            console.log(dirErr);
        } else {
            if (process.argv.length == 4) {
                askPasswordAndContinue(process.argv[2], process.argv[3], callback);
            } else {
                rl.question("Blog URL: ", function (url) {
                    rl.question("Email: ", function (email) {
                        askPasswordAndContinue(url, email, callback);
                    });
                });
            }
        }
    });
};