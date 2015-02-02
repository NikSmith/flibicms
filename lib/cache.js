var fs = require("fs");
var config = require("../lib/config").config;
module.exports.getCache = function(url,callback){
    if (!config.mainCache){
        callback(true);
        return;
    }
    var filename = config.websitePath+"/cache/"+encodeURIComponent(url)+".html";
    fs.stat(filename,function(err,data){
        if (!err){
            var delta = parseInt((new Date().getTime() - new Date(data.mtime).getTime())/1000);
            if (delta > config.cacheTime){
                callback(true);
            }
            else {
                fs.readFile(filename, 'utf8', function(err, html){
                    callback(err,html);
                });
            }
        }
        else {
            callback(err);
        }
    });
};

