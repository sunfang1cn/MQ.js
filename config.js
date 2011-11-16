exports.buffer_size = 100*1024*1024;    //Maxmium msg queue length(B)
exports.max_item_number = 100*1024;    //Maxmium msg count
exports.item_max_size = 1000;         //Maxmium size per msg(B)

exports.server_port = 8888;          //the service network port

exports.flush_dir = '.';            //the dictionary which save the flush files, must be exists

/*
 * Policy which control how to synchronize between memory queue data and disk files : 
 *  'none' : donnot do any synchronize automaticly. you can use 'flushall' and 'readall' command manually;
 *  'always' : any change will be synchronized into disk files instantly, this may produce lots of io cost.
 *  'time' : by this it will do synchronizing per time which defined in the option flush_time(mili-second).
 */
exports.flush_policy = 'none';
exports.flush_time = 2500;
