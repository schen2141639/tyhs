const HTTP_PORT = process.env.PORT || 3000;
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const randomString = require('randomstring');
const session = require('client-sessions');
const Photo = require('./models/gallery');
let strRandom = randomString.generate();
const app = express();

	.connect(dbConnect, { useNewUrlParser: true, useUnifiedTopology: true }) // 
	.then((result) => server)	.catch((err) => console.log(err));

app.engine(
	'hbs',
	exphbs({
		extname: '.hbs',
		runtimeOptions: {
			allowProtoPropertiesByDefault: true,
			allowProtoMethodsByDefault: true
		},
		defaultLayout: false,
		layoutsDir: path.join(__dirname, '/views')
	})
);

app.set('view engine', '.hbs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	session({
		cookieName: 'mySession',
		secret: strRandom,
		duration: 10 * 60 * 1000,
		activeDuration: 5 * 60 * 1000,
		httpOnly: true,
		secure: true,
		ephemeral: true
	})
);

app.use((req, res, next) => {
	res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	next();
});

app.get('/', (req, res) => {
	res.redirect('/login');
});

app.get('/login', (req, res) => {
	req.mySession.reset();
	Photo.updateMany({ status: 'S' }, { status: 'A' })
		.then((result) => {
			res.render('login', {
				message: false,
				title: 'Please Log in'
			});
			console.log('All photos are available');
		})
		.catch((err) => {
			console.log(err);
		});
});

app.get('/gallery', (req, res) => {
	
	if (req.mySession.user) {
		Photo.find({ status: 'A' })
			.sort({ description: 1 })
			.then((result) => {
				res.render('index', {
					title: 'Gallery',
					data: result,
					label: '',
					main: false,
					username: req.mySession.user
				});
			})
			.catch((err) => {
				console.log(err);
			});
	} else {
		req.mySession.reset();
		res.redirect('/login');
	}
});

app.post('/login', (req, res) => {
	let userEmail = req.body.email;
	let pass = req.body.password;
	fs.readFile('user.json', 'utf-8', (err, data) => {
		if (err) throw err;

		let confirmObject = JSON.parse(data);

		if (!confirmObject.hasOwnProperty(userEmail)) {
			res.render('login', {
				message: 'Not a registered username.'
			});
		} else if (confirmObject[userEmail] != pass) {
			res.render('login', {
				message: 'Invalid password.'
			});
		} else {
			delete req.body.password;
			req.mySession.user = userEmail;
			return res.redirect('/gallery');
		}
	});
});

app.post('/gallery', (req, res) => {
	let clicked = req.body.submit;
	Photo.find({ status: 'A' })
		.sort({ description: 1 })
		.then((result) => {
			if (req.mySession.user) {
				if (clicked == 'submit' && !req.body.myList) {
					//if no radio button was selected, default image to be loaded
					res.render('index', {
						data: result,
						main: false,
						label: '',
						username: req.mySession.user,
						title: 'Gallery'
					});

			
				} else if (clicked == 'submit' && req.body.myList) {
					res.render('index', {
						title: 'Gallery',
						data: result,
						main: req.body.myList,
						label: req.body.myList,
						username: req.mySession.user
					});
				} else {
					res.redirect('/login');
				}
			}
		})
		.catch((err) => {
			console.log(err);
		});
});

app.get('*', (req, res) => {
	res.send('<h1>404 not found</h1><h1>This site cannot be reached.</h1>');
});

const server = app.listen(HTTP_PORT, () => {
	console.log('Successfully connected to DB');
	console.log(`Listening on port ${HTTP_PORT}`);
});
const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require('body-parser');

const data = require("./model/data");

const app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static("assets"));

app.get("/", (req, res) => {
    res.render("main", {
        title:"main",
        categories: data.getCategories(),
        topSold: data.getProductsSorted("bs", 4)
    });
});


app.get("/login", (req, res) => {
    res.render("login", {
        title:"Log In",
        logInMode: true
    });
});
app.post('/login', (req, res) => {
	let userEmail = req.body.email;
	let pass = req.body.password;
	fs.readFile('user.json', 'utf-8', (err, data) => {
		if (err) throw err;

		let confirmObject = JSON.parse(data);

		if (!confirmObject.hasOwnProperty(userEmail)) {
			res.render('login', {
				message: 'Not a registered username.'
			});
		} else if (confirmObject[userEmail] != pass) {
			res.render('login', {
				message: 'Invalid password.'
			});
		} else {
			delete req.body.password;
			req.mySession.user = userEmail;
			return res.redirect('/gallery');
		}
	});
});

app.post('/gallery', (req, res) => {
	let clicked = req.body.submit;
	Photo.find({ status: 'A' })
		.sort({ description: 1 })
		.then((result) => {
			if (req.mySession.user) {
				if (clicked == 'submit' && !req.body.myList) {
					//if no radio button was selected, default image to be loaded
					res.render('index', {
						data: result,
						main: false,
						label: '',
						username: req.mySession.user,
						title: 'Gallery'
					});

					//if a selection was made..
				} else if (clicked == 'submit' && req.body.myList) {
					res.render('index', {
						title: 'Gallery',
						data: result,
						main: req.body.myList,
						label: req.body.myList,
						username: req.mySession.user
					});
				} else {
				
					res.redirect('/login');
				}
			}
		})
		.catch((err) => {
			console.log(err);
		});
});

app.get('*', (req, res) => {
	res.send('<h1>404 not found</h1><h1>This site cannot be reached.</h1>');
});

const server = app.listen(HTTP_PORT, () => {
	console.log('Successfully connected to DB');
	console.log(`Listening on port ${HTTP_PORT}`);
});
