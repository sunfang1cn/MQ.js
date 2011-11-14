var url = require('url');
var requestHandle = require('./request_parser');


function route(client)
{
    var handle = {};
    handle['exit'] = requestHandle.exit;
    handle['put'] = requestHandle.put;
    handle['get'] = requestHandle.get;
	handle['flushall'] = requestHandle.flush_all;
	handle['help'] = requestHandle.help;
	

	var __buf = '';
	client.setEncoding('utf-8');
	client.on('data', function(data){
		__buf += data;
		if(__buf.match('\r\n')) {
			var action = decodeParam(__buf).action;
			var param = decodeParam(__buf).param;
			__buf='';
			if(typeof handle[action] === 'function')
			{
			   handle[action](client, param);
			}else{
				handle['help'](client, param);
			}
		}
	});
	client.on('error', function(err){
		client.end();
	});
}


function decodeParam(data)
{
	
	if(data==null || data=='') return {action:'help', param:''};
	data = data.split('\r\n')[0];
	var splited = data.split(' ');
	if(splited.length < 1 || splited.length > 3 ) return {action:'help', param:''};
	return {action:splited[0], param:splited[1]};
}

exports.route= route;