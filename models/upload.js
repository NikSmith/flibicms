var fs = require('fs');
var config = require("../lib/config").config;
var gm = require("gm").subClass({ imageMagick: true });
var crypto = require('crypto');
var extend = require('util')._extend;
var path = require('path');
var multiparty = require("multiparty");
module.exports = {
    uploadFile: function(opts,req,callback) {
        var contentType = req.headers['content-type'] || '';
        if (contentType.split(';')[0] != "multipart/form-data"){
            callback(404);
            return;
        }
        var options = extend({
            thumbs: true, // Создание уменьшенной копии изображения
            thumbs_size_w: config.thumbsImageH,// Ширина
            thumbs_size_h: config.thumbsImageV, // Высота
            upload_dir: "images", // директория загрузки
            upload_dir_thumbs: "images/thumbs",
            maxFilesSize: config.maxUploadFileSize * 1024 * 1024,
            maxAllFilesSize: config.maxAllFilesSize * 1024 * 1024,
            replaceName: true
        }, opts);
        var processFile = function(fl,callback){
            var ext = path.extname(fl.path);
            var fileInfo = {
                name: path.basename(fl.originalFilename,ext)
            };
            fileInfo['filename'] = crypto.createHash('md5').update(fileInfo.name).digest('hex')+ext;
            fileInfo['url'] = '/uploads/'+options.upload_dir+"/"+fileInfo.filename;

            // Проверка допустимого размера файла
            if (fl.size > options.maxFilesSize || fl.size == 0){
                fs.unlink(fl.path,function(err){
                    callback(err);
                });
            }
            else {
                fs.rename(fl.path,path.dirname(fl.path)+"/"+fileInfo.filename,function(err){
                    if (!err){
                        if (options.thumbs == true){
                            gm(config.websitePath + '/public/'+fileInfo.url)
                                .resize(options.thumbs_size_w,options.thumbs_size_h)
                                .autoOrient()
                                .write(config.websitePath + '/public/uploads/'+options.upload_dir_thumbs+'/'+fileInfo.filename, function (err){
                                    fileInfo['thumbnaiUrl'] = '/uploads/'+options.upload_dir_thumbs+'/'+fileInfo.filename;
                                    callback(err,fileInfo);
                                });
                        }
                        else {
                            callback(null,fileInfo);
                        }
                    }
                    else {
                        callback(err);
                    }
                });
            }
        };



        if (options.upload_dir[0] == "/"){
            options.upload_dir = options.upload_dir.substr(1,options.upload_dir.length);
        }
        if (options.upload_dir[options.upload_dir.length-1] == "/"){
            options.upload_dir= options.upload_dir.substr(0,options.upload_dir.length-1)
        }

        var form = new multiparty.Form({
            maxFilesSize: options.maxAllFilesSize,
            uploadDir: config.websitePath + '/public/uploads/'+options.upload_dir

        });

        form.parse(req, function(err, fields, files) {
            var filesArray = [];
            var allFiles = [];
            if (!err){
                Object.keys(fields).forEach(function(name) {
                    if (!req.body){
                        req.body = {};
                    }
                    req.body[name] = fields[name].join(",");
                });
                var fileFields = Object.keys(files);
                fileFields.forEach(function(item){
                    allFiles = allFiles.concat(files[item]).splice(0);
                });

                if (allFiles.length){
                    (function process(x){
                        processFile(allFiles[x],function(err,data){
                            if (!err){
                                if (data){
                                    filesArray.push(data);
                                }
                                x++;
                                if (x<allFiles.length){
                                    process(x);
                                }
                                else {
                                    callback(null,filesArray);
                                }
                            }
                            else {
                                callback(err,filesArray);
                            }
                        })
                    })(0);
                }
                else {
                    callback(null,filesArray);
                }
            }
            else {
                callback(err,filesArray);
            }
        });
    }
};