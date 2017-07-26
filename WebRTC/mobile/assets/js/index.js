"use strict";
var RoomNumber = 0;
var ReportInterval = null;
var rtclistener = {
    onRemoteCloseAudio: onRemoteCloseAudio,
    onRemoteLeave: onRemoteLeave,
    onRemoteCloseVideo: onRemoteCloseVideo,
    onKickout: onKickout,
    onInitResult: onInitResult,
    onLocalStreamAdd: onLocalStreamAdd,
    onRemoteStreamAdd: onRemoteStreamAdd,
    onWebSocketClose: onWebSocketClose,
    onRelayTimeout: onRelayTimeout, //关闭房间/房间超时/被T下线
    onIceConnectionClose: onIceConnectionClose, //ice连接断开
    onRemoteStreamRemove: onRemoteStreamRemove, //关闭视频流
    onPeerStreamRemove: onPeerStreamRemove //peer连接断开
};
//角色
var Role = {
    Guest: 0, //观众
    LiveMaster: 1, //主播
    LiveGuest: 2 //连麦观众
};

var loginInfo = {
    'sdkAppID': 1400027849,
    'accountType': 11656,
    'identifier': null,
    'userSig': null,
    'identifierNick': null,
    'headurl': null,
    'token': null
};
var Volume = 1;

var stv = null;

var App = {
    render: function(name) {
        $(".mode").hide();
        $("." + name).show();
        if (name == 'connect') {
            clearInterval(stv);
            stv = setInterval(renderPx, 3000);
        }
    },
    login: function() {
        $("#login").prop("disable", true);
        var roomNumber = $("#room-number").val();
        var username = $("#username").val();
        var password = $("#password").val();
        var self = this;
        if (!password) {
            $.toptip("密码为空！", 'info');
            return;
        }
        if (!username) {
            $.toptip("用户名为空！", 'info');
            return;
        }
        store.set("username", username);
        store.set("password", password);
        ilvbLogin({
            username: username,
            password: password,
            success: function() {
                $.toptip("登录成功", 'success');
                self.render('transit');
            }
        });

    },
    register: function() {
        webimRegister();
    },
    createRoom: function() {
        var self = this;
        $.toptip("正在接入...", 'success');
        var roomNumber = $("#roomnum").val();
        if (roomNumber) {
            this.joinRoom(roomNumber);
        } else {
            webimLogin(function() {
                createRoom();
                self.render('connect');
            });
        }
    },
    joinRoom: function(roomNumber) {
        RoomNumber = roomNumber;
        var self = this;
        store.set("role", 'LiveGuest');
        store.set("roomnum", RoomNumber);
        webimLogin(function() {
            createRoomCallback(RoomNumber);
            self.render('connect');
        });
    },
    logout: function() {
        $.extend(loginInfo, {
            'identifier': null,
            'userSig': null,
            'identifierNick': null,
            'headurl': null,
            'token': null
        });
        store.clear();
        this.render('login');
    },
    init: function() {
        $("#username").val(store.get("username"));
        $("#password").val(store.get("password"));
        //已经登录的用户，
        if (false && store.get("loginInfo")) {
            loginInfo = store.get("loginInfo");
            if (false && store.get('roomnum')) {
                webimLogin(function() {
                    App.createRoom();
                });
            } else {
                App.render('transit');
            }
        } else {
            App.render('login');
        }
        $("#mute-audio").off("click").on("click", function() {
            if (toggle(this)) {
                WebRTCAPI.closeAudio();
            } else {
                WebRTCAPI.openAudio();
            }
        });

        $("#mute-video").off("click").on("click", function() {
            if (toggle(this)) {
                WebRTCAPI.closeVideo();
            } else {
                WebRTCAPI.openVideo();
            }
        });
        $("#hangup").off("click").on("click", function() {
            WebRTCAPI.quit();
            store.remove("roomnum");
            App.render('transit');
        });

        $("#reversal").off("click").on("click", function() {

            $("video").toggleClass("viewMode");
            return false;
        });

        $("#volume-lower").off("click").on("click", function() {
            Volume -= 0.1;
            if (Volume < 0) {
                Volume = 0;
            }
            $.toptip("音量调整" + parseInt(Volume * 100) + "%", "success");
            WebRTCAPI.setMicVolume(Volume);
            return false;
        });

        $("#volume-higher").off("click").on("click", function() {
            Volume += 0.1;
            if (Volume > 1) {
                Volume = 1;
            }
            $.toptip("音量调整" + parseInt(Volume * 100) + "%", "success");
            WebRTCAPI.setMicVolume(Volume);
            return false;
        });
    }
};

function renderPx() {
    var roomId = "ID:" + parseInt(RoomNumber) + "<br/>";
    var localVideo = $("#local-video").get(0);
    var localVideoStr = "";
    if (localVideo.videoWidth) {
        localVideoStr = "localVideo:" + localVideo.videoWidth + "x" + localVideo.videoHeight + "<br/>"
    }
    var remoteVideo = $("#remote-video").get(0);
    var remoteVideoStr = "";
    if (remoteVideo.videoWidth) {
        remoteVideoStr = "remoteVideo:" + remoteVideo.videoWidth + "x" + remoteVideo.videoHeight
    }
    $(".room-id").html(roomId + localVideoStr + remoteVideoStr);
}

function createRoomCallback() {
    createGroup();
    initRTC();

    clearInterval(stv);
    stv = setInterval(renderPx, 3000);

    var reportObj = {
        "token": loginInfo.token,
        "room": {
            "title": '[WebRTC]' + loginInfo.identifier,
            "roomnum": RoomNumber,
            "type": "live",
            "groupid": String(RoomNumber),
            "appid": loginInfo.sdkAppID,
            "device": 2,
            "videotype": 0
        }
    };
    $.ajax({
        type: "POST",
        url: "https://sxb.qcloud.com/sxb_new/?svc=live&cmd=reportroom",
        data: JSON.stringify(reportObj),
        success: function(rspJson) {
            report({
                "token": loginInfo.token,
                "roomnum": RoomNumber,
                "role": Role.LiveMaster,
                "thumbup": 0
            });
        }
    });
}


function createRoom() {
    var jsonObj = {
        "type": 'live',
        "token": loginInfo.token
    };

    $.ajax({
        type: "POST",
        url: "https://sxb.qcloud.com/sxb_new/?svc=live&cmd=create",
        data: JSON.stringify(jsonObj),
        success: function(json) {
            if (json.errorCode == 0) {
                RoomNumber = json.data.roomnum;
                store.set("roomnum", RoomNumber);
                store.set("role", 'LiveMaster');
                createRoomCallback(RoomNumber);
            } else {
                ajaxErrorCallback(json);
            }
        }
    });
}

function report(obj) {
    clearInterval(ReportInterval);
    var handleReport = function() {
        $.ajax({
            type: "POST",
            url: "https://sxb.qcloud.com/sxb_new/?svc=live&cmd=heartbeat",
            data: JSON.stringify(obj),
            success: function(rspJson) {
                console.debug(rspJson);
            }
        });
    };
    handleReport();
    ReportInterval = setInterval(handleReport, 10000)
}



function onRemoteCloseAudio() {
    $.toptip("on remote close audio!", "warning");
}

function onRemoteLeave() {
    $.toptip("on remote leave!", "warning");
}

function onRemoteCloseVideo() {
    $.toptip("on remote close video!", "warning");
}

function onKickout() {
    $.toptip("你被T下线了", "danger");

}

function onWebSocketClose() {
    console.warn('onWebSocketClose')
}

function onRelayTimeout() {
    console.warn('onRelayTimeout')
}

function onIceConnectionClose() {
    console.log("onIceConnectionClose!");
}

function onPeerStreamRemove() {
    console.log("onPeerStreamRemove");
}



var localVideoEle = document.createElement('video');

function createVideoEle(id, opt) {
    var video = document.createElement('video');
    video.className = "video-item ";
    video.autoplay = true;
    for (var a in opt) {
        video[a] = opt[a];
    }
    $("#" + id).append(video);
    return video;
}



function onLocalStreamAdd(stream) {
    // var video = createVideoEle("remote-video-wrap", { /*id: 'local-video',*/ muted: true });
    // video.srcObject = stream;
    $("#local-video")[0].srcObject = stream;
}

function onRemoteStreamAdd(stream, srctinyid) {
    // var video = createVideoEle("remote-video-wrap", { id: srctinyid });
    // video.srcObject = stream;
    $("#remote-video")[0].srcObject = stream;
    $.toptip("画面成功接入", "success")
}


function onRemoteStreamRemove(data) {
    var ele = document.getElementById(data.srctinyid);
    if (ele) {
        ele.parentNode.removeChild(ele);
    }
}



function onWebSocketClose() {
    WebRTCAPI.quit();
    console.warn('onWebSocketClose')

    $.confirm("连接断开，是否重新进入？", function() {
        initRTC();
    }, function() {
        //点击取消后的回调函数
        $("#hangup").trigger("click");
    });
}

function onRelayTimeout() {
    console.warn('onRelayTimeout');
    WebRTCAPI.quit();

    $.confirm("连接断开，是否重新进入？", function() {
        initRTC();
    }, function() {
        //点击取消后的回调函数
        $("#hangup").trigger("click");
    });
}

function onIceConnectionClose() {
    WebRTCAPI.quit();
    console.warn('onIceConnectionClose');
    $.confirm("连接断开，是否重新进入？", function() {
        initRTC();
    }, function() {
        //点击取消后的回调函数
        $("#hangup").trigger("click");
    });
}

function onCreateRoomCallback(result) {
    if (result !== 0) {
        $.toptip("create room failed!!!", 'error');
        return;
    }

    $("#video-section").show();
    $("#room-number").val("");

}


function onInitResult(result) {
    console.log("on init result : " + result);
    $("#login").prop("disable", false);
    if (result !== 0) {
        var errorStr = "";
        if (result === -10001) {
            errorStr = "WebRTCJSAPI初始化参数不正确";
        } else if (result === -10002) {
            errorStr = "浏览器版本不正确";
        } else if (result === -10003) {
            errorStr = "sig校验失败";
        } else if (result === -10006) {
            errorStr = "WebSocket 初始化失败";
        } else {
            errorStr = "初始化错误";
        }
        $.toptip(errorStr, 'error');
    } else {
        WebRTCAPI.createRoom(String(RoomNumber), onCreateRoomCallback);
    }
}

function toggle(element) {
    var isMute = false;
    if (element.classList.contains("off")) {
        element.classList.remove("off");
        isMute = false;
    } else {
        element.classList.add("off");
        isMute = true;
    }
    return isMute;
}


function webimRegister() {
    //注册
    var username = $("#username").val();
    var pwd = $("#password").val();
    if (!$.trim(username) || !$.trim(pwd)) {
        $.toptip('用户名密码不能为空', 'error');
        return;
    }
    var jsonObj = {
        "id": username,
        "pwd": pwd
    };
    $.ajax({
        type: "POST",
        url: "https://sxb.qcloud.com/sxb_new/?svc=account&cmd=regist",
        data: JSON.stringify(jsonObj),
        success: function(json) {
            if (json.errorCode == 0) {
                $.toptip("注册成功", 'success');
            } else {
                $.toptip(json.errorInfo, 'error');
            }
        }
    });
}

//sdk登录
function ilvbLogin(opt) {
    loginInfo.identifier = opt.username;
    $.ajax({
        type: "POST",
        url: "https://sxb.qcloud.com/sxb_new/?svc=account&cmd=login",
        data: JSON.stringify({
            "id": loginInfo.identifier,
            "pwd": opt.password,
            "appid": parseInt(loginInfo.sdkAppID)
        }),
        success: function(data) {
            if (data && data.errorCode === 0) {
                loginInfo.token = data.data.token;
                loginInfo.userSig = data.data.userSig;
                store.set('loginInfo', loginInfo);
                if (opt.success) {
                    opt.success();
                }
                getRoomList();
                // webimLogin();
            } else {
                $.toptip(data.errorInfo, 'error');
                $.toptip("获取UserSig失败, Info = " + JSON.stringify(data), 'error');
            }
        },
        error: function(error, xhr) {
            $.toptip("初始化失败！！！get user sig ajax failed! error : " + error, 'error');
            console.error("get user sig ajax failed!");
        }
    });
}


function initRTC() {
    var ret = WebRTCAPI.init(rtclistener, {
        "openid": loginInfo.identifier,
        "userSig": loginInfo.userSig,
        "sdkAppId": String(loginInfo.sdkAppID),
        "accountType": String(loginInfo.accountType)
    });
    if (ret !== 0) {
        $.toptip("初始化失败！！！", 'error');
    }
}
//过滤随心播svr返回的房间名，只有特定名字的才展示在列表
function filterLiveRoomName(rooms) {
    var ret = [];
    $.each(rooms, function(idx, item) {
        if (true || item.indexOf('') !== -1) {
            ret.push(item);
        }
    });
    return ret;
}

function getRoomList(cb) {
    $("#input-container").hide();
    $("#main-container").show();

    $.ajax({
        type: "POST",
        url: "https://sxb.qcloud.com/sxb_new/?svc=live&cmd=roomlist",
        data: JSON.stringify({
            "type": 'live',
            "token": loginInfo.token,
            "index": 0,
            "size": 30,
            "appid": loginInfo.sdkAppID
        }),
        success: function(data) {
            if (data && data.errorCode === 0) {
                if (cb) cb();
            } else {
                ajaxErrorCallback(data);
            }
        },
        error: function(error, xhr) {}
    });
}

function refreshRoom() {
    getRoomList();
}


function ajaxErrorCallback(data) {
    switch (data.errorCode) {
        case 10009:
            $.toptip("登录态失效,请重新登录", 'error');
            store.clear();
            setTimeout(function() {
                location.reload();
            }, 1500);
            break;
    }
}



App.init();