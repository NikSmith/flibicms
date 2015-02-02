var db = require("./db");
var config = require("./config").config;
var fs = require("fs");
var async = require("async");
var ejs = require("ejs");
var _positions = require("../lib/positions");
var bootstrap = require("../lib/bootstrap");
bootstrap.addModule("widgets");

var redis = require("redis");
var client = redis.createClient();

var widgets = {};
var widgetsBind = {};


db.query("SELECT id,name FROM widgets", function (err, data) {
    if (!err) {
        data.forEach(function (item) {
            fs.exists(config.websitePath+"/widgets/"+item.name+".js",function(exists){
                if (exists) {
                    widgets[item.id] = {
                        name:item.name,
                        run:require("../widgets/"+item.name+".js")
                    };
                }
            });
        });
    }
});

exports.update = function (callback){
    if (Object.keys(widgetsBind).length){
        for (var item in widgetsBind){
            if (widgetsBind.hasOwnProperty(item))
                delete widgetsBind[item];
        }
    }
    db.query("SELECT target FROM controllers",function(err,res){
        if (err){
            console.log(err);
        }
        db.query("SELECT * FROM widgets_bind WHERE enabled = 1 ORDER BY position,sort",function(err,wdgts){
            var alltargets = [];
            var i=0;
            if (err){
                console.log(err);
            }
            (function addWidgetToList(){
                if (wdgts && wdgts.length) {
                    if (wdgts[i].config) {
                        try {
                            wdgts[i].config = JSON.parse(wdgts[i].config);
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                    if (wdgts[i].target == "*") {
                        alltargets.push(wdgts[i]);
                    }
                    else {
                        if (!widgetsBind[wdgts[i].target]) {
                            widgetsBind[wdgts[i].target] = [];
                        }
                        widgetsBind[wdgts[i].target].push(wdgts[i]);
                    }
                }
                i++;
                if (i<wdgts.length){
                    addWidgetToList();
                }
                else {
                    if (res && res.length){
                        i =0;
                        (function concatArrayss(){
                            if (res[i].target.substr(0,5) != "admin"){
                                if (!widgetsBind[res[i].target]){
                                    widgetsBind[res[i].target] = [].concat(alltargets);
                                }
                                else {
                                    widgetsBind[res[i].target] = alltargets.concat(widgetsBind[res[i].target]);
                                }
                            }
                            i++;
                            if (i<res.length){
                                concatArrayss();
                            }
                            else {
                                if (typeof callback == "function"){
                                    callback();
                                }
                            }
                        })();
                    }
                    else {
                        if (typeof callback == "function"){
                            callback();
                        }
                    }
                }
            })();
        });
    });
};

function getWidgetCache(id,time,cb){
    if (!time){
        cb(null,null);
        return;
    }
    client.get("widget::"+id,function(err,html){
        cb(err,html);
    })
}

function proccessWidget(usergroup,req,item,callback){
    var access = false;
    var page = {
        template: "/widgets/"+widgets[item.parent].name+".ejs",
        vars: {}
    };
    var core = {
        setSession: function (key, value) {
            req.session[key] = value;
        },
        getSession: function (key) {
            return req.session[key];
        },
        delSession: function(key){
            delete req.session[key];
        },
        assign: function (name, value) {
            if (!page.vars[name]) {
                page.vars[name] = value;
            }
        },
        usergroup: usergroup
    };
    if (item.usergroup.indexOf(usergroup) != -1){
        if (item.url || item.url2){
            if (item.url && item.url2){
                if (req.url.search(item.url)>=0 && req.url.search(item.url2)>=0){
                    // Разрешили и запретили один и тот же урл
                    access = false;
                }
                else {
                    // Если разные страницы, то превосходство по разрешающей маске
                    if (req.url.search(item.url)>=0){
                        access = true;
                    }
                }
            }
            else {
                if (item.url){
                    if (req.url.search(item.url)>=0){
                        access = true;
                    }
                }
                if (item.url2){
                    if (req.url.search(item.url2)>=0){
                        access = false;
                    }
                    else {
                        access = true;
                    }
                }
            }
        }
        else {
            access = true;
        }
    }
    if (access){
        getWidgetCache(item.id,item.cache,function(err,html){
            if (err || html){
                callback(err,html);
                return;
            }
            widgets[item.parent].run(core,item,function(err){
                if (!err){
                    ejs.renderFile(config.websitePath+"/views/"+config.template+"/"+page.template,{vars:page.vars},{cache: config.cacheTplWidget},function(err,code){
                        callback(err,code);
                        if (item.cache){
                            client.setex("widget::"+item.id, item.cache, code);
                        }
                    });
                }
                else {
                    callback(err);
                }
            });
        });
    }
    else {
        callback(null);
    }
}
// Получение виджетов для текущего назначения
exports.renderWidgets = function (data,req,callback){
    var target = data.controller+"::"+data.action;
    var positions = new _positions();
    if (widgetsBind[target]){
        async.map(
            widgetsBind[target],
            function(item,next){
                proccessWidget(data.usergroup,req,item, function(err,code){
                    if (err){
                        console.error(err);
                    }
                    if (code){
                        if (!positions[item.position]){
                            positions[item.position][item.sort] = [];
                        }
                        positions[item.position][item.sort]= code;
                    }
                    next();
                })
            },
            function(){
                callback(null,positions);
            });
    }
    else {
        callback(null,positions);
    }
};
