var db = require("../lib/db");
var  NestedSets = require("../lib/ns");
module.exports = {
    createPage: function(obj,callback){
        // Проверяем slug
        db.query("SELECT * FROM content WHERE slug='"+obj.slug+"'",function(err,res){
            if (!err){
                if (res && !res.length){
                    // Запрашиваем родителя
                    db.query("SELECT * FROM content WHERE id="+obj.TreeId,function(err,parent){
                        if (!err){
                            if (parent && parent.length){
                                obj['ctype'] = parent[0].ctype;
                                obj['date_pub'] = new Date().toISOString();
                                NestedSets.insertNode(obj.TreeId,"content",obj,function(err,res){
                                    callback(err,"/"+obj['ctype']+"/"+obj['slug']);
                                });
                            }
                            else{
                                callback("При создании материала не найден родитель");
                            }
                        }
                        else {
                            callback(err);
                        }
                    });
                }
                else {
                    callback("Ошибка при создании материала, адрес URL уже используется");
                }
            }
            else {
                callback(err);
            }
        });
    },
    // Провелка ссылка на занятость
    checkSlug: function(slug,callback){
        db.query("SELECT * FROM content WHERE slug='"+slug+"'",function(err,res){
            if (!err){
                if (res){
                    callback(err,res);
                }
                else {
                    callback(err);
                }
            }
            else {
                callback(err);
            }
        });
    },
    // Получение типов контента
    getCtypes: function(callback){
        db.query("SELECT * FROM content WHERE NSLevel = 0",function(err,res){
            callback(err,res);
        });
    },
    // Получение страниц для выбранного типа
    getPages: function(id,page,callback){
        if (!page){
            page = 1;
        }
        var obj = {
            page: page,
            table: "content",
            fields: "*",
            order: "NSLeft,sort",
            condition:"TreeId="+id,
            limit: 15
        };
        db.prePage(obj,function(err,res){
            callback(err,res);
        });
    },
    // Получение всех страниц выбранного типа
    getAllPages: function(id,callback){
        db.query("SELECT * FROM content WHERE TreeId="+id+" ORDER BY NSLeft, sort",function(err,pages){
            callback(err,pages);
        });
    },

    // Получение материала
    getContent : function(slug,callback){
        if (slug){
            db.query("SELECT * FROM content WHERE is_pub = 1 AND NSLevel != 0 AND slug='"+slug+"'",function(err,content){
                if (!err){
                    if (content && content.length){
                        callback(null,content[0]);
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
    },
    getPageFromId: function(id,callback){
        db.query("SELECT * FROM content WHERE id="+id,function(err,res){
            callback(err,res);
        });
    },
    getParentPage: function(id,callback){
        NestedSets.getParentInfo(id,"content",function(err,parent){
            callback(err,parent);
        });
    },
    // Получение вложенных материалов
    getContentPages: function(parent,callback){
        var obj = {
            page: parent.page,
            table: "content",
            fields: "*",
            order: "NSLeft,sort",
            condition:"TreeId="+parent.TreeId+" AND NSLevel="+(parent.NSLevel+1)+" AND NSLeft>"+parent.NSLeft+" AND NSRight<"+parent.NSRight,
            limit: 30
        };
        if (parent.prepage){
            obj['limit'] = parent.prepage;
        }
        db.prePage(obj,function(err,res){
            callback(err,res);
        });
    },

    checkGroup: function(name,callback){
        db.query("SELECT * FROM content WHERE ctype='"+name+"' AND NSLevel = 0",function(err,res){
            if (!err){
                if (res && res.length){
                    callback(null,res[0]);
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
    // Получение категории
    getCategory: function(name,callback){
        db.query("SELECT * FROM content WHERE ctype='"+name+"' AND NSLevel = 0 AND is_pub=1",function(err,res){
            if (!err){
                if (res && res.length){
                    callback(null,res[0]);
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

    // Построение пагинации
    getPagination: function(link,data,callback){
        var pagination = "";
        if (data.pages > 1){
            pagination = '<ul class="pagination">';
            if (data.page>1){
                pagination+='<li><a href="'+link+(data.page-1)+'">&larr;</a></li>';
            }
            pagination +='<li><span>'+data.page+' из '+data.pages+'</span></li>';
            if (data.page<data.pages){
                pagination += '<li><a href="'+link+(parseInt(data.page)+1)+'">&rarr;</a></li>';
            }
            pagination+='</ul>';
            callback(pagination);
        }
        else {
            callback(pagination);
        }
    },

    deletePage: function(id,callback){
        NestedSets.deleteAll(id,"content","",function(err){
            callback(err);
        });
    },

    getPathway: function(id,callback){
        NestedSets.parents(id,['title','slug','ctype','NSLevel'],"content","",function(err,pathway){
            callback(err,pathway);
        });
    },
    savePage: function(obj,callback){
        db.query("SELECT * FROM content WHERE id="+obj.id,function(err,page){
            if (!err){
                if (!page || !page.length){
                    callback(404);
                    return;
                }
                obj['TreeId'] = page[0].TreeId;
                db.update("content",obj,"id="+obj.id,function(err){
                    if (err){
                        callback(err);
                        return;
                    }
                    NestedSets.getParentInfo(obj.id,"content",function(err,parent){
                        if (err || !parent){
                            callback(err);
                            return;
                        }
                        if (parent.id != obj.parent){
                            NestedSets.moveAll(obj.id,obj.parent,"content","",function(err){
                                callback(err);
                            });
                        }
                        else {
                            callback(err);
                        }
                    });
                });
            }
            else {
                callback(err);
            }
        });
    },
    createGroup: function(obj,callback){
        db.query("SELECT * FROM content WHERE ctype='"+obj.slug+"' AND NSLevel = 0",function(err,exists){
            if (err){
                callback(err);
                return;
            }
            if (!exists || exists.length){
                callback(404);
                return;
            }
            if (!obj['slug']){
                callback(404);
                return;
            }
            obj['ctype'] = obj['slug'].toLowerCase().trim();
            delete obj.slug;
            if (!obj['ctype'].length){
                callback(404);
                return;
            }
            obj['date_pub'] = new Date().toISOString();
            obj['NSLevel'] = 0;
            obj['NSLeft'] = 1;
            obj['NSRight'] = 2;

            if (obj['ctype'].search(/^[a-z0-9-]+$/) == -1){
                callback(404);
                return;
            }

            db.insert("content",obj,function(err,res){
                if (err){
                    callback(err);
                    return;
                }
                if (!res || !res.insertId){
                    callback(404);
                    return;
                }
                db.update("content",{TreeId:res.insertId},"id="+res.insertId,function(err){
                    if (err){
                        callback(err);
                        db.query("DELETE FROM content WHERE id="+res.insertId,function(){});
                    }
                    else{
                        db.insert("alias",{controller:"content",action:"view",link:"^/"+obj['ctype']+"$"},function(err){
                            if (!err){
                                db.insert("alias",{controller:"content",action:"read",link:"^/"+obj['ctype']+"\\\\/([a-z0-9-]+)$"},function(err){
                                    if (!err){
                                        callback();
                                    }
                                    else {
                                        db.query("DELETE FROM content WHERE id="+res.insertId,function(){});
                                        callback(err);
                                    }
                                });
                            }
                            else {
                                db.query("DELETE FROM content WHERE id="+res.insertId,function(){});
                                callback(err);
                            }
                        });
                    }
                });
            });
        });
    },
    deleteGroup: function(id,callback){
        db.query("SELECT * FROM content WHERE id="+id,function(err,group){
            if (err){
                callback(err);
                return;
            }
            db.query("DELETE FROM alias WHERE link='^/"+group[0].ctype+"$'",function(err){
                if (!err){
                    db.query("DELETE FROM alias WHERE link='^/"+group[0].ctype+"\\\\/([a-z0-9-]+)$'",function(err){
                        if (!err){
                            db.query("DELETE FROM content WHERE TreeId="+id+" OR id="+id,function(err){
                                callback(err);
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
        });
    },
    saveGroup: function(obj,callback){
        // Получаем группу
        db.query("SELECT * FROM content WHERE id="+obj.id,function(err,page){
            if (!err){
                if (page && page.length){
                    obj['TreeId'] = obj.id;
                    obj['ctype'] = obj['slug'].toLowerCase().trim();
                    delete obj['slug'];
                    if (!obj['ctype'].length){
                        callback(404);
                        return;
                    }

                    if (obj['ctype'].search(/^[a-z0-9-]+$/) == -1){
                        callback(404);
                        return;
                    }

                    db.update("content",obj,"id="+obj.id,function(err){
                        if (err){
                            callback(err);
                            return;
                        }

                        if (page[0].ctype != obj.ctype){
                            // Обновим алиас
                            db.update("alias",{link:"^/"+obj['ctype']+"$"},"link='^/"+page[0].ctype+"$'",function(err){
                                if (err){
                                    callback(err);
                                    return;
                                }
                                db.update("alias",{link:"^/"+obj['ctype']+"\\\\/([a-z0-9-]+)$"},"link='^/"+page[0].ctype+"\\\\/([a-z0-9-]+)$'",function(err){
                                    if (err){
                                        callback(err);
                                        return;
                                    }
                                    db.update("content",{ctype:obj['ctype']},"TreeId="+obj.TreeId,function(err){
                                        callback(err);
                                    });
                                });
                            });
                        }
                        else {
                            callback();
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
};

