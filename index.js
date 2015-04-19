var request = require('superagent');
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Blog URL: ", function(url) {
	rl.question("Email: ", function(email) {
		rl.question("Password: ", function(password) {
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
						console.log(dRes.body);
					}
				});
		}
		rl.close();
            });
		});
	});
});
