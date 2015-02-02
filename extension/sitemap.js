var config= require("../lib/config").config;
var fs = require("fs");
var db = require("../lib/db");
var models = require("../lib/model");

var sitemap = function(host){
    var _host = host;
    var mapXMLBody = "";
    var schema = [
        function (callback){
            db.query("SELECT * FROM content WHERE is_pub=1 ORDER BY NSLeft",function(err,content){
                if (!err){
                    if (content && content.length){
                        (function proccessItem(x){
                            if (content[x].NSLevel == 0){
                                createUrl(content[x].ctype);
                            }
                            else {
                                createUrl(content[x].ctype+"/"+content[x].slug);
                            }
                            x++;
                            if (x<content.length){
                                proccessItem(x);
                            }
                            else {
                                callback();
                            }
                        })(0);
                    }
                    else {
                        callback();
                    }
                }
                else {
                    callback();
                }
            })
        }
    ];
    var createUrl = function(url){
        mapXMLBody+="<url><loc>"+_host+"/"+url+"</loc><changefreq>weekly</changefreq></url>";
    };
    var finishGenerateMap = function(){
        var map = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+mapXMLBody+'</urlset>';
        fs.writeFile(config.websitePath+"/public/sitemap.xml",map,"utf-8",function(err){});
        return map;
    };
    this.generate = function(callback){
        if (schema.length){
            (function iterator(x){
                schema[x](function(){
                    x++;
                    if (x<schema.length){
                        iterator(x);
                    }
                    else {
                        callback(finishGenerateMap());
                    }
                });
            })(0);
        }
        else {
            callback(finishGenerateMap());
        }
    };
};
module.exports = function(core,callback) {
    var data = {
        _do: core.request("do","str") || "index",
        content: core.request("content","str")
    };

    switch (data._do){
        case "index":
            fs.readFile(config.websitePath+"/public/robots.txt",function(err,content){
                data['content'] = content;
                data['csrf'] = core.csrf_token();
                callback(err,data);
            });
            break;
        case "genmap":
            if (!core.is_ajax()){
                callback(404);
                return;
            }
            var map = new sitemap(core.req.vhost.host);
                map.generate(function(){
                    callback(null,data);
                });
            break;
        case "save":
            fs.writeFile(config.websitePath+"/public/robots.txt",data.content.replace(/\\n/g,"\r\n"),"utf-8",function(err){});
            callback(null,data)
            break;
        default :
            callback(404);
            return;
            break;
    }
};