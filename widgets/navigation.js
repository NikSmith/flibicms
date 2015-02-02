var db = require("../lib/db");
var ns = require("../lib/ns");
module.exports = function(core,options,callback){
    if (options.config && options.config.menuid){
        db.query("SELECT * FROM menu WHERE TreeId="+options.config.menuid+" AND NSLevel !=0 ORDER by NSLeft",function(err,items){
            if (!err){
                core.assign("config",options.config);
                core.assign("title",options.description);
                core.assign("body",options.body);
                core.assign("items",items);
                core.assign("usergroup",core.usergroup);
                callback(null);
            }
            else {
                callback(err);
            }
        });
    }
    else {
        callback();
    }
};