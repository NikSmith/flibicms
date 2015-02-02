(function($) {
    $.fn.wslider = function (options) {
        options = $.extend({
            animation: "shading", // shading  or turn or simple
            navigation:true,
            buttons: true,
            fadespeed:500,
            playspeed:5000,
            autoplay: true,
            buttons_code:{
                prev:"<a href='javascript:void(0)' class='slide-prev'>&lt;</a>",
                next:"<a href='javascript:void(0)' class='slide-next'>&gt;</a>"
            },
            nav_bt:[]
        }, options);


        function init() {
            var self = this;
            var can = true;
            var play = true;
            var slides = $(this).find("li");

            $(slides[0]).addClass("slide-active");

            if (options.animation == "shading"){
                $(self).addClass("container-shading");
                $(slides).addClass("slide-shading");
            }

            if (options.animation == "turn") {
                var defaultWidth = $(self).width();

                $(slides).width(defaultWidth);
                $(slides).parent().width(defaultWidth*slides.length);
                $(slides).addClass("slide-turn");
                $(self).addClass("container-turn");
            }



            if (options.navigation){
                var nav_type = "a";
                $(self).append("<div class='slider-navigation'></div>");
                $(slides).each(function(i){
                    if (options.nav_bt.length){
                        $(self).find(".slider-navigation").append(options.nav_bt[i]);
                    }
                    else {
                        $(self).find(".slider-navigation").append("<a href='javascript:void(0)'><div></div></a>");
                    }
                });

                if (options.nav_bt.length){
                    nav_type = $(options.nav_bt[0])[0].tagName;
                }

                $(self).find(".slider-navigation "+nav_type).each(function(ind,item){
                    $(item).on("click",function(){
                        process(self,ind);
                    });

                    if (ind == 0){
                        $(item).addClass("slider-navigation-active");
                    }
                });
            }

            if (options.buttons){
                $(self).append(options.buttons_code.prev);
                $(self).append(options.buttons_code.next);

                $(self).find(".slide-prev").on("click",function(){
                    process(self,'prev');
                });

                $(self).find(".slide-next").on("click",function(){
                    process(self,'next');
                });
            }

            $(window).on("resize",function(){
                var newWidth = $(self).width();

                if ($(self).hasClass("container-turn")){
                    $(self).find("ul").width(newWidth*slides.length);
                    $(self).find("li").width(newWidth);
                    var now = $(slides).index($(self).find(".slide-active"));
                    var offset = $(slides[0]).width()*now;
                    $(self).find("ul").css({left:"-"+offset+"px"});
                }
                else{
                    $(self).find("ul").width(newWidth);
                    $(self).find("li").width(newWidth);
                }
            });

            if (options.autoplay){
                $(self).on("mouseover",function(){
                    play = false;
                });

                $(self).on("mouseleave",function(){
                    play = true;
                });

                setInterval(function(){
                    if (play){
                        process(self,"next");
                    }
                },options.playspeed);
            }

            function process(e,p){
                if (!e || !can){
                    return null;
                }
                can = false;
                var slides = $(e).find("li");
                var type;
                var now;
                var next;

                if ($(e).hasClass("container-shading")){
                    type = 'shading';
                }
                else if($(e).hasClass("container-turn")){
                    type = 'turn';
                }
                else {
                    return false;
                }

                now = $(slides).index($(e).find(".slide-active"));

                if ("string" === typeof p){
                    var index = $(slides).index(slides[now]);
                    if ("prev" == p){
                        if (index == 0){
                            next = slides.length-1;
                        }
                        else {
                            next = index-1;
                        }
                    }

                    if ("next" == p){
                        if (index == slides.length-1){
                            next =0;
                        }
                        else {
                            next = index+1;
                        }
                    }
                }

                if ("number" == typeof p){
                    next = p;
                }

                if (now != next){
                    animate(type,self,now,next);
                }
                else {
                    can = true;
                }
            }


            function animate(type,parent,now,next){
                var slides = $(parent).find("li");
                var nav = $(parent).find(".slider-navigation "+nav_type);

                if ("simple" == type){
                    $(slides[now]).removeClass("slide-active");
                    $(nav).removeClass("slider-navigation-active");
                    $(slides[next]).addClass("slide-active");
                    $(nav[next]).addClass("slider-navigation-active");
                    can = true;
                }

                if ("shading" == type){
                    $(slides[next]).addClass("slide-temp");
                    $(slides[now]).fadeOut(options.fadespeed,function(){
                        $(nav).removeClass("slider-navigation-active");
                        $(nav[next]).addClass("slider-navigation-active");
                        $(slides[now]).removeClass("slide-active");
                        $(slides[next]).addClass("slide-active");
                        $(slides).removeClass("slide-temp");
                        $(slides[now]).show();
                        can = true;
                    });
                }

                if ("turn" == type){
                    var offset = $(slides[0]).width()*next;
                    $(slides[now]).removeClass("slide-active");
                    $(nav).removeClass("slider-navigation-active");
                    $(parent).find("ul").animate({left:"-"+offset});
                    $(slides[next]).addClass("slide-active");
                    $(nav[next]).addClass("slider-navigation-active");
                    can = true;
                }
            }
        }
        return this.each(init);
    };

    $.fn.wscroller = function(options){
        options = $.extend({
            container:undefined
        }, options);

        if (this.length == 0 || this.length > 1){
            return null;
        }

        if (!options.container || !$(options.container)){
            return null;
        }

        var self = this;
        var parent = $(self).parent();
        var offset = $(parent).offset().top;

        function scrolling(){
            var mainHeight = $(options.container).height();
            var childHeight = $(self).height();
            var scrollTop = $(window).scrollTop();

            $(options.container).css({"position":"relative"});
            $(self).width($(parent).width());

            if (scrollTop > offset){
                if (childHeight + 50 > mainHeight){ return;}
                if (mainHeight-((scrollTop-offset)+childHeight) > 0){
                    $(self).css({
                        "position":"fixed",
                        'top': '10px'
                    });
                }
                else {
                    $(self).css({
                        "position":"absolute",
                        "top":((mainHeight-childHeight))+"px"
                    });
                }
            }
            else {
                $(self).css({
                    "position":"relative"
                });
            }
        }

        $(window).on('scroll load',function(){
            scrolling();
        });

        $(window).on("resize",function(){
            $(self).width($(parent).width());
        });

        return this;
    };

    $.fn.wajaxform = function(options){
        options = $.extend({
            ajax: true,
            classError:"input-error",
            classSuccess:"input-success",
            callback: function(str){ alert("Данные отправлены"); },
            data:{}
        },options);

        function _validate(el){
            var form = el;
            this.len = function(name){
                var min = 3;
                var max = 10;
                var child =$(form).find("[name='"+name+"']");
                if (options.data[name].min){
                    min = options.data[name].min;
                }
                if (options.data[name].max){
                    max = options.data[name].max;
                }

                return $(child).val().length > min && $(child).val().length < max;
            };
            this.empty = function(name){
                var child =$(form).find("[name='"+name+"']");
                return $(child).val().length>0;

            };
            this.numeric = function(name){
                var child =$(form).find("[name='"+name+"']");
                return !isNaN($(child).val()+1) && $(child).val().length>0;
            };
            this.email = function(name){
                var child =$(form).find("[name='"+name+"']");
                var regex = /^([A-zА-я0-9_\.\-\+])+\@(([A-zА-я0-9\-])+\.)+([A-zА-я0-9]{2,4})+$/;
                return regex.test($(child).val());
            }
        }

        function init(){
            var self = this;
            var validate = new _validate(self);
            var param = Object.keys(options.data);

            if (!param.length){
                return null;
            }

            param.forEach(function(item){
                if (validate[options.data[item].check]){
                    var child =$(self).find("[name='"+item+"']");
                    if (child.length){
                        $(child).on("input",function(){
                            var msgElement = $(options.data[item].msgElement);
                            if (validate[options.data[item].check](item)){
                                $(child).removeClass(options.classError);
                                $(child).addClass(options.classSuccess);
                                if (options.data[item].text && msgElement.length){
                                    $(msgElement).text("");
                                }
                            }
                            else {
                                if (options.data[item].text && msgElement.length){
                                    $(msgElement).text(options.data[item].text);
                                }
                                $(child).removeClass(options.classSuccess);
                                $(child).addClass(options.classError);
                            }
                        });
                    }
                }
            });

            $(self).on("submit", function(event){
                event.preventDefault();
                var error = false;
                param.forEach(function(item){
                    var child =$(self).find("[name='"+item+"']");
                    var msgElement = $(options.data[item].msgElement);
                    if (validate[options.data[item].check]){
                        if (!validate[options.data[item].check](item)){
                            error = true;
                            $(child).removeClass(options.classSuccess);
                            $(child).addClass(options.classError);
                            if (options.data[item].text && msgElement.length){
                                $(msgElement).text(options.data[item].text);
                            }
                        }
                        else {
                            if (options.data[item].text && msgElement.length){
                                $(msgElement).text("");
                            }
                        }
                    }
                });
                if (!error){
                    if (options.ajax){
                        var action = self.action;
                        var method = self.method;
                        var obj = {};

                        if (!action){
                            action = window.location.href;
                        }
                        if (!method){
                            method = "get";
                        }

                        $(self).serializeArray().forEach(function(item){
                            obj[item.name] = item.value;
                        });

                        $.ajax({
                            url:action,
                            method: method,
                            data:obj,
                            success: options.callback
                        });
                    }
                    else {
                        $(self).unbind('submit');
                        $(self).submit();
                    }
                }
            });
        }
        return this.each(init);
    };
})(jQuery);

function modal(options){
    return new modal.prototype.Init(options);
}
modal.prototype = {
    width:500,
    load: function(){},
    Init: function(options){

        this.build();

        if (typeof options == "object"){
            if (options.width){
                this.width = options.width;
            }
            if (options.load){
                this.load = options.load.bind(this);
            }
            if (options.title){
                this.setTitle(options.title);
            }
            if (options.content){
                this.setContent(options.content);
            }
            if (options.buttons){
                this.setButtons(options.buttons);
            }

        }
    },

    build: function(){
        this.$modalOverlay = $('<div id="modal-overlay">').hide();
        this.$modalBox = $('<div class="modal-box" />').hide();
        this.$modal = $('<div class="modal" />');
        this.$modalHeader = $('<header />');
        this.$modalClose = $('<span class="modal-close" />').html('&times;');
        this.$modalBody = $('<section />');
        this.$modalFooter = $('<footer />');
        this.$modal.append(this.$modalHeader);
        this.$modal.append(this.$modalClose);
        this.$modal.append(this.$modalBody);
        this.$modal.append(this.$modalFooter);
        this.$modalBox.append(this.$modal);
        this.$modalClose.on("click",$.proxy(this.close, this));
    },
    close: function(e){
        if (e){
            if (!$(e.target).hasClass('modal-close-btn') && e.target != this.$modalClose[0] && e.target != this.$modalBox[0])
            {
                return;
            }

            e.preventDefault();
        }

        if (!this.$modalBox) return;

        this.$modalOverlay.remove();
        this.$modalBox.fadeOut('fast', $.proxy(function()
        {
            this.$modalBox.remove();
            $(document.body).css('overflow', this.bodyOveflow);
        }, this));
    },
    show: function(){
        if ($(".modal-box").length){
            $(".modal-box").remove();
        }
        if ($("#modal-overlay").length){
            $("#modal-overlay").remove();
        }
        this.$modalBox.appendTo(document.body);
        this.$modalOverlay.appendTo(document.body);

        this.bodyOveflow = $(document.body).css('overflow');
        $(document.body).css('overflow', 'hidden');

        if (this.isMobile())
        {
            this.showOnMobile();
        }
        else
        {
            this.showOnDesktop();
        }

        // resize
        if (!this.isMobile())
        {
            setTimeout($.proxy(this.showOnDesktop, this), 0);
            $(window).on('resize', $.proxy(this.resize, this));
        }

        this.$modalOverlay.show();
        this.$modalBox.show();
        this.load();
    },
    resize: function()
    {
        if (this.isMobile())
        {
            this.showOnMobile();
        }
        else
        {
            this.showOnDesktop();
        }
    },
    isMobile: function()
    {
        var mq = window.matchMedia("(max-width: 767px)");
        return (mq.matches) ? true : false;
    },
    showOnDesktop: function()
    {
        var height = this.$modal.outerHeight();
        var windowHeight = $(window).height();
        var windowWidth = $(window).width();

        if (this.width > windowWidth)
        {
            this.$modal.css({
                width: '96%',
                marginTop: (windowHeight/2 - height/2) + 'px'
            });
            return;
        }

        if (height > windowHeight)
        {
            this.$modal.css({
                width: this.width + 'px',
                marginTop: '20px'
            });
        }
        else
        {
            this.$modal.css({
                width: this.width + 'px',
                marginTop: (windowHeight/2 - height/2) + 'px'
            });
        }
    },
    showOnMobile: function()
    {
        this.$modal.css({
            width: '96%',
            marginTop: '2%'
        });

    },
    setTitle: function(str)
    {
        this.$modalHeader.html(str);
    },

    setButtons: function(btns){
        for (var i=0; i<btns.length; i++){
            var button = $('<button>').addClass(btns[i].class).html(btns[i].title);
            button.on('click', $.proxy(btns[i].click, this));
            this.$modalFooter.append(button);
        }
        var buttons = this.$modalFooter.find('button');
        var buttonsSize = buttons.size();
        if (buttonsSize === 0) return;

        buttons.css('width', (100/buttonsSize) + '%');
    },
    setContent: function(data)
    {
        if (typeof data == 'object'){
            if (data.html){
                this.$modalBody.html(data.html);
                this.show();
            }

            if (data.selector){
                this.$modalBody.html($(data.selector).html());
                this.show();
            }

            if (data.ajax){
                $.ajax({
                    url: data.ajax,
                    cache: false,
                    success: $.proxy(function(data)
                    {
                        this.$modalBody.html(data);
                        this.show();
                        this.resize();
                    }, this)
                });
            }
        }

    }


};

modal.prototype.Init.prototype = modal.prototype;