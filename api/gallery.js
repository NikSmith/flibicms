var db = require("../lib/db");
module.exports = function(core,callback){
    var _do = core.request("do","str") || "viewphoto";
    var id = core.request("id","int");
    var page = core.request("page","int");
    var album = core.request("album","int");
    var limit = core.request("limit","int");
    var height = core.request("height","int");
    var cols = core.request("cols","int");
    if (_do == "viewphoto"){
        if (!id){
            callback(404);
            return;
        }
        db.query("SELECT title, description, image FROM ext_photos WHERE enabled=1 AND id="+id,function(err,photo){
            core.render(true);
            if (!err){
                if (photo && photo.length){
                    callback(err,{_do:_do,photo:photo[0]})
                }
                else {
                    callback(404);
                }
            }
            else {
                callback(err);
            }

        });
    }
    else if (_do=="getpage"){
        if (!album || !limit || !height || !cols){
            callback(404);
            return;
        }
        db.prePage({
            page: page,
            table: "ext_photos",
            fields: "*",
            order: "sort",
            condition: "enabled=1 AND album_id="+album,
            limit: limit
        },function(err,photos){
            var obj = {
                _do:"getpage",
                photos:photos.child,
                page:photos.page,
                pages:photos.pages,
                album:album,
                height:height,
                cols:cols
            };
            core.render(true);
            callback(err,obj);
        });
    }
    else{
        callback(404);
    }

};