var db = require("../lib/db");
var  NestedSets = require("../lib/ns");
var fs = require("fs");
var async = require("async");

module.exports = {
    // Получение всех доступных групп
    getGroups: function (callback) {
        db.query("SELECT * FROM menu WHERE NSLevel = 0",function(err,groups){
            callback(err,groups);
        });
    },
    // Получение группы по id
    getGroup: function (id,callback) {
        db.query("SELECT * FROM menu WHERE id="+id,function(err,group){
            if (!err){
                if (group.length){
                    callback(err,group[0]);
                }
                else {
                    callback("Группа с таким id не найдена");
                }
            }
            else {
                callback(err);
            }

        });
    },
    // Создание группы
    createGroup: function(schema,callback){
        db.insert("menu",{title:schema.title,NSLeft:1,NSRight:2,enabled:1},function(err,res){
            if (!err){
                db.update("menu",{TreeId:res.insertId},"id="+res.insertId,function(err){
                    callback(err,res.insertId);
                });
            }
            else {
                callback(err);
            }
        });
    },
    // Удаление группы и всех вложенных пунктов
    deleteGroup: function(schema,callback){
        db.query("DELETE FROM menu WHERE id="+schema.id,function(err){
            if (!err){
                db.query("DELETE FROM menu WHERE TreeId="+schema.id,function(err){
                    callback(err);
                });
            }
            else {
                callback(err);
            }
        });
    },
    // Сохранение группы
    saveGroup: function(schema,callback){
        if (schema.id && schema.title){
            db.query("UPDATE menu SET title='"+schema.title+"' WHERE id="+schema.id,function(err){
                callback(err);
            });
        }
        else {
            callback("Не переданы парамметры для сохранения группы");
        }
    },
    // Созданиепункта меню
    createItem: function(obj,callback){
        if (!obj.title || !obj.url || !obj.root){
            callback("No params for createItem");
            return null;
        }
        NestedSets.insertNode(obj.root,"menu",obj,function(err,res){
            if (!err){
                if (res && res.insertId){
                    db.query("SELECT TreeId FROM menu WHERE id="+res.insertId,function(err,root){
                        if (!err){
                            if (root && root.length){
                                callback(null,root[0].TreeId);
                            }
                            else {
                                callback("Не удалось получить созданный пункт меню")
                            }
                        }
                        else {
                            callback(err);
                        }
                    });
                }
                else {
                    callback("Ошибка при создании пункта меню 001");
                }
            }
            else {
                callback(err);
            }
        });
    },
    saveItem: function(schema,callback){
        var objToSave = {
            title: schema.title,
            url: schema.url,
            access: schema.access,
            enabled: schema.enabled,
            target: schema.target,
            sort:schema.sort
        };
        if (!schema.title || !schema.url || !schema.root){
            callback("Params is null for saveItem");
            return null;
        }

        this.getItem(schema.id,function(err,item){

            if (!err){
                if (item){
                    NestedSets.getParentInfo(item.id,"menu",function(err,parent){
                        if (!err){
                            if (parent){
                                // Сперва обновим основные данные о разделе
                                db.update("menu",objToSave,"id="+schema.id,function(err){
                                    if (!err){
                                        if (parent.id != schema.root){
                                            NestedSets.moveAll(item.id,schema.root,"menu","",function(err){
                                                callback(err,item.TreeId);
                                            });
                                        }
                                        else {
                                            callback(err,item.TreeId)
                                        }
                                    }
                                    else {
                                        callback(err);
                                    }
                                });
                            }
                            else {
                                callback("У пункта меню не найден родитель");
                            }
                        }
                        else {
                            callback(err);
                        }
                    });
                }
                else {
                    callback("Изменяемый пункт меню не найден");
                }
            }
            else {
                callback(err);
            }
        });
    },
    deleteItem: function(obj, callback) {
        if (obj.id) {
            NestedSets.deleteAll(obj.id, "menu","", function (err) {
                callback(err);
            });
        }
        else {
            callback("Не передан id элемента меню для удаления");
        }
    },
    // Перемещение элемента
    pushItem: function(obj,cb){
        NestedSets.changePositionAll(obj.id, obj.to,  obj.position, "menu",null,function(err,result){
            cb(err,result);
        });
    },
    // Получение элементов группы меню
    getItems: function(id,callback){
        db.query("SELECT * FROM menu WHERE TreeId="+id+" ORDER BY NSLeft",function(err,items){
            callback(err,items);
        });
    },
    getItem: function(id,callback){
        db.query("SELECT * FROM menu WHERE id="+id,function(err,data){
            if (!err){
                if (data.length){
                    callback(null,data[0]);
                }
                else {
                    callback(null,null);
                }
            }
            else{
                callback(err);
            }
        });
    },

    getController: function(schema,callback){
        db.query("SELECT * FROM controllers WHERE id="+schema.id,function(err,controller){
            callback(err,controller);
        });
    },
    getControllers:function(callback){
        db.query("SELECT * FROM controllers ORDER BY c_title,a_title ASC",function(err,controllers){
            callback(err,controllers);
        });
    },
    saveControllerAccess:function(schema,callback){
        db.update("controllers",schema,"id="+schema.id,function(err){
            callback(err);
        });
    },

    getControllersList:function(callback){
        db.query("SELECT * FROM controllers WHERE target NOT LIKE 'admin%' ORDER BY c_title,a_title ASC",function(err,controllers){
            callback(err,controllers);
        });
    },
    getWidgets: function(callback){
        db.query("SELECT * FROM widgets",function(err,widgets){
            callback(err,widgets);
        });
    },
    getWidgetsBind: function(schema,callback){
        db.query("SELECT * FROM widgets_bind WHERE target='"+schema.target+"' ORDER BY sort ASC",function(err,res){
            callback(err,res);
        });
    },
    switchWidget: function(schema,callback){
        db.query("UPDATE widgets_bind SET enabled = !enabled WHERE id="+schema.id,function(err){
            callback(err);
        });
    },
    deleteWidget: function(schema,callback){
        db.query("DELETE FROM widgets_bind WHERE id="+schema.id,function(err){
            callback(err);
        });
    },
    getParentWidget: function(schema,callback){
        db.query("SELECT * FROM widgets WHERE id="+schema.id,function(err,widget){
            callback(err,widget);
        });
    },
    getWidget: function(schema,callback){
        db.query("SELECT wb.*,w.name FROM widgets_bind wb LEFT JOIN widgets w ON w.id = wb.parent WHERE wb.id="+schema.id,function(err,widget){
            callback(err,widget);
        });
    },
    getConfigWidget: function(file,callback){
        var conf = {};

        fs.exists(file, function (exists) {

            if (exists){
                fs.readFile(file,'utf8',function(err,data){
                    if (!err){
                        if (data){
                            try{
                                conf = JSON.parse(data);
                                callback(err,conf);
                            }
                            catch (e){
                                callback(e);
                            }
                        }
                        else {
                            callback(null,null)
                        }
                    }
                    else {
                        callback(err);
                    }
                });
            }
            else {
                callback(null,[]);
            }
        });
    },
    getFieldsHTML: function(obj,cfg,callback){
        var html = "";
        try{
            if (cfg){
                cfg = JSON.parse(cfg);
            }
        }
        catch (err){
            callback(err);
            return null;
        }

        function getDataForField(str,callback){
            if (typeof str != "string"){
                callback();
                return;
            }
            var param = str.split("#");
            if (param.length != 4){
                callback();
                return;
            }
            db.query("SELECT "+param[1]+" as value,"+param[2]+" as title FROM "+param[0]+" WHERE "+param[3],function(err,data){
                if (!err){
                    callback(data);
                }
                else {
                    callback();
                }
            });
        }

        if (obj && typeof obj == "object"){

            async.map(
                obj,
                function(item,next){
                    if (item.tag == "textarea"){
                        html+="<label>"+item.desc+"<textarea name='"+item.name+"' class='"+item.class+"' style='"+item.style+"'>";
                        if (cfg && cfg[item.name]){
                            html+=cfg[item.name];
                        }
                        html+="</textarea></label>";
                        next(null);
                    }
                    else if (item.tag == "input"){
                        if (item.type == "text"){
                            html+="<label>"+item.desc+"<input type='"+item.type+"' class='"+item.class+"' style='"+item.style+"' name='"+item.name+"' value='";
                            if (cfg && cfg[item.name]){
                                html+=cfg[item.name];
                            }
                            html+="'/></label>";
                        }
                        else if (item.type == "checkbox" || item.type == "radio"){
                            html+="<label>"+item.desc+"<ul class='"+item.class+"'>";
                            for (var x = 0; x<item.data.length; x++){
                                html+='<li><input type="'+item.type+'" name="';
                                if (item.type == "checkbox"){
                                    html+=item.data[x].name+'"';
                                }
                                else {
                                    html+=item.name+'" value="'+item.data[x].value+'"';
                                }
                                html+=' id="'+item.data[x].name+'-'+x+'"><label for="'+item.data[x].name+'-'+x+'">'+item.data[x].title+'</label></li>';
                            }
                            html+="</ul></label>";

                        }
                        next(null);
                    }
                    else if (item.tag == "select"){
                        getDataForField(item.data,function(data){
                            if (data){
                                item.data = data;
                            }
                            html+="<label>"+item.desc+"<select class='"+item.class+"' style='"+item.style+"' ";

                            if (item.type == "multiple"){
                                html+="multiple";
                            }
                            html+=" name='"+item.name+"'>";
                            for (var i=0; i<item.data.length;i++){
                                html+="<option value='"+item.data[i].value+"'";
                                    if (cfg && cfg[item.name] && cfg[item.name] == item.data[i].value){
                                        html+=" selected ";
                                    }

                                html+=">"+item.data[i].title+"</option>";
                            }

                            html+="</select></label>";
                            next(null);
                        });
                    }
                    else if (item.tag == "submit"){
                        html+="<p><input type='submit' value='"+item.desc+"' class='"+item.class+"' style='"+item.style+"'/></p>";
                        next(null);
                    }
                    else if (item.tag == "html"){
                        html+=item.desc;
                        next(null);
                    }
                    else {
                        next(null);
                    }
                },
                function(err){
                    callback(err,html)
                });
        }
        else {
            callback("Не верны формат данных настроек виджета");
        }
    },
    updateWidget: function(obj,callback){
        db.update("widgets_bind",obj,"id="+obj.id,function(err){
            callback(err);
        });
    },
    moveWidget: function(obj,callback){
        obj.child = obj.child.split(",");
        db.query("UPDATE widgets_bind SET position='"+obj.position+"' WHERE id="+obj.id,function(err){
            if (!err){
                async.map(obj.child,
                function(it,next){
                    db.update("widgets_bind",{sort:obj.child.indexOf(it)},"id="+it,function(err){
                        next(err);
                    });
                },
                function(err){
                    if (!err){
                        db.query("SELECT * FROM widgets_bind WHERE target='"+obj.target+"' ORDER BY sort ASC",function(err,widget){
                            callback(err,widget);
                        });
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
    },
    sortWidgets: function(schema,callback){
        var obj = schema.child.split(",");
        async.map(obj,
            function(it,next){
                db.update("widgets_bind",{sort:obj.indexOf(it)},"id="+it,function(err){
                    next(err);
                });
            },
            function(err){
                if (!err){
                    db.query("SELECT * FROM widgets_bind WHERE target = '"+schema.target+"' ORDER BY sort ASC",function(err,data){
                        callback(err,data)
                    });
                }
                else {
                    callback(err);
                }
            }
        );
    },
    createWidget: function(obj,callback){
        obj.child = obj.child.split(",");
        var ind;
        db.insert("widgets_bind",obj,function(err,result){
            if (!err){
                if(result && result.insertId){
                    ind = obj.child.indexOf(obj.parent);
                    if (ind >=0){
                        async.map(obj.child,
                        function(it,next){
                            db.update("widgets_bind",{sort:obj.child.indexOf(it)},"id="+it,function(err){
                                next(err);
                            });
                        },
                        function(err){
                            if (!err){
                                db.query("SELECT * FROM widgets_bind WHERE target='"+obj.target+"' ORDER BY sort",function(err,widgets){
                                    callback(err,widgets);
                                });
                            }
                            else {
                                callback(err);
                            }
                        });
                    }
                    else {
                        callback(404)
                    }

                }
                else {
                    callback(404);
                }
            }
            else {
                callback(err);
            }
        });
    },
    getExtension: function(callback){
        db.query("SELECT * FROM extension",function(err,ext){
            callback(err,ext);
        });
    },
    getApiRouters: function(page,callback){
        var obj = {
            page: page,
            table: "api",
            fields: "id,title,alias,usergroup,ip,enabled",
            order:"id",
            limit: "10",
            condition:"1=1"
        };
        db.prePage(obj,function(err,routers){
            callback(err,routers);
        });
    },
    createApiRouter: function(obj,callback){
        db.insert("api",obj,callback)
    },
    deleteApiRouter: function(obj,callback){
        db.query("DELETE FROM api WHERE id="+obj.id,callback);
    },
    getApiRouter: function(id,callback){
        db.query("SELECT id,title,alias,usergroup,ip,enabled FROM api WHERE id="+id,callback);
    },
    saveApiRouter: function(obj,callback){
        db.update("api",obj,"id="+obj.id,callback);
    }
};




