module.exports = function(core,options,callback){
    core.assign("title",options.description);
    core.assign("body",options.body);
    callback(null);
 };