/**
 * sunfang1cn@yahoo.com.cn
 * This file is to flush to or read from disk files of queues 
 */

var config = require('../config')
   ,fs = require('fs');

/**
 * options: {item_max_size, max_item_number, item_sizes[], big_buffer}
 * warning : will replace data in memory
 */
function read_all_from(path, options, callback)
{
    try
    {
        var file = fs.openSync(path,'r');
    }
    catch (err)
    {
        return callback(new Error('cannot open file'), null);
    }
	
	var hbuf = '';
	var _size_buf;
	if(file) {
		var offset = 0; //file pos

		//try to read initial params
		while(!hbuf.match('\r\n')) {
			var tmp_buf = new Buffer(3);
			offset += fs.readSync(file, tmp_buf, 0, 1, offset);
			hbuf += tmp_buf.toString('utf-8', 0, 1);
		}
		hbuf = hbuf.split('\r\n')[0];
		var item_max_size = hbuf.split('|')[0];
		var item_number = hbuf.split('|')[1];
        var max_item_number = hbuf.split('|')[2];
		//try to read item_sizes
		_size_buf = new  Buffer(20*1000*1000);

		var bf_off = 0;
		while((_size_buf[bf_off-1]!=0x0a)&&(_size_buf[bf_off-2]!=0x0d)) {
			offset += fs.readSync(file, _size_buf, bf_off, 1, offset);
			bf_off++;
		}
		var item_sizes = [];
		for(j=0; j<bf_off-2; j++) {
			item_sizes[j] = _size_buf[j];
		}
		delete _size_buf;

		//try to read main content
        var big_buffer = new Buffer(max_item_number*item_max_size+1);
		fs.read(file, big_buffer, 0, max_item_number*item_max_size, offset, function(err, readed){
            if(err) return callback(new Error('cannot open file'), null);
            offset+=readed;
            fs.closeSync(file);
            return callback(null, item_max_size, max_item_number, item_sizes, big_buffer, item_number);
        });

	} else {
		return callback(new Error('cannot open file'), null);
	}
}


/**
 * options: {item_max_size, item_number, max_item_number,item_sizes[]}
 */
function flush_all_to(path, options, buffer, callback)
{
	var file = fs.openSync(path,'a','0777');
	var offset = 0;
	if(file) {
		//write params into files
		offset += fs.writeSync(file, options.item_max_size+'|'+options.item_number+'|'+options.max_item_number+'\r\n', 0);
		var _size_buf = new Buffer(options.item_sizes);
		offset += fs.writeSync(file, _size_buf, 0, _size_buf.length, offset);
		offset += fs.writeSync(file, '\r\n', offset);

		//write queue data
		fs.write(file, buffer, 0, buffer.length, offset, function(err, written){
			offset += written;
			fs.closeSync(file);
			callback(err, offset);
		});
	} else {
		callback(new Error('cannot open file'), null);
	}
}

exports.flushAll = flush_all_to;
exports.readAll = read_all_from;