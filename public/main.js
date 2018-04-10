(function ($) {

    var main = {

        /** Settings **/
        settings : {
            username            : null,
            onTab               : true,
            notificationTitle   : null,

            document: {
                body : $("body"),
                head : $("head"),
                title : $("head > title")
            },

            socket  : {
                name    : null,
                object  : null
            },

            elems   : {
                activeUsers: 'ul.active-users',
                messages: 'div.messages',
                chatTo: 'span.chat-to',
                sendMessage: 'form#send-message',
                settings: 'form#chat-settings',
                notificationSound: 'audio#notification'
            },

            html    : {
                userInList: '<li data-to="(username)"><a href="javascript:void(0)">(username)</a></li>',
                message: '<div class="panel-body message" data-mktime="(mktime)" data-from="(username)"><div class="info"><b>(username)</b> <small>((date))</small></div><div class="text"><p>(message)</p></div></div>'
            },

            chat    : {
                to: 'all',
                messages: {
                    all: []
                }
            }
        },


        /** Init **/
        init: function (username) {
            var me = this;

            me.setSocket();
            me.registerUser(username);


            me.listUsers(function () {
                me.setSocketEvents();
                me.setChatEvents();
            });
        },


        /** Getters **/
        getSocketObject: function () {
            return this.settings.socket.object;
        },

        getUserListElem: function (pureText) {

            if (pureText === true)
                return this.settings.elems.activeUsers;

            var me  = this;
            var elem= $(me.settings.elems.activeUsers);

            return (elem.length <= 0) ? false : elem ;
        },

        getMessagesElem: function (pureText) {
            if (pureText === true)
                return this.settings.elems.messages;

            var me  = this;
            var elem= $(me.settings.elems.messages);

            return (elem.length <= 0) ? false : elem ;
        },

        getChatToElem: function (pureText) {
            if (pureText)
                return this.settings.elems.chatTo;

            var me  = this;
            var elem= $(me.settings.elems.chatTo);

            return (elem.length <= 0) ? false : elem ;
        },

        getSendMessageElem: function (pureText) {
            if (pureText === true)
                return this.settings.elems.sendMessage;

            var me  = this;
            var elem= $(me.settings.elems.sendMessage);

            return (elem.length <= 0) ? false : elem ;
        },

        getChatSettingsElem: function (pureText) {
            if (pureText === true)
                return this.settings.elems.settings;

            var me  = this;
            var elem= $(me.settings.elems.settings);

            return (elem.length <= 0) ? false : elem ;
        },

        getNotificationSoundElem: function (pureText) {
            if (pureText === true)
                return this.settings.elems.notificationSound;

            var me  = this;
            var elem= $(me.settings.elems.notificationSound);

            return (elem.length <= 0) ? false : elem ;
        },


        /** Setters **/
        setSocket: function (name) {

            if (typeof name === "undefined")
                name = null;

            if ($.trim(name) === "")
                name = null;

            if (name === null) {
                this.settings.socket.name    = null;
                this.settings.socket.object  = io.connect();
            } else if (name !== this.socket.name) {
                this.settings.socket.name    = name;
                this.settings.socket.object  = io.connect(name);
            }

            return true;
        },

        setSocketEvents: function () {
            var me = this;

            me.socketUserConnected();
            me.socketUserList();
            me.socketUserDisconnected();
            me.socketNewMessage();
        },

        setChatEvents: function () {
            var me = this;

            me.eventChangeChatTo();
            me.eventSendMessage();
            me.eventTabFocus();
        },

        setUserListMessageCounter: function (to, count) {
            var me      = this;
            var userList= me.getUserListElem();

            if (userList === false)
                return false;

            var li = userList.children("li[data-to='"+to+"']");

            if (li.length <= 0)
                return false;

            if (count !== undefined && count <= 0) {
                li.find('span.badge.message-counter').remove();
                return true;
            }

            // check if label exists and create
            if (li.find("a > span.badge.message-counter").length <= 0) {
                li.find("a").append('<span class="pull-right badge message-counter">1</span>');
            } else {

                var newCount = (count === undefined) ? parseInt(li.find("span.badge.message-counter").text()) + 1 : count ;

                li.find("span.badge.message-counter").text(newCount);

            }
        },


        /** Socket Events **/
        socketUserConnected: function () {
            var me = this;

            me.getSocketObject().on('userConnected',function (returndata) {

                if (returndata.username === me.settings.username)
                    return false;

                me.userStatus(returndata.username, "online");

            });
        },

        socketUserList: function () {
            var me      = this;

            me.getSocketObject().on('userList',function (returndata) {
                $.each(returndata, function (a,username) {

                    if (username === me.settings.username)
                        return;

                    me.userStatus(username,"online");

                });
            });
        },

        socketUserDisconnected: function () {
            var me = this;

            me.getSocketObject().on('userDisconnected',function (returndata) {

                me.userStatus(returndata.username, "offline");

            });
        },

        socketNewMessage: function () {
            var me = this;

            me.getSocketObject().on('newMessage',function (data) {

                me.recieveMessage(data);

            });
        },


        /** Chat Events **/
        eventChangeChatTo: function () {
            var me          = this;
            var userListText= me.getUserListElem(true);
            var userList    = me.getUserListElem();

            me.settings.document.body.on("click",userListText+" > li", function () {
                var elem    = $(this);
                var to      = elem.attr("data-to");

                if (to === undefined || to === "")
                    return false;

                me.changeChatTo(to, elem, me.getUserListElem());
            });

            // check window hash
            var windowHash = window.location.hash;
                windowHash = windowHash.trim().replace("#","");

            if (windowHash !== "" && userList.children("li[data-to='"+windowHash+"']").length > 0) {
                userList.children("li.active").removeClass("active");
                userList.children("li[data-to='"+windowHash+"']").addClass("active");
                console.log(windowHash);
            }

            if (userList.children("li.active").length <= 0)
                userList.children("li:first-child").addClass("active");

            //  current
            var currentLi = userList.children("li.active");

            if (currentLi.length <= 0)
                return false;

            me.changeChatTo(currentLi.attr("data-to"), currentLi, userList, true);
        },

        eventSendMessage: function () {
            var me  = this;
            var elem= me.getSendMessageElem();

            if (elem === false)
                return false;

            elem.on("submit",function (e) {
                e.preventDefault();

                var form        = $(this);
                var messageElem = form.find("input[name=message]");

                if (messageElem.length <= 0)
                    return false;

                var message = messageElem.val();

                if ($.trim(message) === "")
                    return false;

                me.sendMessage(me.settings.username, me.settings.chat.to, message);

                messageElem.val('');
            });
        },

        eventTabFocus: function () {
            var me = this;

            $(window).on("focus", function () {
                me.settings.onTab = true;
                me.notificationStop();
            });

            $(window).on("blur", function () {
                me.settings.onTab = false;
            });
        },


        /** Parse **/
        parseUserInList: function (username) {
            var me = this;

            return me.settings.html.userInList.replace(/\(username\)/g, username);
        },

        parseMessage: function (message) {
            return this.settings.html.message
                .replace(/\(username\)/g, message.from)
                .replace(/\(date\)/g, message.date)
                .replace(/\(message\)/g, message.message)
                .replace(/\(mktime\)/g, message.mktime);
        },


        /** Other Functions **/
        registerUser: function (username) {
            this.settings.username = username;
            this.getSocketObject().emit('registerUser',{username:username});
        },

        changeChatTo: function (to, li, userList, force) {
            var me = this;

            if ((to === me.settings.username || to === me.settings.chat.to) && force !== true)
                return false;

            var messages    = me.getMessagesElem();
            var chatTo      = me.getChatToElem();

            if (messages === false)
                return false;

            me.settings.chat.to = to;

            messages.empty();

            if (chatTo !== false)
                chatTo.html(to);

            li.parent().find(".active").removeClass("active");
            li.addClass("active");

            window.location.hash = to;

            me.loadPreviousMessages(to);
            me.setUserListMessageCounter(to,0);
            me.notificationStop();
        },

        sendMessage: function (from, to, message) {
            var me = this;

            me.getSocketObject().emit('sendMessage', {
                from    :from,
                to      :to,
                message :message
            });
        },

        recieveMessage: function (message) {
            var me      = this;

            // Message to everyone
            if (message.type === "public") {

                me.settings.chat.messages.all.push(message);

                if (me.settings.chat.to !== "all") {
                    me.setUserListMessageCounter("all");
                } else
                    me.insertMessage(message);

            // Private Message
            } else {

                var saveKey = (message.myMessage === true) ? message.to : message.from ;

                if (typeof me.settings.chat.messages[saveKey] === "undefined")
                    me.settings.chat.messages[saveKey] = [];

                me.settings.chat.messages[saveKey].push(message);

                if (message.myMessage === true ) {
                    me.insertMessage(message);
                } else {

                    if (me.settings.chat.to !== message.from)
                        me.setUserListMessageCounter(message.from);
                    else
                        me.insertMessage(message);

                }

            }

            me.notificationPlay();
        },

        insertMessage: function (message, append) {
            var me      = this;
            var messages= me.getMessagesElem();

            if (messages === false)
                return false;

            if (append === undefined)
                append = true;

            var appendType  = (append === true) ? "append" : "prepend" ;

            messages[appendType](me.parseMessage(message));

            if (append) {
                var scrollHeight = messages[0].scrollHeight;
                var scrollTop = messages.scrollTop() + messages.height();

                if ((scrollHeight - scrollTop) < 200)
                    messages.stop(true, true).animate({
                        scrollTop: scrollHeight + "px"
                    }, 200);
            }
        },

        loadPreviousMessages: function (to) {
            var me      = this;

            $.ajax({
                url     : window.location.origin+"/getMessages",
                method  : "POST",
                data    : {
                    from: me.settings.username,
                    to  : to
                },
                success : function (returndata) {
                    if (returndata.success === false || returndata.data.length <= 0)
                        return false;

                    $.each(returndata.data,function (key,message) {
                        me.insertMessage(message, returndata.firstLoad);
                    });
                }
            })
        },

        notificationSound: function () {
            var me          = this;
            var settings    = me.getChatSettingsElem();
            var notification= me.getNotificationSoundElem();

            if (settings === false || notification === false)
                return false;

            if (settings.find("input#notificationSound").is(":checked"))
                notification.trigger("play");
        },

        notificationTitle: function () {
            var me          = this;
            var settings    = me.getChatSettingsElem();

            if (settings === false || me.settings.notificationTitle !== null)
                return false;

            if (!settings.find("input#blinkTitle").is(":checked"))
                return false;

            var titleOriginal = me.settings.document.title.text();
                titleOriginal = $.trim(titleOriginal);

            var titleNew      = "New Message";

            me.settings.document.title.attr("data-original", titleOriginal);

            me.settings.notificationTitle = setInterval(function () {
                var titleCurrent = me.settings.document.title.text();
                    titleCurrent = $.trim(titleCurrent);

                me.settings.document.title.text((titleCurrent === titleOriginal) ? titleNew : titleOriginal );
            },1000);
        },

        notificationStop: function () {
            var me = this;

            // Change Orginal title
            clearInterval(me.settings.notificationTitle);
            me.settings.notificationTitle = null;
            me.settings.document.title.text(me.settings.document.title.attr("data-original"));

        },

        notificationPlay: function () {
            var me = this;

            if (me.settings.onTab === true)
                return false;

            me.notificationSound();
            me.notificationTitle();
        },

        listUsers: function (doAfter) {
            var me          = this;
            var userList    = me.getUserListElem();

            if (userList === false)
                return false;

            $.ajax({
                url     : window.location.origin+"/getUsers",
                method  : "POST",
                success : function (returndata) {

                    if (returndata.success === false || returndata.data.length <= 0)
                        return false;

                    var loop = $.each(returndata.data, function (key,user) {

                        if (user.username === me.settings.username)
                            return;

                        userList.append(me.parseUserInList(user.username));

                    });

                    $.when(loop).then(function (returndata) {
                        me.getSocketObject().emit('getUserList');

                        console.log("loop finished");

                        if (typeof doAfter === "function")
                            doAfter();
                    });
                }
            })
        },

        userStatus: function (username, status) {
            var me      = this;
            var userList= me.getUserListElem();

            if (userList === false)
                return false;

            var li = userList.children("li[data-to='"+username+"']");

            if (li.length <= 0)
                return false;

            if (status === "online" && li.find("label.label-online").length <= 0)
                li.children("a").prepend('<span class="label label-success label-online"><i class="zmdi zmdi-check"></i></span>');

            if (status === "offline")
                li.find("span.label-online").remove();
        }
    };


    $(document).ready(function () {
        main.init($username);
    });

})(jQuery);