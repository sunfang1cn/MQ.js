var config = require('../config')
   ,url = require('url')
   ,disk = require('./flush');

var started = 0;
var big_buffer;
var item_sizes = [];
var item_index = [];
var empty_index = [];
var item_number = 0;
var item_f_pos = 0;
var buffer_size = 0;
var full_use = false;
var instent_flush_fname = null;

function init() {
    big_buffer = new Buffer(config.buffer_size);

    //disk file sync control
    if(config.flush_policy=='time') {
        timely_flush(config, null);
    }
    if(config.flush_policy=='always') {
        instent_flush_fname = config.flush_dir + '\/_asa_'+ (new Date().getTime()) +'.fsh';
    }
    if(config.flush_policy=='time' || config.flush_policy=='always') {
        
    }
}

function timely_flush(config, fname)
{
    if(fname==null) fname = config.flush_dir + '\/_ast_'+ (new Date().getTime()) +'.fsh';
    var opts = {item_max_size: config.item_max_size, item_number:item_number, 
                  item_sizes:item_sizes, max_item_number: config.max_item_number, 
                  item_index:item_index, empty_index:empty_index};
    disk.flushAll(fname, opts, big_buffer, function(err, written){
        setTimeout(function(){
            timely_flush(config, fname);
        }, config.flush_time);
    });
}

function exit(client, param) {
    client.write('\r\n');
    return client.end();
}

function get(client, param) {
    rpop(function(err, replies) {
        if(err==1) return client.write('{error:21, message:"no message in queue"}\r\n');
        if(config.flush_policy=='always') {
            var opts = {item_max_size: config.item_max_size, item_number:item_number, 
              item_sizes:item_sizes, max_item_number: config.max_item_number, 
              item_index:item_index, empty_index:empty_index};
            disk.flushAll(instent_flush_fname, opts, big_buffer, function(err, written){
                ;
            });
        }
        return client.write(replies + '\r\n');
    });
}

function help(client, param)
{
    var help_msg = 'MQ.js Usage:\r\n 1, put something \r\n 2, get\r\n';
    return client.write(help_msg);
}

function put(client, param) {
    var data = param;
    if(data==null || data=="") return client.write('{error:13, message:"empty message"}\r\n');
    lpush(data,
      function(err, replies) {
        if(err==1) return client.write('{error:11, message:"maxmiun item number reached"}\r\n');
        if(err==2) return client.write('{error:12, message:"too large message"}\r\n');
        if(config.flush_policy=='always') {
            var opts = {item_max_size: config.item_max_size, item_number:item_number, 
                  item_sizes:item_sizes, max_item_number: config.max_item_number, 
                  item_index:item_index, empty_index:empty_index};
            disk.flushAll(instent_flush_fname, opts, big_buffer, function(err, written){
                ;
            });
        }
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
        item_sizes[item_f_pos] = nlen;
        item_index.push(item_f_pos);
        item_number++;
        item_f_pos++;
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

function flush_all(client, param)
{
    if(param==null || param=='' || param.match(' '))
        var fpath = config.flush_dir + '\/'+ (new Date().getTime()) +'.fsh';
    else
        var fpath = config.flush_dir + '\/'+ param + '.fsh';
    
    var opts = {item_max_size: config.item_max_size, item_number:item_number, 
                  item_sizes:item_sizes, max_item_number: config.max_item_number, 
                  item_index:item_index, empty_index:empty_index};
    disk.flushAll(fpath, opts, big_buffer, function(err, written){
        if(err) return client.write('{error:31, message:"flush all data error"}\r\n');
        return client.write(fpath+'\r\n');
    });

}

function read_all(client, param)
{
    if(param==null || param=='' || param.match(' '))
        return client.write('{error:32, message:"no files to be read"}\r\n');
    disk.readAll(param, {}, function(err, _item_max_size, _max_item_number, _item_sizes, _big_buffer, _item_number, _item_index, _empty_index){
        if(err) return client.write('{error:32, message:"no files to be read"}\r\n');
        config.item_max_size = _item_max_size;
        config.max_item_number = _max_item_number;
        item_sizes = _item_sizes;
        big_buffer = _big_buffer;
        item_number = _item_number;
        item_index = _item_index;
        empty_index = _empty_index;
        return client.write(param+'\r\n');
    });
}

exports.exit = exit;
exports.get = get;
exports.put = put;
exports.help = help;
exports.flush_all = flush_all;
exports.read_all = read_all;
init();