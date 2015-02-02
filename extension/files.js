var config= require("../lib/config").config;
var fs = require("fs");
var db = require("../lib/db");
var models = require("../lib/model");
module.exports = function(core,callback) {
    models['upload'].uploadFile({
        upload_dir:"files",
        thumbs: false
    },core.req,function(err,files){
        var page = core.request("page","int");
        var data = {
            _do: core.request("do", "str") || "viewall",
            id: core.request("id", "int"),
            title: core.request("title", "str"),
            link: core.request("link", "str")
        };

        if (files && files.length && data._do != "upload"){
            files.forEach(function(item){
                fs.unlink(config.websitePath + '/public'+item.url);
            });
        }

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
                    table: "ext_files",
                    fields: "*",
                    order:"id",
                    condition: "1=1",
                    limit:10
                },function(err,files){
                    if (!err) {
                        models['content'].getPagination("/admin/extension/files?do=viewall&page=",files,function(html){
                            core.setTitle("Файлы для скачивания");
                            data['pages'] = files.pages;
                            data['page'] = files.page;
                            data['pagination'] = html;
                            data['files'] = files.child.splice(0);
                            callback(null, data);
                        })
                    }
                    else {
                        callback(err);
                    }
                });
                break;
            case "upload":
                if (files){
                    if (!core.csrf()){
                        callback(404);
                        return;
                    }

                    if (files.length){
                        (function saveFile(x){
                            var obj = {
                                link:"/api/files?get="+files[x].filename,
                                title:core.request("title", "str") || files[x].filename,
                                file:files[x].filename
                            };
                            db.insert("ext_files",obj,function(){
                                x++;
                                if (x<files.length){
                                    saveFile(x);
                                }
                                else {
                                    callback(301,"/admin/extension/files");
                                }
                            });
                        })(0);
                    }
                    else {
                        callback(301,"/admin/extension/files");
                    }
                }
                else {
                    core.setTitle("Загрузка нового файла");
                    data['maxAllFilesSize'] = config.maxAllFilesSize;
                    data['maxUploadFileSize'] = config.maxUploadFileSize;
                    data['csrf'] = core.csrf_token();
                    callback(null, data);
                }
                break;
            case "deletefile":
                if (core.request("sdo", "int")) {
                    if (!data.id || !core.csrf()) {
                        callback(404);
                        return;
                    }
                    db.query("SELECT file FROM ext_files WHERE id=" + data.id,function(err,file){
                        if (!err){
                            if (file && file.length){
                                fs.unlink(config.websitePath + "/public/uploads/files/" + file[0].file, function (err) {});
                            }
                        }
                    });
                    db.query("DELETE FROM ext_files WHERE id=" + data.id, function (err) {
                        if (!err) {
                            callback(301, "/admin/extension/files?do=viewall");
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
            default :
                callback(404);
                break
        }
    });

};