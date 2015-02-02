var db = require("../lib/db");
var extend = require("util")._extend;
module.exports = function(core,options,callback){
    var cfg = {
        limit: 15,
        cols:5,
        height: '100'
    };
    var page = 1;
    extend(cfg,options.config);
    if (cfg.albumid){
        db.prePage({
            page: page,
            table: "ext_photos",
            fields: "*",
            order: "sort",
            condition: "enabled=1 AND album_id="+cfg.albumid,
            limit: cfg.limit
        },function(err,photos){
            core.assign("photos",photos.child);
            core.assign("page",photos.page);
            core.assign("pages",photos.pages);
            core.assign("cfg",cfg);
            core.assign("title",options.description);
            core.assign("body",options.body);
            callback(err);
        });
    }
    else {
        callback();
    }
};