var request = require('superagent');
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function binaryParser(res, callback) { // todo: complete 
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
							request.get(url + imgUrl).parse(binaryParser).end(functio(iErr, iRes) {
								// TODO: Save buffer
							});
						}
					}
				});
		}
		rl.close();
            });
		});
	});
});
