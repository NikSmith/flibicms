var db = require("../lib/db");
var crypto = require("crypto");
var core = function (page,req,all) {

    var request;
    if ("GET" === req.method) {
        request = req.query;
    } else if ("POST" === req.method) {
        request = req.body;
    }

    this.userGroup = page.userGroup;

    // Возможно стоит рассмотреть хранение в ограниченном массиве списка токенов
    this.csrf = function(){
        var check = !!(req.session.csrf && ((req.body.csrf && req.body.csrf == req.session.csrf) || ( req.query.csrf && req.query.csrf==req.session.csrf)));
        delete req.session.csrf;
        return check;
    };
    this.csrf_token = function(){
        var csrf = crypto.createHash('md5').update(Math.floor(Math.random() * 0x75bcd15) +""+ new Date().getTime()).digest('hex');
        req.session.csrf = csrf;
        return csrf;
    };


    if (all){
//        this.ctype = page.ctype;
        this.setMetaDesc = function(str){
            page.meta.desc = '<meta name="description" content="'+str+'">';
        };
        this.setMetaKeywords = function(str){
            page.meta.keywords = '<meta name="keywords" content="'+str+'">';
        };
        // Установка заголовка страницы
        this.setTitle = function (title) {
            page.title = title;
        };

        // Подключение CSS файла
        this.addHeadCSS = function (href) {
            page.header.push('<link rel="stylesheet" href="'+href+'" type="text/css">');
        };

        // Подключение JS файла
        this.addHeadJS = function (src) {
            page.header.push('<script type="text/javascript" src="'+src+'"></script>');
        };

        // Добавление свободного кода в head
        this.addHead = function(str){
            page.header.push(str);
        };

        // Установка макета
        this.setLayout = function(name){
            page.layout = name;
        };
    }
    else {
        page.template = "";
        this.clean = function(){
            page.template = "";
            page.vars = {};
        }
    }



    // Присвоение переменных
    this.assign = function (name, value) {
        if (!page.vars[name]) {
            page.vars[name] = value;
        }
    };


    this.setSession = function (key, value) {
        req.session[key] = value;
    };
    this.getSession = function (key) {
        return req.session[key];
    };
    this.delSession = function (key) {
        delete req.session[key];
    };


    this.render = function(bool){
        page.render = bool;
    };

    // Установка шаблона
    this.setTemplate = function (name) {
        page.template = name;
    };

    this.is_ajax = function(){
        return req.xhr;
    };

    this.url = function(){
        return req.params[0];
    };





    this.request = function (key, type) {
        if (type == 'int') {
            if (!isNaN(parseFloat(request[key])) && isFinite(request[key])){
                return request[key];
            }
            else {
                return null;
            }
        }

        if (type == 'str') {
            if (request[key]){
                var str = db.escape(request[key].toString());
                return str.substr(1,str.length-2);
            }
            else {
                return '';
            }
        }

        if (type == "email"){
            var email;
            var pattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;

            if (request[key] && pattern.test(request[key])){
                email = db.escape(request[key]);
                return email.substr(1,email.length-2);
            }
            else {
                return null;
            }
        }

        if (type == "bool"){
            if (typeof request[key] == "boolean"){
                return request[key];
            }
            if (request[key]=="true" || request[key] == "false"){
                return JSON.parse(request[key]);
            }
            else {
                return null;
            }
        }

        return null;
    };


    this.req = req;


};

module.exports = core;