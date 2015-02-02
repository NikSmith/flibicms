var ejs = require("ejs");
var fs = require("fs");

var config = require("./config").config;
var alias = require("../lib/alias");
var cache = require("../lib/cache");
var controllers = require("../lib/controller");
var widgets = require("../lib/widgets");
var api = require("../lib/api");
var bootstrap = require("../lib/bootstrap");
bootstrap.bootstrap();


var notCache = {
    admin:true
};

var redis = require("redis"),
    client = redis.createClient();


function execResult(error,data,res){
    // Обработка ошибок возвращенных контроллером
    console.error("Ошибка: ",error,data);
    switch (error){
        case 301:
            res.redirect(data);
            break;
        case 302:
            data += '/';
            res.statusCode = 302;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Location', data);
            res.end();
            break;
        case 404:
            fs.readFile(config.websitePath+"/views/"+config.template+"/special/404.html",null,function(err,file){
                if (!err){
                    res.status(404).end(file);
                }
                else {
                    res.status(404).end();
                }
            });
            break;

        case 403:
            fs.readFile(config.websitePath+"/views/"+config.template+"/special/403.html",null,function(err,file){
                if (!err){
                    res.status(403).end(file);
                }
                else {
                    res.status(403).end();
                }
            });
            break;

        case 500:
            res.status(500).end();
            break;

        default :
            res.status(500).send(data);
            break
    }
}


module.exports = function (req,res){

    var project = config.project+"::"+new Date().getDate();
    var timeGen = {
        data:{
            time: 0
        },
        start: new Date().getTime(),
        getTime: function(name){
            if (!this.data[name]){
                this.data[name] = new Date().getTime() - this.start - this.data['time'];
                this.data['time'] += this.data[name];
            }
        }
    };

    var url = req.params[0];
    var len = url.length;

    if ("/" == url[len-1] && len > 1){
        res.redirect(301,url.substr(0,len-1));
        return;
    }

    var is_ajax = req.xhr;
    alias.getControllerAction(url,function(err,data){
        if (err){
            execResult(err,data,res);
            return;
        }
        if (!data){
            res.status(404).end();
        }
        else{
            data.usergroup = req.session.usergroup;
            if (!data.usergroup){
                data.usergroup = req.session.usergroup = 'guest';
            }
            if (config.siteoff && data.controller != "admin" && data.usergroup != "admin" && data.controller != "users" && data.action != "login"){
                ejs.renderFile(config.websitePath+"/views/"+config.template+"/special/siteoff.html",{siteoffDesc:config.siteoffDesc},{cache:true},function(err,html){
                    if (!err){
                        res.send(html);
                    }
                    else {
                        res.status(404).end();
                    }
                });
                return;
            }
            if ("api" == data.controller){//&& is_ajax
                api.runApi( data.action,req,function(err,obj){
                    if (!err){
                        res.send(obj);
                    }
                    else {
                        execResult(err,obj,res);
                    }
                });
            }
            else {
                // Проверим есть ли запись в кэшэ, и если есть отдадим файл
                cache.getCache(url,function(err,html){
                    if (!err && !notCache[data.controller] && html) {
                        res.send(html);
                    }
                    else {

                        if (is_ajax){
                            controllers.run(data,req,function(err,result){
                                if (err){
                                    execResult(err,result,res);
                                    return;
                                }
                                if(result && result.render){
                                    ejs.renderFile(config.websitePath+"/views/"+config.template+"/"+result.template+".ejs", {vars:result.vars,title:result.title, header:result.header},{cache:config.cacheTplController}, function(err, controller){
                                        if (!err){
                                            res.send(controller);
                                        }
                                        else {
                                            execResult(err,result,res);
                                        }
                                    });
                                }
                                else {
                                    res.send(result.vars);
                                }

                            });
                        }
                        else{

                            controllers.run(data,req,function(err,result){
                                timeGen.getTime('controllerRun');
                                if (err){
                                    execResult(err,result,res);
                                    return;
                                }
                                // Рендерим шаблон контроллера
                                ejs.renderFile(config.websitePath+"/views/"+config.template+"/"+result.template+".ejs", {vars:result.vars,title:result.title, header:result.header},{cache:config.cacheTplController}, function(err, controller){
                                    timeGen.getTime('controllerRender');
                                    if (err){
                                        execResult(404,err,res);
                                        return;
                                    }
                                    widgets.renderWidgets(data,req,function(err,widgets){
                                        timeGen.getTime('WidgetsRender');
                                        if (err){
                                            execResult(404,null,res);
                                            return;
                                        }
                                        ejs.renderFile(config.websitePath+"/views/"+config.template+"/"+result.layout+".ejs",{keywords:result.meta.keywords,metadesc:result.meta.desc,title:result.title, header: result.header,body:controller,pos:widgets},{cache: config.cacheTplController},function(err, html){
                                            if (err || !html){
                                                execResult(404,null,res);
                                                return;
                                            }
                                            res.send(html);
                                            //console.log(timeGen.data.time)
                                            client.incrby(project,1,function(err,val){
                                                if (!err){
                                                    if (val == 1){
                                                        client.expire(project,86400);
                                                    }
                                                }
                                            });
                                            if (config.mainCache){
                                                fs.writeFileSync(config.websitePath+"/cache/"+encodeURIComponent(req.url)+".html",html,{});
                                            }
                                        });
                                    });
                                });
                            });
                        }
                    }
                });
            }
        }
    });
};