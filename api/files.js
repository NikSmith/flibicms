var db = require("../lib/db");
module.exports = function(core,callback){
    var file = core.request("get","str");
    if (!file){
        callback(404);
        return;
    }
    db.query("UPDATE ext_files SET downloads=downloads+1 WHERE file='"+file+"'",function(){
        callback(302,"/uploads/files/"+file);
    });
};