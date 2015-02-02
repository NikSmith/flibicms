var config =  require("../lib/config").config;
var models = require("../lib/model");
module.exports = {
    index : function(core){
        this.run = function(callback){
            core.setTitle(config.title);
            core.setMetaKeywords(config.seokeys);
            core.setMetaDesc(config.seodesc);
            callback();
        };

    },

    // Просмотр списка
    view: function(core){
        this.run = function(callback){
            var ctype;
            var page = core.request("page","int");
            if (!page){
                page = 1;
            }
            if (page == 0){
                callback(404);
                return;
            }
            var params = core.url().match(new RegExp ("^/([a-z0-9-]+)","i"));
            var title ="";
            if (params && params.length){
                ctype = params[0].substr(1,params[0].length);
                models['content'].getCategory(ctype,function(err,cat){
                    if (!err){
                        models['content'].getPathway(cat.id,function(err,pathway){
                            core.req.session.pathwayPages = pathway;
                            core.req.session.pathwayPrelink = "/"+ctype;
                        });
                        cat['page'] = page;
                        if (cat){
                            if (cat.showchild){
                                models['content'].getContentPages(cat,function(err,res){
                                    var link = "/"+ctype+"?page=";
                                    if (!err){
                                        if (res.page != 1 && res.page > res.pages){
                                            callback(404);
                                            return;
                                        }
                                        models['content'].getPagination(link,res,function(pagination){
                                            if (cat.template){
                                                core.setTemplate("content/"+cat.template);
                                            }
                                            title = cat.pagetitle?cat.pagetitle:cat.title;
                                            title+= page>1?" - Страница "+page:"";
                                            core.setTitle(title);
                                            core.setMetaDesc(cat.seokeys);
                                            core.setMetaKeywords(cat.seodesc);
                                            core.assign("title",cat.title);
                                            core.assign("showtitle",cat.showtitle);
                                            core.assign("showdesc",cat.showdesc);
                                            core.assign("content",cat.content);
                                            core.assign("pages",res.child);
                                            core.assign("pagination",pagination);
                                            callback();
                                        });
                                    }
                                    else {
                                        callback(err);
                                    }
                                });
                            }
                            else {
                                if (cat.template){
                                    core.setTemplate("content/"+cat.template);
                                }
                                title = cat.pagetitle?cat.pagetitle:cat.title;
                                title+= page>1?" - Страница "+page:"";
                                core.setTitle(title);
                                core.setMetaDesc(cat.seokeys);
                                core.setMetaKeywords(cat.seodesc);
                                core.assign("title",cat.title);
                                core.assign("showtitle",cat.showtitle);
                                core.assign("showdesc",cat.showdesc);
                                core.assign("content",cat.content);
                                callback();
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
            }
            else {
                callback(404);
            }
        }
    },

    // Просмотр страницы
    read: function(core){
        this.run = function(slug,callback){

            var ctype;
            var page = core.request("page","int");
            var params = core.url().match(new RegExp ("^/([a-z0-9-]+)","i"));
            if (params){
                ctype = params[0].substr(1,params[0].length);
            }

            if (!page){
                page = 1;
            }
            if (page == 0){
                callback(404);
                return;
            }
            // Фильтрация
            if (slug.search("^[a-z0-9-]+$") == -1 || ctype.search("^[a-z0-9-]+$") == -1){
                callback(404);
                return null;
            }

            models['content'].getContent(slug,function(err,data){

                if (!err){
                    if (data.ctype != ctype){
                        callback(404);
                        return;
                    }

                    models['content'].getPathway(data.id,function(err,pathway){
                        core.req.session.pathwayPages = pathway;
                        core.req.session.pathwayPrelink = "/"+ctype;
                    });
                    if (data.showchild){
                        data['page'] = page;

                        models['content'].getContentPages(data,function(err,res) {

                            var link = "/" + ctype +"/"+slug+ "?page=";
                            if (!err) {
                                if (res.page != 1 && res.page > res.pages){
                                    callback(404);
                                    return;
                                }
                                models['content'].getPagination(link, res, function (pagination) {
                                    if (data.template){
                                        core.setTemplate("content/"+data.template);
                                    }
                                    core.setTitle(data.pagetitle?data.pagetitle:data.title);
                                    core.setMetaDesc(data.seokeys);
                                    core.setMetaKeywords(data.seodesc);
                                    core.assign("title",data.title);
                                    core.assign("showtitle",data.showtitle);
                                    core.assign("showdesc",data.showdesc);
                                    core.assign("content",data.content);
                                    core.assign("pages",res.child);
                                    core.assign("pagination",pagination);
                                    core.assign("ctype",ctype);
                                    callback();
                                });
                            }
                            else {
                                callback(err);
                            }
                        });
                    }
                    else {
                        if (data.template){
                            core.setTemplate("content/"+data.template);
                        }
                        core.setTitle(data.pagetitle?data.pagetitle:data.title);
                        core.setMetaDesc(data.seokeys);
                        core.setMetaKeywords(data.seodesc);
                        core.assign("title",data.title);
                        core.assign("showtitle",data.showtitle);
                        core.assign("showdesc",data.showdesc);
                        core.assign("content",data.content);
                        core.assign("ctype",ctype);
                        callback();
                    }
                }
                else {
                    callback(err);
                }
            });
        }
    }
};
