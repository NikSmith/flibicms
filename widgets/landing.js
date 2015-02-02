module.exports = function(core,options,callback){
    core.assign("title",options.description);
    core.assign("body",options.body);
    if (options.config){
        core.assign("background",options.config.background);
    }
    callback(null);
};