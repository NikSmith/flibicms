var fs = require("fs");
var ejs = require("ejs");
var bootstrap = require("../lib/bootstrap");
var models = require("../lib/model");
var controller = require("../lib/controller");
var extension = require("../lib/ext").extensions;
var config = require("../lib/config").config;

var updateConfig = require("../lib/config").update;



var extend = require("util")._extend;


var redis = require("redis"),
    client = redis.createClient();


module.exports = {
    index: function (core) {
        this.run = function (callback) {
            var memory = process.memoryUsage();
            core.addHeadJS("/js/angular-sanitize.js");
            core.addHeadJS("/js/xml2json.js");
            core.setLayout("admin/layout");
            models['users'].getUsersGroups(function(err,groups){
                if (err){
                    callback(err);
                    return;
                }
                client.get(config.project+"::"+new Date().getDate(),function(err,visitors){
                    core.assign("visitors",visitors || 0);
                    core.assign("groups",groups);
                    core.assign("memory",memory);
                    callback(err);
                });
            });
        };
    },
    users: function(core){
        this.run = function(callback){
            core.addHeadJS("/js/angular-sanitize.js");
            var schema = {
                id: core.request("id","int"),
                title: core.request("title","str"),
                role: core.request("role","str"),
                name: core.request("name","str"),
                login: core.request("login","str"),
                pass: core.request("pass","str"),
                is_banned: core.request("is_banned","int"),
                email: core.request("email","email"),
                usergroup: core.request("usergroup","int")
            };


            var _do = core.request("do","str");
            var tpl = core.request("tpl","str");

            if (_do == "getTemplate"){
                if (!core.is_ajax()){
                    callback(404);
                    return null;
                }
                switch (tpl){
                    case "editGroup":
                        core.setTemplate("admin/users/editgroup");
                        core.render(true);
                        core.assign("csrf",core.csrf_token());
                        if (schema.id){
                            models['users'].getUsersGroup(schema,function(err,group){
                                if (!err){
                                    if (group.length){
                                        core.assign("group",group[0]);
                                        callback();
                                    }
                                    else {
                                        callback("No user");
                                    }
                                }
                                else {
                                    callback(err);
                                }
                            });
                        }
                        else {
                            callback();
                        }
                        return null;
                        break;

                    case "deleteUserGroup":
                        core.setTemplate("admin/users/deletegroup");
                        core.assign("csrf",core.csrf_token());
                        core.render(true);
                        callback();
                        return null;
                        break;

                    case "deleteUser":
                        if (schema.id){
                            core.setTemplate("admin/users/deleteuser");
                            core.assign("csrf",core.csrf_token());
                            core.render(true);
                            callback();
                        }
                        else {
                            callback(404);
                        }
                        return null;
                        break;

                    case "editUser":
                        if (schema.id){
                            models['users'].getUser(schema,function(err,user){
                                if (!err){
                                    if (user.length){
                                        models['users'].getUsersGroups(function(err,groups){
                                            core.setTemplate("admin/users/edituser");
                                            core.assign("groups",groups);
                                            core.assign("user",user[0]);
                                            core.assign("csrf",core.csrf_token());
                                            core.render(true);
                                            callback(err);
                                        });
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
                        else {
                            models['users'].getUsersGroups(function(err,groups){
                                core.setTemplate("admin/users/edituser");
                                core.assign("groups",groups);
                                core.assign("csrf",core.csrf_token());
                                core.render(true);
                                callback(err);
                            });
                        }
                        return null;
                        break;

                    default :
                        callback(404);
                        return null;
                        break;
                }
            }

            switch (_do){
                case "getUsers":
                    if (core.is_ajax()){
                        models['users'].getUsers(function(err,users){
                            core.assign("users",users);
                            callback(err);
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;
                case "getUsersGroups":
                    if (core.is_ajax()){
                        models['users'].getUsersGroups(function(err,groups){
                            core.assign("groups",groups);
                            callback(err);
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;

                case "saveUserGroup":
                    if (core.is_ajax() && core.csrf()) {
                        if (schema.id) {
                            models['users'].updateUserGroup(schema, function (err, groups) {
                                if (!err) {
                                    core.assign("groups", groups);
                                    callback(err);
                                }
                                else {
                                    callback(err);
                                }
                            });
                        }
                        else {
                            models['users'].createUserGroup(schema, function (err, groups) {
                                if (!err) {
                                    core.assign("groups", groups);
                                    callback(err);
                                }
                                else {
                                    callback(err);
                                }
                            });
                        }
                    }
                    else {
                        callback(404);
                    }
                    break;

                case "deleteUserGroup":
                    if (core.is_ajax() && core.csrf()) {
                        models['users'].deleteUserGroup(schema, function (err, groups) {
                            if (!err) {
                                core.assign("groups", groups);
                                callback(err);
                            }
                            else {
                                callback(err);
                            }
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;

                case "saveUser":
                    if (core.is_ajax() && core.csrf()){
                        if (schema.id){
                            models['users'].updateUser(schema,function(err,result){
                                if (!result){
                                    callback(err);
                                }
                                else {
                                    core.assign("error",result);
                                    callback();
                                }
                            });
                        }
                        else {
                            models['users'].regUser(schema,function(err,result){
                                if (!err){
                                    if (!result){
                                        callback(err);
                                    }
                                    else {
                                        core.assign("error",result);
                                        callback();
                                    }
                                }
                                else {
                                    callback(err);
                                }
                            });
                        }
                    }
                    else {
                        callback(404);
                    }
                    break;

                case "deleteUser":
                    if (core.is_ajax() && core.csrf()){
                        models['users'].deleteUser(schema,function(err){
                            callback(err);
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;

                default :
                    core.setLayout("admin/layout");
                    core.setTitle("Управление пользователями");
                    callback();
                    break;
            }
        }
    },
    navigation: function(core){
        this.run = function(callback){
            core.addHeadJS("/js/angular-sanitize.js");
            var _do = core.request("do","str");

            // Получим все переменные которые задействованы в данном экшене
            if (core.req.query.access && typeof core.req.query.access == "object"){
                core.req.query.access = core.req.query.access.join(",");
            }

            // Подготавливаем все возможные значения исходя из полей в БД
            var schema = {
                id: core.request("id","int"),
                to: core.request("to","int"),
                title: core.request("title","str"),
                root: core.request('root','str'),
                url: core.request('url','str'),
                access: core.request('access',"str"),
                target: core.request('target',"str"),
                sort: core.request('sort',"bool"),
                enabled: core.request("enabled","int")
            };

            if (!schema.access){
                schema['access'] = '';
            }


            // Обработка запросов форм для модальных окон
            var tpl = core.request('tpl','str');
            if (_do == "getTemplate" && tpl){
                // Если запрос не ajax, то запретим дольнейшее исполнение
                if (!core.is_ajax()){
                    callback(404);
                    return null;
                }
                // Выведем необходимую форму
                switch (tpl){
                    case "editGroup":
                        if (schema.id){
                            models['admin'].getGroup(schema.id,function(err,group){
                                core.assign("csrf",core.csrf_token());
                                core.assign("group",group);
                                core.setTemplate("admin/navigation/editGroup");
                                core.render(true);
                                callback(err);
                            });
                        }
                        else {
                            core.assign("csrf",core.csrf_token());
                            core.setTemplate("admin/navigation/editGroup");
                            core.render(true);
                            callback();
                        }
                        break;

                    case "deleteGroup":
                        core.assign("csrf",core.csrf_token());
                        core.setTemplate("admin/navigation/deleteGroup");
                        core.render(true);
                        callback();
                        break;

                    case "deleteItem":
                        core.assign("csrf",core.csrf_token());
                        core.setTemplate("admin/navigation/deleteItem");
                        core.render(true);
                        callback();
                        break;

                    case "editItem":
                        if (schema.id){
                            models['admin'].getItem(schema.id,function(err,item){
                                if (!err){
                                    if (!item){
                                        callback(404);
                                        return null;
                                    }
                                    models['users'].getUsersGroups(function(err,users_groups){
                                        core.assign("csrf",core.csrf_token());
                                        core.setTemplate("admin/navigation/editItem");
                                        core.assign("item",item);
                                        core.assign("groups",users_groups);
                                        core.render(true);
                                        callback(err);
                                    });
                                }
                                else {
                                    callback(err);
                                }
                            });
                        }
                        else {
                            models['users'].getUsersGroups(function(err,users_groups){
                                core.assign("csrf",core.csrf_token());
                                core.setTemplate("admin/navigation/editItem");
                                core.assign("groups",users_groups);
                                core.render(true);
                                callback(err);
                            });
                        }
                        break;

                    default :
                        callback(404);
                        break;
                }
                return null;
            }

            // Остальной функционал контроллера
            switch (_do){
                case "pushitem":
                    if (!core.is_ajax() || !schema.id || !schema.to){
                        callback(404);
                        return;
                    }
                    var obj = {
                        id: schema.id,
                        to: schema.to,
                        position: "after"
                    };
                    if (!schema.sort){
                        obj.position = "before";
                    }
                    models['admin'].pushItem(obj,function(err,items){
                        core.assign('items', items);
                        callback(err);
                    });
                    break;
                case "getGroups":
                    if (core.is_ajax()){
                        models['admin'].getGroups(function(err,groups){
                            core.assign('groups', groups);
                            callback(err);
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;

                case "getGroup":
                    if(core.is_ajax()){
                        models['admin'].getItems(schema.id,function(err,group){
                            core.assign('group', group);
                            callback(err);
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;

                case "createGroup":

                    if (schema.title && core.is_ajax() && core.csrf()){
                        models['admin'].createGroup(schema,function(err,id){
                            if (!err){
                                models['admin'].getGroups(function(err,groups){
                                    if (!err){
                                        core.assign("id",id);
                                        core.assign("groups",groups);
                                        callback(err);
                                    }
                                    else {
                                        callback(err);
                                    }
                                });
                            }
                            else {
                                callback(err);
                            }
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;

                case "deleteGroup":
                    if (schema.id && core.csrf() && core.is_ajax()){
                        models['admin'].deleteGroup(schema,function(err){
                            if (!err){
                                models['admin'].getGroups(function(err,groups){
                                    core.assign("groups",groups);
                                    callback(err);
                                });
                            }
                            else {
                                callback(err);
                            }
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;

                case "saveGroup":
                    if (core.is_ajax() && core.csrf()){
                        models['admin'].saveGroup(schema,function(err){
                            if(!err){
                                models['admin'].getGroups(function(err,groups){
                                    core.assign("title",schema.title);
                                    core.assign("groups",groups);
                                    callback(err);
                                });
                            }
                            else {
                                callback(err);
                            }
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;

                case "editItem":
                    if (core.is_ajax() && core.csrf()){
                        if (schema.id){
                            models['admin'].saveItem(schema,function(err,root){
                                if (!err){
                                    models['admin'].getItems(root,function(err,group){
                                        core.assign('group', group);
                                        callback(err);
                                    });
                                }
                                else {
                                    callback(err);
                                }
                            });
                        }
                        else {
                            models['admin'].createItem(schema,function(err,root){
                                if (!err){
                                    models['admin'].getItems(root,function(err,group){
                                        core.assign('group', group);
                                        callback(err,"Ошибка при извлечении дерева группы меню");
                                    });
                                }
                                else {
                                    callback(err);
                                }
                            });
                        }
                    }
                    else {
                        callback(404);
                    }
                    break;


                case "deleteItem":
                    if (core.is_ajax() && core.csrf()){
                        models['admin'].deleteItem(schema,function(err){
                            if (!err){
                                models['admin'].getItems(schema.root,function(err,group){
                                    core.assign('group', group);
                                    callback(err);
                                });
                            }
                            else {
                                callback(err);
                            }
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;

                default:
                    core.setLayout("admin/layout");
                    core.setTitle("Управление навигацией");
                    callback();
                    break;

            }
        };
    },
    access: function(core){
        this.run = function(callback){
            core.addHeadJS("/js/angular-sanitize.js");
            if (core.req.query.usergroup && typeof core.req.query.usergroup == "object"){
                core.req.query.usergroup = core.req.query.usergroup.join(",");
            }

            var schema = {
                id: core.request("id","int"),
                usergroup: core.request("usergroup","str")
            };

            if (!schema.usergroup){
                schema['usergroup'] = '';
            }
            var _do = core.request("do","str");

            switch (_do){
                case "getControllers":
                    if (core.is_ajax()){
                        models['admin'].getControllers(function(err,controllers){
                            core.assign("controllers",controllers);
                            callback(err);
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;
                case "editControllerAccess":
                    if (core.is_ajax() && schema.id){
                        models['admin'].getController(schema,function(err,controller){
                            if (!err){
                                models['users'].getUsersGroups(function(err,groups){
                                    core.setTemplate("admin/access/editControllerAccess");
                                    core.assign("csrf",core.csrf_token());
                                    core.assign("groups",groups);
                                    core.assign("controller",controller[0]);
                                    core.render(true);
                                    callback(err);
                                });
                            }
                            else {
                                callback(err);
                            }
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;

                case "saveControllerAccess":
                    if (core.is_ajax() && core.csrf()){
                        if (schema.id){
                            models['admin'].saveControllerAccess(schema,function(err){
                                controller.update(function(){
                                    callback(err);
                                });
                            });
                        }
                        else {
                            callback(404);
                        }
                    }
                    else {
                        callback(404);
                    }
                    break;
                default :
                    core.setLayout("admin/layout");
                    core.setTitle("Управление доступом");
                    callback();
                    break;
            }
        }
    },
    api: function(core){
        this.run = function(callback){
            core.addHeadJS("/js/angular-sanitize.js");
            var _do = core.request("do","str");
            if (core.req.query.usergroup && typeof core.req.query.usergroup == "object"){
                core.req.query.usergroup = core.req.query.usergroup.join(",");
            }

            var schema = {
                id: core.request("id","int"),
                title: core.request("title","str"),
                alias: core.request("alias","str"),
                usergroup: core.request("usergroup","str"),
                ip: core.request("ip","str"),
                enabled: core.request("enabled","int"),
                token: core.request("token","str"),
                api_id: core.request("api_id","int")
            };

            if (!schema.usergroup){
                schema['usergroup'] = '';
            }

            var page = core.request("page","int");
            if (!page){
                page = 1;
            }

            switch (_do){
                case "getApiRouters":
                    if (!core.is_ajax()){
                        callback(404);
                        return;
                    }
                    models['admin'].getApiRouters(page,function(err,routers){
                        core.assign("routers",routers);
                        callback(err);
                    });
                    break;
                case "editApiRouter":
                    if (!core.is_ajax() || !schema.id){
                        callback(404);
                        return;
                    }
                    if (core.request("sdo","int")){
                        if (!core.csrf() || !schema.title){
                            callback(404);
                            return;
                        }
                        if (schema.ip &&  schema.ip.search(/^(([0-9|*]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9|*]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/) == -1){
                            callback(404);
                            return;
                        }
                        if (schema.hasOwnProperty('alias')){
                            delete schema['alias'];
                        }
                        if (!schema.token && schema.hasOwnProperty("token")){
                            delete schema['token'];
                        }
                        models['admin'].saveApiRouter(schema,function(err){
                            bootstrap.update("api");
                            callback(err);
                        });

                    }
                    else {
                        models['users'].getUsersGroups(function(err,groups){
                            if (!err){
                                models['admin'].getApiRouter(schema.id,function(err,router){
                                    if (!router || !router.length){
                                        callback(404);
                                        return;
                                    }
                                    if (router[0].usergroup){
                                        router[0].usergroup = router[0].usergroup.split(",")
                                    }
                                    core.setTemplate("admin/api/edit");
                                    core.assign("groups",groups);
                                    core.assign("router",router[0]);
                                    core.assign("csrf",core.csrf_token());
                                    core.render(true);
                                    callback(err);
                                });
                            }
                            else {
                                callback(err);
                            }
                        });
                    }
                    break;
                case "createApiRouter":
                    if (!core.is_ajax()){
                        callback(404);
                        return;
                    }
                    if (core.request("sdo","int")){
                        if (!core.csrf() || !schema.title || !schema.alias){
                            callback(404);
                            return;
                        }
                        if (schema.ip &&  schema.ip.search(/^(([0-9|*]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9|*]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/) == -1){
                            callback(404);
                            return;
                        }
                        models['admin'].createApiRouter(schema,function(err){
                            bootstrap.update("api");
                            callback(err);
                        });
                    }
                    else {
                        models['users'].getUsersGroups(function(err,groups){
                            core.assign("csrf",core.csrf_token());
                            core.assign("groups",groups);
                            core.setTemplate("admin/api/edit");
                            core.render(true);
                            callback(err);
                        });
                    }
                    break;

                case "deleteApiRouter":
                    if (!core.is_ajax() || !schema.id){
                        callback(404);
                        return;
                    }

                    if (core.request("delete","int")){
                        if (!core.csrf()){
                            callback(404);
                            return;
                        }
                        models['admin'].deleteApiRouter(schema,function(err){
                            bootstrap.update("api");
                            callback(err);
                        });
                    }
                    else {
                        core.setTemplate("admin/api/delete");
                        core.assign("csrf",core.csrf_token());
                        core.assign("id",schema.id);
                        core.render(true);
                        callback();
                    }
                    break;
                default :
                    core.setLayout("admin/layout");
                    callback();
                    break;
            }
        };
    },
    widgets: function(core){
        this.run = function(callback){
            core.addHeadJS("/js/angular-sanitize.js");
            var reqData = {};
            var configData = {};
            if (core.req.query.usergroup && typeof core.req.query.usergroup == "object"){
                core.req.query.usergroup = core.req.query.usergroup.join(",");
            }
            var _do = core.request("do","str");
            var tpl = core.request("tpl","str");

            var schema= {
                id: core.request("id","int"),
                target: core.request("target","str"),
                title: core.request("title","str"),
                description: core.request("description","str"),
                body: core.request("body","str"),
                enabled: core.request("enabled","int"),
                usergroup: core.request("usergroup","str"),
                position: core.request("position","str"),
                sort: core.request("sort","int"),
                url: core.request("url","str"),
                url2: core.request("url2","str"),
                child: core.request("child","str"),
                cache: core.request("cache","int") || 0
            };
            if (!schema.usergroup){
                schema['usergroup'] = '';
            }

            if (_do == "getTemplate" && tpl) {
                // Если запрос не ajax, то запретим дольнейшее исполнение
                if (!core.is_ajax()) {
                    callback(404);
                    return null
                }
                // Выведем необходимую форму
                switch (tpl) {
                    case "deleteWidget":
                        core.setTemplate("admin/widgets/deleteWidget");
                        core.assign("csrf",core.csrf_token());
                        core.render(true);
                        callback();
                        break;
                    case "editWidget":
                        if (schema.id){
                            // Запросим данный виджет
                            models['users'].getUsersGroups(function(err,groups){
                                if (!err){
                                    models['admin'].getWidget(schema,function(err,widget){
                                        if (!err){
                                            if (widget && widget.length){
                                                models['admin'].getConfigWidget(config.websitePath+"/widgets/"+widget[0].name+".json",function(err,conf){
                                                    if (!err){
                                                        models['admin'].getFieldsHTML(conf,widget[0].config,function(err,html){
                                                            if (!err){
                                                                core.setTemplate("admin/widgets/editWidget");
                                                                core.render(true);
                                                                core.assign("csrf",core.csrf_token());
                                                                core.assign("fields",html);
                                                                core.assign("widget",widget[0]);
                                                                core.assign("groups",groups);
                                                                callback(err)
                                                            }
                                                            else {
                                                                callback(err);
                                                            }

                                                        });
                                                    }
                                                    else {
                                                        callback(err);
                                                    }
                                                });
                                            }
                                            else {
                                                callback(404);
                                            }
                                        }
                                        else {
                                            callback(404);
                                        }
                                    });
                                }
                                else {
                                    callback(err);
                                }
                            });
                        }
                        else {
                            callback(404);
                        }
                        break;
                    case  "createWidget":
                        if (schema.id && schema.target && schema.position  && schema.child){
                            models['users'].getUsersGroups(function(err,groups){
                                if (!err){
                                    models['admin'].getParentWidget(schema,function(err,widget){
                                        if (!err){
                                            if (widget && widget.length){
                                                models['admin'].getConfigWidget(config.websitePath+"/widgets/"+widget[0].name+".json",function(err,conf){
                                                    if (!err){
                                                        models['admin'].getFieldsHTML(conf,null,function(err,html){
                                                            if (!err){
                                                                core.setTemplate("admin/widgets/editWidget");
                                                                core.render(true);
                                                                core.assign("csrf",core.csrf_token());
                                                                core.assign("fields",html);
                                                                core.assign("id",schema.id);
                                                                core.assign("target",schema.target);
                                                                core.assign("position",schema.position);
                                                                core.assign("child",schema.child);
                                                                core.assign("groups",groups);

                                                                callback(err)
                                                            }
                                                            else {
                                                                callback(err);
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        callback(err);
                                                    }
                                                });
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
                                else {
                                    callback(err);
                                }
                            });
                        }
                        else {
                            callback(404);
                        }
                        break;
                    default :
                        callback(404);
                        break;
                }
                return null;
            }



            switch (_do){
                case "getWidgets":
                    if (core.is_ajax()) {
                        models['admin'].getWidgets(function (err, widgets) {
                            core.assign("widgets", widgets);
                            callback(err);
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;
                case "getWidgetsBind":

                    if (!schema.target || !core.is_ajax()){
                        callback(404);
                        return null;
                    }
                    models['admin'].getWidgetsBind(schema,function(err,widgets){
                        core.assign("widgets",widgets);
                        callback(err);
                    });
                    break;
                case "getControllers":
                    if (core.is_ajax()){
                        models['admin'].getControllersList(function(err,controllers){
                            core.assign("controllers",controllers);
                            callback(err);
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;
                case "deleteWidget":
                    if(core.csrf() && core.is_ajax()){
                        if (schema.id){
                            models['admin'].deleteWidget(schema,function(err){
                                bootstrap.update("widgets");
                                callback(err);
                            });
                        }
                        else {
                            callback(404);
                        }
                    }
                    else {
                        callback(404);
                    }
                    break;
                case "switchWidget":
                    if (schema.id && core.is_ajax()){
                        models['admin'].switchWidget(schema,function(err){
                            bootstrap.update("widgets");
                            callback(err);
                        });
                    }
                    else {
                        callback(404);
                    }
                    break;


                case "saveWidget":
                    if (!core.csrf() || !core.is_ajax()) {
                        callback(404);
                        return;
                    }
                    if (!schema.id){
                        callback(404);
                        return;
                    }
                    models['admin'].getWidget(schema,function(err,widget){
                        if (!err){
                            if (widget){
                                models['admin'].getConfigWidget(config.websitePath+"/widgets/"+widget[0].name+".json",function(err,cfg){
                                    if (!err){
                                        cfg.forEach(function(item){
                                            configData[item.name] = core.request(item.name,"str");
                                        });

                                        reqData = {
                                            id: schema.id,
                                            title: schema.title,
                                            description: schema.description,
                                            body: schema.body,
                                            enabled: schema.enabled,
                                            usergroup: schema.usergroup,
                                            url: schema.url,
                                            url2: schema.url2,
                                            config:JSON.stringify(configData),
                                            cache: schema.cache
                                        };

                                        models['admin'].updateWidget(reqData,function(err){
                                            bootstrap.update("widgets");
                                            callback(err);
                                        });
                                    }
                                    else {
                                        callback(err)
                                    }
                                });
                            }
                            else {
                                callback(404);
                            }
                        }
                        else {
                            callback(err);
                        }
                    });
                    break;
                case "moveWidgets":
                    if (core.is_ajax()){
                        if (schema.id && schema.target && schema.position && schema.child){
                            models['admin'].moveWidget(schema,function(err,widgets){
                                bootstrap.update("widgets");
                                core.assign("widgets",widgets);
                                callback(err);
                            });
                        }
                        else {
                            callback(404);
                        }
                    }
                    else {
                        callback(404);
                    }
                    break;
                case "sortWidgets":
                    if(core.is_ajax()){
                        if (schema.target && schema.position && schema.child){
                            models['admin'].sortWidgets(schema,function(err,widgets){
                                bootstrap.update("widgets");
                                core.assign("widgets",widgets);
                                callback(err);
                            });
                        }
                        else {
                            callback(404);
                        }
                    }
                    else {
                        callback(404);
                    }
                    break;

                case "createWidget":
                    if (core.csrf() && core.is_ajax()){
                        if (schema.id && schema.target && schema.position && schema.child){
                            models['admin'].getParentWidget(schema,function(err,widget){
                                if (!err){
                                    if (widget && widget.length){
                                        models['admin'].getConfigWidget(config.websitePath+"/widgets/"+widget[0].name+".json",function(err,cfg){
                                            if (!err){
                                                cfg.forEach(function(item){
                                                    configData[item.name] = core.request(item.name,"str");
                                                });
                                                reqData = {
                                                    parent: schema.id,
                                                    title: schema.title,
                                                    target: schema.target,
                                                    position: schema.position,
                                                    description: schema.description,
                                                    body: schema.body,
                                                    enabled: schema.enabled,
                                                    usergroup: schema.usergroup,
                                                    child: schema.child,
                                                    url: schema.url,
                                                    url2: schema.url2,
                                                    config:JSON.stringify(configData),
                                                    cache:schema.cache
                                                };
                                                models['admin'].createWidget(reqData,function(err,data){
                                                    bootstrap.update("widgets");
                                                    core.assign("widgets",data);
                                                    callback(err);
                                                });
                                            }
                                            else {
                                                callback(err);
                                            }
                                        });
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
                        else {
                            callback(404);
                        }
                    }
                    else {
                        callback(404);
                    }
                    break;
                default :
                    fs.readFile(config.websitePath+"/views/"+config.template+"/scheme.ejs",'utf8',function(err,grid){
                        core.addHeadJS("/js/jquery-ui.js");
                        core.setLayout("admin/layout");
                        core.setTitle("Управление виджетами");
                        core.assign("grid",grid);
                        callback(err);
                    });
                    break;
            }
        }
    },
    content: function(core){
        this.run = function(callback){
            core.addHeadJS("/js/angular-sanitize.js");
            var _do = core.request("do","str");
            var page = core.request("page","int");
            if (!page){
                page = 1;
            }

            var schema = {
                id: core.request("id","int"),
                title: core.request("title","str"),
                pagetitle: core.request("pagetitle","str"),
                TreeId:core.request("TreeId","int"),
                slug: core.request("slug","str"),
                content: core.request("content","str"),
                is_pub: core.request("is_pub","int"),
                showtitle: core.request("showtitle","int"),
                showdesc: core.request("showdesc","int"),
                showchild: core.request("showchild","int"),
                seokeys: core.request("seokeys","str"),
                seodesc: core.request("seodesc","str"),
                parent: core.request("parent","int"),
                prepage: core.request("prepage","int"),
                template: core.request("template","str"),
                menu:core.request("menu","int")
            };


            switch (_do){
                case "checkGroup":
                    if (!core.is_ajax() || !schema.slug){
                        callback(404);
                        return;
                    }
                    models['content'].checkGroup(schema.slug,function(err,page){
                        if (!err || err==404){
                            core.assign("page",page);
                            callback();
                        }
                        else {
                            callback(err);
                        }
                    });

                    break;
                case "createGroup":
                    if (!core.is_ajax()){
                        callback(404);
                        return;
                    }
                    if (core.request("create","int")){
                        if (!core.csrf() || !schema.title || !schema.slug){
                            callback(404);
                            return;
                        }
                        models['content'].createGroup(schema,function(err){
                            if (!err){
                                bootstrap.update("alias");
                                if (schema.menu !=0){
                                    models['admin'].createItem({title:schema.title,url:"/"+schema.ctype,root:schema.menu,access:'guest,admin', enabled:1},function(err){
                                        callback(err);
                                    });
                                }
                                else {
                                    callback();
                                }
                            }
                            else{
                                callback(err);
                            }
                        });
                    }
                    else {
                        core.setTemplate("admin/content/editgroup");
                        core.assign("csrf",core.csrf_token());
                        core.render(true);
                        callback();
                    }
                    break;
                case "deleteGroup":
                    if (!core.is_ajax() || !schema.id){
                        callback(404);
                        return;
                    }
                    if (core.request("delete","int")){
                        if (!core.csrf()){
                            callback(404);
                            return;
                        }
                        models['content'].deleteGroup(schema.id,function(err){
                            callback(err);
                        });
                    }
                    else {
                        core.setTemplate("admin/content/deletegroup");
                        core.assign("id",schema.id);
                        core.assign("csrf",core.csrf_token());
                        core.render(true);
                        callback();
                    }
                    break;
                case "editGroup":
                    if (!core.is_ajax() || !schema.id){
                        callback(404);
                        return;
                    }
                    if (core.request("edit","int")){
                        if (!core.csrf()){
                            callback(404);
                            return;
                        }
                        models['content'].saveGroup(schema,function(err){
                            callback(err);
                        });
                    }
                    else {
                        models['content'].getPageFromId(schema.id,function(err,group){
                            if (!err){
                                if (!group || !group.length){
                                    callback(404);
                                    return;
                                }
                                core.setTemplate("admin/content/editgroup");
                                core.assign("group",group[0]);
                                core.assign("csrf",core.csrf_token());
                                core.render(true);
                                callback();
                            }
                            else {
                                callback(err);
                            }
                        });
                    }
                    break;
                case "view_ctypes":
                    if (!core.is_ajax()){
                        callback(404);
                        return;
                    }
                    models['content'].getCtypes(function(err,ctypes){
                        core.assign("ctypes",ctypes);
                        callback(err);
                    });
                    break;
                case "createpage":
                    var iscreate = core.request("create","int");
                    if (!core.is_ajax()){
                        callback(404);
                        return;
                    }
                    if (iscreate){
                        if (core.csrf() && schema.title && schema.slug && schema.TreeId){
                            models["content"].createPage(schema,function(err,url){
                                if (!err){
                                    if (schema.menu && schema.menu !=0){
                                        models['admin'].createItem({title: schema.title, url: url, root: schema.menu,access:'guest,admin', enabled:1},function(err){
                                            callback(err);
                                        });
                                    }
                                    else {
                                        callback();
                                    }
                                }
                                else{
                                    callback(err);
                                }
                            });
                        }
                        else {
                            callback(404);
                        }
                    }
                    else {
                        if (!schema.id){
                            callback(404);
                            return;
                        }
                        models['content'].getAllPages(schema.id,function(err,pages){
                            core.setLayout("admin/layout");
                            core.setTemplate("admin/content/createpage");
                            core.assign("pages",pages);
                            core.assign("csrf",core.csrf_token());
                            core.render(true);
                            callback(err);
                        });
                    }
                    break;
                case "editPage":
                    if (!core.is_ajax() || !schema.id){
                        callback(404);
                        return;
                    }
                    if (core.request("edit","int")){
                        if (!core.csrf() || !schema.title || !schema.slug || !schema.parent){
                            callback(404);
                            return;
                        }
                        models['content'].savePage(schema,function(err){
                            callback(err);
                        });
                    }
                    else{
                        models['content'].getPageFromId(schema.id,function(err,page){
                            if (!err){
                                if (page && page.length){
                                    models['content'].getAllPages(page[0].TreeId,function(err,pages){
                                        if (err){
                                            callback(err);
                                            return;
                                        }
                                        models['content'].getParentPage(schema.id,function(err,parent){
                                            core.setTemplate("admin/content/editpage");
                                            core.assign("page",page[0]);
                                            core.assign("pages",pages);
                                            core.assign("parent",parent);
                                            core.assign("csrf",core.csrf_token());
                                            core.render(true);
                                            callback(err);
                                        });
                                    });
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
                    break;
                case "deletePage":
                    if (!core.is_ajax() || !schema.id){
                        callback(404);
                        return;
                    }
                    var isdelete = core.request("delete","int");
                    if (isdelete){
                        if (!core.csrf()){
                            callback(404);
                            return;
                        }
                        models['content'].deletePage(schema.id,function(err){
                            callback(err);
                        });
                    }
                    else{
                        core.setTemplate("admin/content/deletepage");
                        core.assign("id",schema.id);
                        core.assign("csrf",core.csrf_token());
                        core.render(true);
                        callback();
                    }

                    break;
                case "checkSlug":
                    if (!core.is_ajax() || !schema.slug){
                        callback(404);
                        return;
                    }
                    models['content'].checkSlug(schema.slug,function(err,res){
                        core.assign("result",res);
                        callback(err);
                    });
                    break;
                case "view_pages":
                    if (!core.is_ajax() || !schema.id){
                        callback(404);
                        return;
                    }
                    models['content'].getPages(schema.id,page,function(err,data){
                        core.assign("pages",data.pages);
                        core.assign("page",data.page);
                        core.assign("child",data.child);
                        callback(err);
                    });
                    break;
                default :
                    core.setLayout("admin/layout");
                    core.setTitle("Управление контентом");
                    core.addHeadJS("/system/js/translate.js");
                    callback();
                    break;
            }
        }
    },
    extension: function(core){
        this.run = function(slug,callback){
            core.addHeadJS("/js/angular-sanitize.js");
            if (slug == "index"){
                models['admin'].getExtension(function(err,ext){
                    core.assign("ext",ext);
                    core.setLayout("admin/layout");
                    core.setTitle("Расширения");
                    callback(err);
                });
                return;
            }

            if (extension[slug]){
                models['admin'].getExtension(function(err,ext) {
                    if (!err){
                        core.assign("ext",ext);
                        core.setLayout("admin/layout");
                        extension[slug](core,function(err,obj){
                            if (!err){
                                ejs.renderFile(config.websitePath+"/views/"+config.template+"/admin/extension/"+slug+".ejs",obj,{cache:true},function(err,html){
                                    core.assign("html",html);
                                    callback(err,obj);
                                });
                            }
                            else {
                                callback(err,obj);
                            }
                        });
                    }
                    else {
                        callback(err);
                    }
                });
            }
            else {
                callback(404);
            }
        }
    },
    settings: function(core){
        this.run = function(callback){
            core.addHeadJS("/js/angular-sanitize.js");

            var cfg = {};
            var schema = {
                do: core.request("do","str"),
                config: core.req.query['config']
            };
            if (schema.do == "save"){

                try{
                    cfg = JSON.parse(schema.config);
                }
                catch (err){
                    callback(err);
                    return;
                }
                updateConfig(cfg);
                callback(null,{result:true});
            }
            else if (schema.do == "getconfig"){
                extend(cfg,config);
                delete cfg['smtpPass'];
                delete cfg['dbpass'];
                core.assign("config",cfg);
                callback();
            }
            else {
                fs.readdir(config.websitePath+"/views",function(err,templates){
                    core.setLayout("admin/layout");
                    core.setTitle("Настройки");
                    core.assign("template",config.template);
                    core.assign("csrf",core.csrf_token());
                    core.assign("templates",templates);
                    callback(err);
                });
            }
        }
    }
};



