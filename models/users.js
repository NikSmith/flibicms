var db = require("../lib/db");
var crypto = require('crypto');
module.exports = {
// Запретить удаление группы guest!!!

    getUsersGroups: function(callback){
        db.query("SELECT * FROM users_groups",function(err,groups){
            callback(err,groups);
        });
    },
    getUsersGroup: function(schema,callback){
        db.query("SELECT * FROM users_groups WHERE id="+schema.id,function(err,group){
            callback(err,group);
        });
    },
    updateUserGroup: function(schema,callback){
        db.update("users_groups",schema,"id="+schema.id,function(err){
            if (!err){
                db.query("SELECT * FROM users_groups",function(err,groups){
                    callback(err,groups);
                });
            }
            else {
                callback(err);
            }
        });
    },
    createUserGroup: function(schema,callback){
        if (schema.title && schema.role){
            db.insert("users_groups",schema,function(err){
                if (!err){
                    db.query("SELECT * FROM users_groups",function(err,groups){
                        callback(err,groups);
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
    },
    deleteUserGroup:function(schema,callback){
        if (schema.id){
            db.query("DELETE FROM users_groups WHERE id="+schema.id,function(err){
                if (!err){
                    db.query("SELECT * FROM users_groups",function(err,groups){
                        callback(err,groups);
                    });
                    db.query("DELETE FROM users WHERE usergroup="+schema.id,function(err){});
                }
                else {
                    callback(err);
                }
            });
        }
        else {
            callback("deleteUserGroup: Id is null");
        }
    },




    regUser: function(schema,callback){
        var errfields = [];

        // Валидация данных
        if (!schema.login || schema.login.length < 6){
            errfields.push({name:"login",msg:"Логин не может быть короче 6 символов"});
        }
        if (!schema.pass || schema.pass.length < 6){
            errfields.push({name:"pass",msg:"Длина пароля не менее 6 символов"});
        }
        if (!schema.email){
            errfields.push({name:"email",msg:"Неверный адрес почты"});
        }
        if (!schema.name || schema.name.length < 6){
            errfields.push({name:"name",msg:"Имя должно быть больше 6 символов"});
        }
        if (!schema.usergroup){
            errfields.push({name:"usergroup",msg:"Не указана группа"});
        }

        if (errfields.length){
            callback(null,errfields);
            return null;
        }

        // Готовим пароль
        schema.pass = crypto.createHash('md5').update(schema.pass).digest('hex');


        db.query("SELECT * FROM users WHERE login='"+schema.login+"' OR email='"+schema.email+"'",function(err,user){
            if (!err){
                if (user.length == 0){
                    db.query("SELECT * FROM users_groups WHERE id="+schema.usergroup,function(err,group){
                        if (!err){
                            if (group.length){
                                schema['reg_date'] = new Date().toISOString();
                                db.insert("users",schema,function(err){
                                    callback(err);
                                });
                            }
                            else {
                                errfields.push({name:"usergroup",msg:"Группа не найдена"});
                                callback(null,errfields);
                            }
                        }
                        else {
                            callback(err);
                        }
                    });
                }
                else {
                    if (user[0].email == schema.email){
                        errfields.push({name:"email",msg:"Данный адрес уже используется"});
                    }
                    if (user[0].login == schema.login){
                        errfields.push({name:"login",msg:"Такой логин уже существует"});
                    }
                    callback(null,errfields);
                }
            }
            else {
                callback(err);
            }
        });
    },
    updateUser: function(schema,callback){
        var errfields = [];

        // Валидация данных
        if (!schema.id){
            callback(404);
            return null;
        }
        if (!schema.login || schema.login.length < 5){
            errfields.push({name:"login",msg:"Логин не может быть короче 5 символов"});
        }

        if (schema.pass && schema.pass.length < 6){
            errfields.push({name:"pass",msg:"Длина пароля не менее 6 символов"});
        }

        if (!schema.email){
            errfields.push({name:"email",msg:"Неверный адрес почты"});
        }
        if (!schema.name || schema.name.length < 6){
            errfields.push({name:"name",msg:"Имя должно быть больше 6 символов"});
        }
        if (!schema.usergroup){
            errfields.push({name:"usergroup",msg:"Не указана группа"});
        }

        if (errfields.length){
            callback(null,errfields);
            return null;
        }

        if (schema.pass && schema.pass.length>6){
            schema.pass = crypto.createHash('md5').update(schema.pass).digest('hex');
        }
        else {
            delete schema.pass;
        }

        db.update("users",schema,"id="+schema.id,function(err){
            callback(err);
        });
    },
    getUsers: function(callback){
        db.query("SELECT u.*, g.title FROM users u LEFT JOIN users_groups g ON u.usergroup = g.id",function(err,users){
            callback(err,users);
        });
    },
    getUser: function(schema,callback){
        db.query("SELECT * FROM users WHERE id="+schema.id,function(err,user){
            callback(err,user);
        });
    },
    deleteUser: function(schema,callback){
        if (schema.id){
            db.query("DELETE FROM users WHERE id="+schema.id,function(err){
                callback(err);
            });
        }
        else {
            callback(404);
        }
    },
    auth: function(obj,callback){
        var pass = crypto.createHash('md5').update(obj.pass).digest('hex');
        db.query("SELECT u.*,g.role as usergroup FROM users u LEFT JOIN users_groups g ON u.usergroup=g.id WHERE login='"+obj.login+"' AND pass='"+pass+"'",function(err,user){
            console.log(err,user)
            if (!err){
                if (user && user.length){
                    callback(null,user[0]);
                }
                else {
                    callback();
                }
            }
            else {
                callback(err);
            }
        });
    }
};
