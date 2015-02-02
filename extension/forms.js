var config= require("../lib/config").config;
var fs = require("fs");
var db = require("../lib/db");
var models = require("../lib/model");
module.exports = function(core,callback) {
    var data = {
        _do: core.request("do","str") || "viewall",
        id: core.request("id","int"),
        title: core.request("title","str"),
        method: core.request("method","str"),
        class: core.request("class","str"),
        style: core.request("style","str"),
        email: core.request("email","str"),
        action: core.request("action","str"),
        fields: core.request("fields","str"),
        yacode: core.request("yacode","str"),
        yatarget: core.request("yatarget","str")
    };

    var page = core.request("page","int");

    switch (data._do){
        case "viewall":
            if (!page){
                page=1
            }
            if (page<=0){
                callback(404);
                return
            }
            db.prePage({
                page:page,
                table: "ext_forms",
                fields: "*",
                order:"id",
                condition: "1=1",
                limit:10
            },function(err,forms){
                if (!err) {
                    models['content'].getPagination("/admin/extension/forms?do=viewall&page=",forms,function(html){
                        core.setTitle("Конструктор форм");
                        data['pages'] = forms.pages;
                        data['page'] = forms.page;
                        data['pagination'] = html;
                        data['forms'] = forms.child.splice(0);
                        callback(null, data);
                    })
                }
                else {
                    callback(err);
                }
            });
            break;
        case "deleteform":
            if (core.request("sdo", "int")) {
                if (!data.id || !core.csrf()) {
                    callback(404);
                    return;
                }
                db.query("DELETE FROM ext_forms WHERE id=" + data.id, function (err) {
                    if (!err) {
                        callback(301, "/admin/extension/forms?do=viewall");
                    }
                    else {
                        callback(err);
                    }
                });
            }
            else {
                if (!core.is_ajax()) {
                    callback(404);
                    return;
                }
                data['csrf'] = core.csrf_token();
                callback(null, data);
            }
            break;
        case "createform":
            if (core.request("sdo", "int")) {
                if (!core.csrf()) {
                    callback(404);
                    return;
                }
                db.insert("ext_forms",data,function(err){
                    if (err){
                        callback(err);
                    }
                    else {
                        callback(301, "/admin/extension/forms?do=viewall");
                    }
                });
            }
            else {
                if (!core.is_ajax()) {
                    callback(404);
                    return;
                }
                data['csrf'] = core.csrf_token();
                callback(null, data);
            }
            break;
        case "editform":
            if (core.request("sdo", "int")) {
                if (!core.csrf() || !data.id) {
                    callback(404);
                    return;
                }
                if (data.hasOwnProperty("fields")){
                    delete data['fields'];
                }
                db.update("ext_forms",data,"id="+data.id,function(err){
                    if (err){
                        callback(err);
                    }
                    else {
                        callback(301, "/admin/extension/forms?do=viewall");
                    }
                });
            }
            else {
                if (!core.is_ajax()) {
                    callback(404);
                    return;
                }
                db.query("SELECT * FROM ext_forms WHERE id="+data.id,function(err,form){
                    if (!form || !form.length){
                        callback(404);
                        return;
                    }
                    data['csrf'] = core.csrf_token();
                    data['form'] = form[0];
                    callback(err, data);
                });

            }
            break;
        case "editfields":
            if (!data.id){
                callback(404);
                return;
            }
            if (core.request("sdo","int")){
                if (data.hasOwnProperty('title')){
                    delete data['title'];
                }
                if (data.hasOwnProperty('method')){
                    delete data['method'];
                }
                if (data.hasOwnProperty('class')){
                    delete data['class'];
                }
                if (data.hasOwnProperty('style')){
                    delete data['style'];
                }
                if (data.hasOwnProperty('action')){
                    delete data['action'];
                }
                if (data.hasOwnProperty("email")){
                    delete data['email'];
                }
                db.update("ext_forms",data,"id="+data.id,function(err){
                    if (err){
                        callback(err);
                    }
                    else {
                        callback(301, "/admin/extension/forms?do=viewall");
                    }
                });
            }
            else {
                db.query("SELECT * FROM ext_forms WHERE id="+data.id,function(err,form){
                    if (form && !form[0].fields){
                        form[0].fields = JSON.stringify([]);
                    }
                    data['csrf'] = core.csrf_token();
                    data['form'] = form;
                    callback(err, data);
                });
            }
            break;
        default :
            callback(404);
            break;
    }
};