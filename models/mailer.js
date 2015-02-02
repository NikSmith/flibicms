var nodemailer = require("nodemailer");
var config = require("../lib/config").config;

module.exports = {
    createMailer: function(){
        var transport = {};
        if (config.smtp){
            transport['host'] = config.smtpHost;
            transport['port'] = config.smtpPort;
            transport['secure'] = config.smtpSSL;
            transport['auth'] = {
                user:config.smtpUser,
                pass:config.smtpPass
            };
        }

        var transporter = nodemailer.createTransport(transport);


        var mailer = function(){
            var attachments = [];
            this.attach = function(obj){
                attachments.push(obj);
            };
            this.send = function(options){
                if (!options['from']){
                    options['from'] = config.adminEmail;
                }
                if (attachments.length){
                    options['attachments'] = attachments;
                }
                transporter.sendMail(options);
            };
        };
        return new mailer();
    }
};