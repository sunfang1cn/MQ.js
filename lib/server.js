var config = require('../config');
var net = require('net');
var route = require('./router');

function start()
{
   function onRequest(client)
   {
      route.route(client);
   }
   var server = net.createServer({allowHalfOpen:false}, function(c){
		c.write('\r\n');
		onRequest(c);
   });
   server.listen(config.server_port);
}

exports.start = start;