'use strict';

var Primus = require('primus'),
	_ = require('lodash-node');
	
var users = [];

var server = Primus.createServer(function connection(spark) {
	
	spark.on('end', function() {
		removeUser(spark);
	});
	
	spark.on('data', function(payload) {
		console.log(payload);
		var fn;
		switch (payload.type) {
			case 'join':
				fn = joinUser;
				break;
			case 'message':
				fn = sendMessage;
				break;
			case 'leave':
				spark.write({
					id: payload.id,
					type: 'goodbye'
				});
				
				fn = removeUser;
				break;				
		}
		
		if (fn) fn(spark, payload);
	});

}, { port: 8080, transformer: 'websockets' });

console.log(`Started chat server on port ${ server.options.port }`);

function joinUser(spark, payload) {
	if (payload.group) {
		if (payload.name)  {
			if (_.some(users, function (user) { return user.name === payload.name; })){
				spark.write({
					id: payload.id,
					type: 'error',
					message: `User with ${ payload.name } already exists.`
				});	
			} else {
				spark.write({
					id: payload.id,
					type: 'server-info',
					users: _.map(users, function (user) {
						return {
							name: user.name,
							group: user.group
						}	
					})
				})			
				
				users.push({
					name: payload.name,
					group: payload.group,
					spark: spark		
				});
				
				send({
					type: 'welcome',
					name: payload.name,
					group: payload.group
				});
			}
		} else {
			spark.write({
				id: payload.id,
				type: 'error',
				message: 'You must provide name'
			});	
		}
	} else {
		spark.write({
			id: payload.id,
			type: 'error',
			message: 'You must provide group'
		});
	}
}

function send(payload) {
	users.forEach(function (user) {
		if (!payload.group || payload.group == user.group) {
			user.spark.write(payload);
		}
	});
}

function removeUser(spark) {
	var index,
		user = _.find(users, function (user, i) { index = i; return user.spark === spark; });
	
	if (user) {
		users.splice(index, 1);
		
	
		send({
			type: 'goodbye',
			name: user.name,
			group: user.group
		});
	}
}

function sendMessage(spark, payload) {
	var user = _.find(users, function (user) { return user.spark === spark; });
	
	if (user) {
		send({
			type: 'message',
			name: user.name,
			group: user.group,
			message: payload.message
		});
	}
}