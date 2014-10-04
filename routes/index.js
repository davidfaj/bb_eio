module.exports = function Route(app){
////////// SERVER DATA
	var users = [];
	var polls = [];
	var polls_counter = 0;
	var poll_id = 0;
	console.log("Poll server is running!");


////////// FUNCTIONS
	function userExists(sid){
	// function to check if user with sid (session id) already exists
		var exists = false;
		if (users.length == 0) {return false;}
		else {
			for (u = 0; u < users.length; u++) {
				if (users[u].sessionID == sid) {exists = true;}
			}
			if (exists == true) {return true;}
			else {return false;}
		}
	}

	function logout(sid){
	// function to logout (remove user data from users array)
		for (lo = 0; lo < users.length; lo++) {
			if (users[lo].sessionID == sid) {
				users.splice(lo, 1);
				return;
			}
		}
	}

	function listAllUsers() {
	// function to print list of all users in server
		console.log("list of all logged users (" + users.length + "):");
		for (lau = 0; lau < users.length; lau++) {
			console.log("[" + lau + "] " + users[lau].name + " " + users[lau].sessionID);
		}
	}

	function getUserName(sid) {
	// function to get the user name given the sessionID
		for (gun = 0; gun < users.length; gun++) {
			if (users[gun].sessionID == sid) {return users[gun].name;}
		}
		return;
	}

	function pollExists(pollID) {
	// function to check if poll exists with a specific ID
		exists = false;
		for (pe = 0; pe < polls.length; pe++) {
			if (polls[pe].id == pollID) {exists = true;}
		}
		if (exists == true) {return true;}
		else {return false;}
	}


////////// ROUTING
	app.get('/', function(req, res){
		// if new user
		if (userExists(req.sessionID) == false) {
			res.render('index');
		}
		// if logged user
		else {
			res.redirect('poll');
		}
	});

	app.get('/poll', function(req, res){
		// if new user
		if (userExists(req.sessionID) == false) {res.redirect('/');}
		// if logged user
		else {res.render('all_polls', {polls: polls});}
	});

	app.get('/poll/create', function(req, res){
		// if new user
		if (userExists(req.sessionID) == false) {res.redirect('/');}
		// if logged user
		else {res.render('poll_create', {polls: polls});}
	});

	app.get('/poll/:poll_id', function(req, res){
		this_poll = req.params.poll_id;
		// if poll doesn't exist
		if (pollExists(this_poll) == false) {res.redirect('/'); return;}
		// if new user
		if (userExists(req.sessionID) == false) {res.redirect('/');}
		// if logged user
		else {
			res.render('poll', {poll: polls[this_poll]});
		}
	});

	app.get('/logout', function(req, res){
		logout(req.sessionID);
		listAllUsers();
		res.redirect('/');
	});



// // EVENTS LISTENER / EMITING
	// server LISTEN to click_login
	app.io.route('click_login', function(req){
		// if new user, insert its data in the users array
		if (userExists(req.sessionID) == false) {
			console.log("new user");
			users.push({name: req.data.user_name, sessionID: req.sessionID});
			listAllUsers();
		}
		// server EMIT goto_all_polls
		req.io.emit('goto_all_polls');
	});

	// server LISTEN to user_created_poll
	app.io.route('user_created_poll', function(req){
		// insert poll data in the polls array
		console.log("new poll created: " + req.data.poll.question);
		polls.push(req.data.poll);
		polls[polls_counter].id = polls_counter;
		polls[polls_counter].created_by = getUserName(req.sessionID);
		this_poll = polls_counter;
		polls_counter++;
		console.log("all polls created so far: ");
		console.log(polls);
		// server EMIT user_created_poll
		req.io.emit('goto_this_poll', {this_poll: this_poll});
		// server BROADCAST new_poll
		app.io.broadcast('new_poll', {poll: polls[this_poll]});
	});

	// server LISTEN to user_voted
	app.io.route('user_voted', function(req){
		switch (req.data.vote.option) {
			case 1:
				polls[req.data.vote.poll].option1.votes++;
			break;
			case 2:
				polls[req.data.vote.poll].option2.votes++;
			break;
			case 3:
				polls[req.data.vote.poll].option3.votes++;
			break;
			case 4:
				polls[req.data.vote.poll].option4.votes++;
			break;
		}
		console.log("user voted and complete polls and votes are as follows:");
		console.log(polls);
		app.io.broadcast('new_vote', {poll: polls[req.data.vote.poll]});
	});

}