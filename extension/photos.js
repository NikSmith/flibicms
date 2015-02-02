var config= require("../lib/config").config;
var fs = require("fs");
var db = require("../lib/db");
var upload = require("../models/upload");
var models = require("../lib/model");

module.exports = function(core,callback) {
    var obj = {};

    upload.uploadFile({
        upload_dir:"photos",
        upload_dir_thumbs: "photos/thumbs",
        thumbs: true
    },core.req,function(err,files) {
        var data = {
            _do: core.request("do", "str") || "viewall",
            id: core.request("id", "int"),
            album_id: core.request("album_id", "int"),
            title: core.request("title", "str"),
            description: core.request("description", "str"),
            image: core.request("image", "str"),
            enabled: core.request("enabled", "int"),
            sort: core.request("sort", "int")
        };

        if (files && files.length && data._do != "addphoto"){
            files.forEach(function(item){
                fs.unlink(config.websitePath + '/public'+item.url);
                if (item.thumbnaiUrl){
                    fs.unlink(config.websitePath + '/public'+item.thumbnaiUrl);
                }
            });
        }

        switch (data._do) {
            case "addphoto":
                if (!data.id){
                    callback(404);
                    return;
                }
                if (core.request("sdo","int")){
                    if (!core.csrf()){
                        callback(404);
                        return;
                    }
                    if (!files || !files.length){
                        callback(301, "/admin/extension/photos?do=viewalbum&id=" + data.id);
                        return;
                    }
                    (function savePhoto(x){
                        obj['title'] = core.request("title", "str") || files[x].filename;
                        obj['description'] = data.description;
                        obj['album_id'] = data.id;
                        obj['sort'] = data.sort;
                        obj['enabled'] = 1;
                        obj['image'] = files[x].filename;
                        db.insert("ext_photos", obj, function () {
                            x++;
                            if (x < files.length) {
                                savePhoto(x);
                            }
                            else {
                                callback(301, "/admin/extension/photos?do=viewalbum&id=" + data.id);
                            }
                        })
                    })(0);
                }
                else {
                    data['csrf'] = core.csrf_token();
                    callback(null, data);
                }
                break;
            case "viewall":
                db.query("SELECT * FROM ext_photos WHERE album_id=0", function (err, albums) {
                    if (!err) {
                        data['albums'] = albums.splice(0);
                        core.setTitle("Фотогалерея");
                        callback(null, data);
                    }
                    else {
                        callback(err);
                    }
                });
                break;

            case "createalbum":
                if (core.request("sdo", "int")) {
                    if (!data.title || !core.csrf()) {
                        callback(404);
                        return;
                    }
                    db.insert("ext_photos", data, function (err) {
                        if (!err) {
                            callback(301, "/admin/extension/photos?do=viewall")
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

            case "deletealbum":
                if (core.request("sdo", "int")) {
                    if (!data.id || !core.csrf()) {
                        callback(404);
                        return;
                    }
                    db.query("SELECT image FROM ext_photos WHERE album_id=" + data.id,function(err,photo){
                        if (!err){
                            photo.forEach(function(item){
                                fs.unlink(config.websitePath + "/public/uploads/photos/" + item.image, function (err) {});
                                fs.unlink(config.websitePath + "/public/uploads/photos/thumbs/" + item.image, function (err) {});
                            });
                        }
                    });
                    db.query("DELETE FROM ext_photos WHERE id=" + data.id + " OR album_id=" + data.id, function (err) {
                        if (!err) {
                            callback(301, "/admin/extension/photos?do=viewall");
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

            case "editalbum":
                if (core.request("sdo", "int")) {
                    if (!data.id || !data.title || !core.csrf()) {
                        callback(404);
                        return;
                    }
                    db.update("ext_photos", data, "id=" + data.id, function (err) {
                        if (!err) {
                            callback(301, "/admin/extension/photos?do=viewall")
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
                    db.query("SELECT * FROM ext_photos WHERE id=" + data.id, function (err, album) {
                        if (!err) {
                            if (album && album.length) {
                                data['csrf'] = core.csrf_token();
                                data['album'] = album[0];
                                callback(null, data);
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

            case "viewalbum":
                if (!data.id) {
                    callback(404);
                    return;
                }
                var page = core.request("page","int");
                if (!page){
                    page=1
                }
                if (page<=0){
                    callback(404);
                    return
                }
                db.prePage({
                    page:page,
                    table: "ext_photos",
                    fields: "*",
                    order:"sort",
                    condition: "album_id="+data.id,
                    limit:15
                },function(err,photos){
                    if (!err) {

                        models['content'].getPagination("/admin/extension/photos?do=viewalbum&id=42&page=",photos,function(html){
                            data['pages'] = photos.pages;
                            data['page'] = photos.page;
                            data['pagination'] = html;
                            data['photos'] = photos.child.splice(0);
                            callback(null, data);
                        })
                    }
                    else {
                        callback(err);
                    }
                });
                break;

            case "editphoto":
                if (!data.id) {
                    callback(404);
                    return;
                }
                if (core.request("sdo", "int")) {
                    if (!core.csrf()){
                        callback(404);
                        return;
                    }
                    db.query("SELECT * FROM ext_photos WHERE id=" + data.id, function (err, photo) {
                        if (!err) {
                            if (photo && photo.length) {
                                if (!data.title) {
                                    callback(301, "/admin/extension/photos?do=viewalbum&id=" + photo[0].album_id);
                                    return;
                                }
                                obj['title'] = data.title;
                                obj['sort'] = data.sort;
                                obj['description'] = data.description;
                                db.update("ext_photos", obj, "id=" + data.id, function (err) {
                                    if (!err) {
                                        callback(301, "/admin/extension/photos?do=viewalbum&id=" + photo[0].album_id);
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
                    db.query("SELECT * FROM ext_photos WHERE id=" + data.id, function (err, photo) {
                        if (!err) {
                            if (photo && photo.length) {
                                data['photo'] = photo[0];
                                data['csrf'] = core.csrf_token();
                                callback(null, data);
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
            case "deletephoto":
                if (core.request("sdo", "int")) {
                    if (!data.id || !core.csrf()) {
                        callback(404);
                        return;
                    }
                    db.query("SELECT * FROM ext_photos WHERE id=" + data.id, function (err, photo) {
                        if (!err) {
                            if (photo.length) {
                                fs.unlink(config.websitePath + "/public/uploads/photos/" + photo[0].image, function (err) {});
                                fs.unlink(config.websitePath + "/public/uploads/photos/thumbs/" + photo[0].image, function (err) {});
                            }
                            db.query("DELETE FROM ext_photos WHERE id=" + data.id, function (err) {
                                if (!err) {
                                    callback(301, "/admin/extension/photos?do=viewalbum&id=" + photo[0].album_id)
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
        }
    });
};