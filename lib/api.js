var config = require("./config.js").config;
var bootstrap = require("../lib/bootstrap");
bootstrap.addModule("api");

var fs = require("fs");
var db = require("./db");
var ejs = require("ejs");
var apiRouters = {};
var accessApi = {};

function update(callback){
    for (var router in apiRouters){
        if (apiRouters.hasOwnProperty(router))
        delete apiRouters[router];
    }
    for (var access in accessApi){
        if (accessApi.hasOwnProperty(access))
            delete accessApi[access];
    }
    db.query("SELECT * FROM api WHERE enabled = 1",function(err,data){
        if (!err){
            data.forEach(function(item){
                fs.exists(config.websitePath+"/api/" +item['alias']+".js",function(exists){
                    if (exists){
                        accessApi[item.alias] = item;
                        apiRouters[item.alias] = require("../api/" +item.alias);
                    }
                })
            });
        }
        else {
            console.log(err);
        }
        if (typeof callback == "function"){
            callback();
        }
    });
}


function _core(req){
    var request = {};
    var render = false;
    if ("GET" === req.method) {
        request = req.query;
    } else if ("POST" === req.method) {
        request = req.body;
    }
    this.usergroup = req.session.usergroup;
    this.request = function (key, type) {
        if (type == 'int') {
            if (!isNaN(parseFloat(request[key])) && isFinite(request[key])){
                return request[key];
            }
            else {
                return null;
            }
        }

        if (type == 'str') {
            if (request[key]){
                var str = db.escape(request[key]);
                return str.substr(1,str.length-2);
            }
            else {
                return '';
            }
        }

        if (type == "email"){
            var email;
            var pattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;

            if (request[key] && pattern.test(request[key])){
                email = db.escape(request[key]);
                return email.substr(1,email.length-2);
            }
            else {
                return null;
            }
        }

        return null;
    };
    this.setSession = function (key, value) {
        req.session[key] = value;
    };
    this.getSession = function (key) {
        return req.session[key];
    };
    this.delSession = function(key){
        delete req.session[key];
    };
    this.render = function(bool){
        if (bool == true || bool == false){
            render = bool;
        }
        else {
            return render
        }
    };
    this.req = req;
}

function runApi(name,req,callback){
    var access = false;
    // ПРоверить при прокисровании nginx будет ли express получать ip клиента
    var remouteIp;
    var userIp = [];
    var data = new _core(req);
    if (apiRouters[name]){
        if (accessApi[name]){
            if (accessApi[name].usergroup.indexOf(data.usergroup) != -1){
                if (accessApi[name].ip){
                    if (req.ip){
                        remouteIp = req.ip.split("."); //req.headers['x-forwarded-for'] || req.connection.remoteAddress; //X-Real-IP
                        userIp = accessApi[name].ip.split(".");
                        if (userIp.length == 4 && remouteIp.length == 4){
                            if (userIp[0] == remouteIp[0] || userIp[0] == "*"){
                                if (userIp[1] == remouteIp[1] || userIp[1] == "*"){
                                    if (userIp[2] == remouteIp[2] || userIp[2] == "*"){
                                        if (userIp[3] == remouteIp[3] || userIp[3] == "*"){
                                            access = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    access = true;
                }
            }
        }
        if (access === true){
            apiRouters[name](data,function(err,obj){
                if (data.render()){
                    ejs.renderFile(config.websitePath+"/views/api/"+name+".ejs",obj,{cache:true},function(err,html){
                        callback(err,html);
                    });
                }
                else {
                    callback(err,obj);
                }
            })
        }
        else {
            callback(403);
        }
    }
    else {
        callback(404);
    }
}

exports.runApi = runApi;
exports.update = update;