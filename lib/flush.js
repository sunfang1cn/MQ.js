/**
 * sunfang1cn@yahoo.com.cn
 * This file is to flush to or read from disk files of queues 
 */

var config = require('../config')
   ,fs = require('fs');


function read_all_form(path, options, callback)
{
	
}


/**
 * options: {item_max_size, item_number, item_sizes[]}
 */
function flush_all_to(path, options, buffer, callback)
{
	var file = fs.openSync(path,'a');
	var offset = 0;
	if(file) {
		//write params into files
		offset += fs.writeSync(file, options.item_max_size+'|'+options.item_number+'\r\n', 0);
		var _size_buf = new Buffer(options.item_sizes);
		offset += fs.writeSync(file, _size_buf, 0, _size_buf.length, offset);
		offset += fs.writeSync(file, '\r\n', offset);

		//write queue data
		fs.write(file, buffer, 0, buffer.length, offset, function(err, written){
			offset += written;
			fs.closeSync(file);
			callback(err, offset);
		});
	}
	
}

exports.flushAll = flush_all_to;