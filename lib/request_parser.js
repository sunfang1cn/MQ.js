var config = require('../config'),
	url = require('url');

var started = 0;
var big_buffer;
var item_sizes = [];
var item_index = [];
var empty_index = [];
var item_number = 0;
var buffer_size = 0;
var full_use = false;

function init() {
	big_buffer = new Buffer(config.buffer_size);
}

function exit(client, param) {
	client.write('\r\n');
	return client.end();
}

function get(client, param) {
	if(item_number%100==0) console.log(item_number);
	rpop(function(err, replies) {
		if(err==1) return client.write('{error:21, message:"no message in queue"}\r\n');
		return client.write(replies + '\r\n');
	});
}

function help(client, param)
{
	var help_msg = 'MQ.js Usage:\r\n 1, put something \r\n 2, get\r\n';
	return client.write(help_msg);
}

function put(client, param) {
	if(item_number%100==0) console.log(item_number);
	var data = param;
	if(data==null || data=="") return client.write('{error:13, message:"empty message"}\r\n');
	lpush(data,
	  function(err, replies) {
		if(err==1) return client.write('{error:11, message:"maxmiun item number reached"}\r\n');
		if(err==2) return client.write('{error:12, message:"too large message"}\r\n');
		return client.write(replies + '\r\n');
	});
}

function rpop(callback)
{
	if(item_number == 0) return callback(1);
	var nindex = item_index.shift();
	var data = big_buffer.toString('utf-8', nindex*config.item_max_size, nindex*config.item_max_size+item_sizes[nindex]);
	item_sizes[nindex]=0;
	empty_index.push(nindex);
	item_number--;
	return callback(0,data);
}

function lpush(data, callback)
{
	if(item_number >= config.max_item_number) return callback(1);
	if(data.length > config.item_max_size) return callback(2);
	if(full_use == false) {
		var nlen = big_buffer.write(data, buffer_size);
		buffer_size += config.item_max_size;
		item_sizes.push(nlen);
		item_index.push(item_number);
		item_number++;
		if(item_number == config.max_item_number) full_use = true;
		return callback(0, data);
	}else{
		var j = empty_index.shift();
		if(j != null ) {
			var nlen = big_buffer.write(data, j*config.item_max_size);
			item_sizes[j]= nlen;
			item_index.push(j);
			item_number++;
		}
		return callback(0, data);
	}
}

exports.exit = exit;
exports.get = get;
exports.put = put;
exports.help = help;
init();