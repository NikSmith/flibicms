var config= require("../lib/config").config;
var fs = require("fs");
var db = require("../lib/db");

module.exports = function(core,callback) {
    var data = {
        _do: core.request("do", "str") || "viewall",
        id: core.request("id", "int"),
        sort: core.request("sort", "int"),
        title: core.request("title", "str"),
        content: core.request("content", "str"),
        background: core.request("image", "str"),
        repeat: core.request("repeat", "str"),
        height: core.request("height", "str"),
        width: core.request("width", "str"),
        animation: core.request("animation", "str"),
        playspeed: core.request("playspeed", "int"),
        pagination: core.request("pagination", "int"),
        navigation: core.request("navigation", "int")
    };
    if (data.playspeed) {
        data.playspeed = data.playspeed * 1000
    }
    var obj = {};
    switch (data._do) {
        case "viewall":
            db.query("SELECT * FROM ext_slider WHERE type=0", function (err, sliders) {
                if (!err) {
                    data['sliders'] = sliders.splice(0);
                    core.setTitle("Слайдер");
                    callback(null, data);
                }
                else {
                    callback(err);
                }
            });
            break;
        case "viewslider":
            if (!data.id) {
                callback(404);
                return;
            }
            db.query("SELECT * FROM ext_slider WHERE type != 0 AND slider_id=" + data.id + " ORDER BY sort", function (err, slides) {
                if (!err) {
                    data['slides'] = slides.splice(0);
                    callback(null, data);
                }
                else {
                    callback(err);
                }
            });
            break;

        case "deleteslider":
            if (core.request("sdo", "int")) {
                if (!data.id || !core.csrf()) {
                    callback(404);
                    return;
                }
                db.query("DELETE FROM ext_slider WHERE id=" + data.id + " OR slider_id=" + data.id, function (err) {

                    if (!err) {
                        callback(301, "/admin/extension/slider?do=viewall");
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

        case "createslider":
            if (core.request("sdo", "int")) {
                if (!data.title || !core.csrf()) {
                    callback(404);
                    return;
                }
                db.insert("ext_slider", data, function (err) {
                    if (!err) {
                        callback(301, "/admin/extension/slider?do=viewall")
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

        case "editslider":
            if (core.request("sdo", "int")) {
                if (!data.id || !data.title || !core.csrf()) {
                    callback(404);
                    return;
                }
                db.update("ext_slider", data, "id=" + data.id, function (err) {
                    if (!err) {
                        callback(301, "/admin/extension/slider?do=viewall")
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
                db.query("SELECT * FROM ext_slider WHERE id=" + data.id, function (err, slider) {
                    if (!err) {
                        if (slider && slider.length) {
                            data['csrf'] = core.csrf_token();
                            data['slider'] = slider[0];
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
        case "createslide":
            if (!data.id) {
                callback(404);
                return;
            }
            if (core.request("sdo", "int")) {
                if (!data.title) {
                    callback(301, "/admin/extension/slider?do=viewslider&id=" + data.id)
                }
                else {
                    obj['title'] = data.title;
                    obj['slider_id'] = data.id;
                    obj['sort'] = data.sort;
                    obj['type'] = 1;
                    obj['content'] = data.content;
                    obj['background'] = data.background;
                    obj['width'] = data.width;
                    obj['height'] = data.height;
                    obj['repeat'] = data.repeat;
                    db.insert("ext_slider", obj, function () {
                    });
                    callback(301, "/admin/extension/slider?do=viewslider&id=" + data.id)
                }
            }
            else {
                data['csrf'] = core.csrf_token();
                callback(null, data);
            }
            break;

        case "editslide":
            var cfg = {};
            if (!data.id) {
                callback(404);
                return;
            }
            if (core.request("sdo", "int")) {
                db.query("SELECT * FROM ext_slider WHERE id=" + data.id, function (err, slide) {
                    if (!err) {
                        if (slide && slide.length) {
                            if (!data.title) {
                                callback(301, "/admin/extension/slider?do=viewslider&id=" + slide[0].slider_id);
                                return;
                            }
                            obj['title'] = data.title;
                            obj['sort'] = data.sort;
                            obj['type'] = 1;
                            obj['content'] = data.content;
                            obj['background'] = data.background;
                            obj['width'] = data.width;
                            obj['height'] = data.height;
                            obj['repeat'] = data.repeat;

                            db.update("ext_slider", obj, "id=" + data.id, function (err) {
                                if (!err) {
                                    callback(301, "/admin/extension/slider?do=viewslider&id=" + slide[0].slider_id);
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
                db.query("SELECT * FROM ext_slider WHERE id=" + data.id, function (err, slide) {
                    if (!err) {
                        if (slide && slide.length) {
                            try {
                                cfg = JSON.parse(slide[0].config);
                            }
                            catch (e) {
                                cfg = {};
                            }
                            data['slide'] = slide[0];
                            data['cfg'] = cfg;
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
        case "deleteslide":
            if (core.request("sdo", "int")) {
                if (!data.id || !core.csrf()) {
                    callback(404);
                    return;
                }
                db.query("SELECT * FROM ext_slider WHERE id=" + data.id, function (err, slide) {
                    if (!err) {
                        fs.unlink(config.websitePath + "/public" + slide[0].background, function (err) {});
                        db.query("DELETE FROM ext_slider WHERE id=" + data.id, function (err) {
                            if (!err) {
                                callback(301, "/admin/extension/slider?do=viewslider&id=" + slide[0].slider_id)
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
};