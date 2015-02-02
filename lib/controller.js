var config = require("./config.js").config;
var fs = require("fs");
var db = require("./db");
var _page = require("../lib/page");
var _core = require("../lib/core");
var bootstrap = require("../lib/bootstrap");
bootstrap.addModule("controller");

var controller = {};
var access = {};

var getControllerAccess = function(target,group,callback){
    if (access[target] && access[target].indexOf(group) !=-1){
        callback(null,true)
    }
    else {
        callback(null,false);
    }
};
exports.update = function(callback){
    db.query("SELECT * FROM controllers", function (err, data) {
        if (!err){
            data.forEach(function(it){
                if (access.hasOwnProperty(it.target)){
                    delete access[it.target];
                }
                access[it.target] = it.usergroup;
            });
        }
    });

    fs.readdir(config.websitePath+"/controllers", function (err, data) {
        var name;
        if (data && data.length) {
            for (var i=0; i<data.length; i++){
                name = data[i].indexOf(".") != -1 ? data[i].substr(0, data[i].indexOf(".")) : data[i];
                if (controller.hasOwnProperty(name)){
                    delete controller[name];
                }
                controller[name] = require("../controllers/" + data[i]);
            }
        }
    });
    if (typeof callback == "function"){
        callback();
    }
};
exports.run = function(data,req,callback){

    if (controller[data.controller] && controller[data.controller][data.action]) {

        var page = new _page(data,true);
        var core = new _core(page,req,true);

        var action = new controller[data.controller][data.action](core);
        var target = data.controller+"::"+data.action;

        if (action.run.length - 1 == data.params.length) {

            getControllerAccess(target,data.usergroup,function(err,access){

                if (!err){
                    if (access){
                        data.params.push(function (err,result) {
                            if (!err){
                                callback(err,page);
                            }
                            else {
                                callback(err,result);
                            }
                        });
                        action.run.apply(null,data.params);
                    }
                    else {
                        core.setSession("refer",data.url);
                        callback(403);
                    }
                }
                else {
                    callback(err);
                }
            });

        }
        else {
            callback(404,"Неверное количество аргументов");
        }
    }
    else {
        callback(404,"Контролер не найден");
    }
}

