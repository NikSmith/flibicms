var db = require("./db");
var config = require("./config").config;
var bootstrap = require("../lib/bootstrap");
bootstrap.addModule("alias");
var alias = [];
exports.update = function(cb){
    for(var i=0; i<alias.length; i++){
        alias.splice(i);
    }
    db.query("SELECT * FROM alias", function (err, data) {
        data.forEach(function(it){
            alias.push(it);
        });
        if (typeof cb == "function"){
            cb(alias);
        }
    });
};
exports.getControllerAction = function(url,callback){
    var data = {
        controller: "",
        action: "",
        params: [],
        url:url
    };

    var uri = url.substr(1, url.length);
    var segmentsUrl = uri.split("/");
    data.controller = segmentsUrl.shift();
    data.action = segmentsUrl.length ? segmentsUrl.shift() : config.defaultAction;
    if (!data.action){
        data.action = config.defaultAction;
    }

    data.params = segmentsUrl;
    if (data.controller == config.defaultController &&  data.action == config.defaultAction){
        callback(301,"/");
        return;
    }

    // Корень
    if ("/" === url) {
        data.controller = config.defaultController;
        data.action = config.defaultAction;
        callback(null,data);
    }
    else {
        var i = 0;
        (function test(){
            var item = alias[i];
            if (!item){
                callback(null,data);
                return
            }
            var reg = new RegExp(item.link,"i");
            var match = url.match(reg);
            i++;
            if (match){
                data.controller = item.controller;
                data.action = item.action;
                data.params = match.splice(1,match.length);
                callback(null,data);
            }
            else {
                if (i< alias.length){
                    test();
                }
                else {
                    callback(null,data)
                }
            }
        })();
    }
};