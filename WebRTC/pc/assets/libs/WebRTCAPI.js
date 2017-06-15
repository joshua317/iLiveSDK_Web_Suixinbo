/**
 * Created by wadesheng on 2017/3/31.
 */
"use strict";

var WebRTCAPI = {
    /*
     *  步骤：
     *       1: init
     *       2: createRoom
     *       3: startWebRTC
     *       ...
     *       房间控制
     *       ...
     *       4: quit
     *
     * */
    /*
     * function init
     *   API初始化，TLS登录 webim sdk登录
     * params:
     *   listener :  -事件回调函数集合, 详见下面
     *   {
     *      onRemoteCloseAudio: function(),     -对端关闭音频输入通知(默认开启)
     *      onRemoteLeave: function(),          -对端连接关闭通知
     *      onRemoteCloseVideo: function(),     -对端关闭视频输入通知(默认开启)
     *      onKickout: function(),              -自己被踢下线通知
     *      onInitResult: function(result),     -WebRTCAPI 初始化结果
     *      onLocalStreamAdd: function(stream), -本地媒体数据采集成功通知  stream为 MediaStream对象
     *      onRemoteStreamAdd: function(stream) -对端媒体数据采集成功通知  stream为 MediaStream对象
     *   }
     * return:
     *   true                                   -params符合要求，返回true
     *   false                                  -params不符合要求，返回false
     * */
    init: function (listener, config) {
    },

    /*
     * function createRoom
     *   创建会话房间
     * params :
     *   roomid :                               -房间号  数字
     *   callback : function(result)            -返回回调
     * return:
     *   true                                   -params符合要求并且已经初始化，返回true
     *   false                                  -params不符合要求或者没有初始化，返回false
     * */
    createRoom: function (roomid, callback) {
    },

    /*
     * function startWebRTC
     *   启动WebRTC
     * params :
     *   callback : function(result)             -启动WebRTC回调
     * return:
     *   true                                    -params符合要求并且已经初始化并且房间创建成功，返回true
     *   false                                   -params不符合要求或者没有初始化或者没有创建成功房间，返回false
     * */
    startWebRTC: function (callback) {
    },

    /*
     * function closeVideo
     *   关闭视频
     * params :
     *   null
     * return:
     *   true                                    -params关闭成功，返回true
     *   false                                   -params关闭失败，返回false
     * */
    closeVideo: function () {
    },

    /*
     * function openVideo
     *   打开视频（默认初始化打开）
     * params :
     *   null
     * return:
     *   true                                    -params打开成功，返回true
     *   false                                   -params打开失败，返回false
     * */
    openVideo: function () {
    },

    /*
     * function closeAudio
     *   关闭音频
     * params :
     *   null
     * return:
     *   true                                    -params关闭成功，返回true
     *   false                                   -params关闭失败，返回false
     * */
    closeAudio: function () {
    },

    /*
     * function openAudio
     *   打开音频（默认初始化打开）
     * params :
     *   null
     * return:
     *   true                                    -params打开成功，返回true
     *   false                                   -params打开失败，返回false
     * */
    openAudio: function () {
    },

    /*
     * function quit
     *   退出（会清除掉tls和imweb sdk的登录态）
     * params :
     *   null
     * return :
     *   true                                      -params退出成功，返回true
     *   false                                     -params退出失败，返回false
     * */
    quit: function () {
    }
};

var webrtc = {
    init: function (conf, callback) {
    },
    createRoom: function (roomid, callback) {
    },
    startWebRTC: function (callback) {
    },
    setlistener: function (listener) {
    },
    closeVideo: function () {
    },
    closeAudio: function () {
    },
    openVideo: function () {
    },
    openAudio: function () {
    },
    quit: function () {
    }
};

(function (webrtc) {
    var global = new function () {
        this.relayip = null;
        this.dataport = null;
        this.stunport = null;
        this.websocket = null;
        this.peerConnection = null;
        this.WEBRTC_WS_SERVER = "wss://webrtc.qq.com:8687";
        this.WEBRTC_STUN_SERVER = "";
        this.WEBRTC_CGI_SERVER = "https://webrtc.qq.com:8687/webrtc/";
        this.COOKIE_EXPIRES_TIME = 3600 * 24;
        this.isSdpSendOK = false;
        this.hasSendCandidate = false;
        this.localCandidateList = [];
        this.config = {
            sdkAppId: "",
            openid: "",
            tinyid: "",
            userSig: "",
            accountType : ""
        };
        this.roomid = -1;
        this.localStream = null;
        this.constraintVideo = {
            "optional": [{
                "exactWidth": "640"
            }, {
                "exactHeight": "480"
            }],
            "mandatory": {}
        };

        this.constraints = {
            "audio": true,
            "video": this.constraintVideo
        };

        this.offerSdpOption = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
            voiceActivityDetection: false
        };

        this.RTC_EVENT = {
            ON_PEER_SDP: "on_peer_sdp",
            ON_PEER_CANDIDATE: "on_peer_candidate",
            ON_BIND_SESSION: "on_bind_session",
            ON_MEDIA_CHANGE: "on_media_change",
            ON_START_CHAT: "on_start_chat",
            ON_QUIT_CHAT: "on_quit_chat",
            ON_CREATE_ROOM : "on_create_room"
        };

        this.MEDIA_CHANGE = {
            OPEN_VIDEO: 1,
            CLOSE_VIDEO: 2,
            OPEN_AUDIO: 3,
            CLOSE_AUDIO: 4
        };

        this.WS_CMD = {
            SDP: 0x2,
            CANDIDATE: 0x4,
            MEDIA_CHANGE: 0x0d,
            START_CHAT: 0x06,
            QUIT_CHAT: 0x08,
            ON_STAGE: 0x0c,
            WS_INIT_OK: 0x13,
            CREATE_ROOM_RESULT : 0x14
        };
    };

    var rtclistener = new function () {
        this.config = {
            onRemoteLeave: null,
            onLocalStreamAdd: null,
            onPeerStreamAdd: null,
            onMediaChange: null,
            onCreateRoomResult: null,
            onWebSocketInit: null
        };
    };

    var rtcLog = new function () {
        var TAG = "WEBRTC_API : ";
        this._debugLogOpen = true;
        this.openDebugLog = function () {
            this._debugLogOpen = true;
        };
        this.closeDebugLog = function () {
            this._debugLogOpen = false;
        };
        this.error = function (msg) {
            console.error(TAG + msg);
        };
        this.debug = function (msg) {
            if (!this._debugLogOpen) {
                return;
            }
            console.log(TAG + msg);
        }
    };

    var checkConfig = function () {
        if (!global.config.openid || !global.config.userSig || !global.config.sdkAppId) {
            rtcLog.error("config is null!!! config = " + JSON.stringify(global.config));
            return false;
        }
        return true;
    };

    var initWebSocket = function (callback) {
        try {
            rtclistener.config.onWebSocketInit = callback;
            //set userSig appid identifer in url
            var identifier = encodeURIComponent(global.config.openid).replace(/'/g,"%27").replace(/"/g,"%22");
            var url = global.WEBRTC_WS_SERVER + "?" + "userSig=" + global.config.userSig + "&sdkAppid=" + global.config.sdkAppId + "&identifier=" + identifier;
            global.websocket = new WebSocket(url);
            global.websocket.onmessage = wsonmessage;
            global.websocket.onopen = wsonopen;
            global.websocket.onerror = wsonerror;
            global.websocket.onclose = wsonclose;
        } catch (e) {
            rtclistener.config.onWebSocketInit(-10005);
            var errorStr = "init web socket failed!!! exception = " + e;
            alert(errorStr);
            rtcLog.error(errorStr);
        }
    };

    var setlistener = function (listeners) {

        if (!listeners.onRemoteLeave || !listeners.onLocalStreamAdd || !listeners.onPeerStreamAdd || !listeners.onMediaChange) {
            rtcLog.error("listener is empty!!!");
            return false;
        }
        rtclistener.config.onMediaChange = listeners.onMediaChange;
        rtclistener.config.onRemoteLeave = listeners.onRemoteLeave;
        rtclistener.config.onLocalStreamAdd = listeners.onLocalStreamAdd;
        rtclistener.config.onPeerStreamAdd = listeners.onPeerStreamAdd;
        return true;
    };

    var getLocalStream = function (callback) {
        navigator.getUserMedia(global.constraints, function (media) {
            rtcLog.debug("get user media ok!!!");
            global.localStream = media;
            if (global.peerConnection) {
                global.peerConnection.addStream(media);
            }
            callback(0, media);
        }, function (error) {
            rtcLog.error("get user media failed : error = " + error);
            callback(-10008, error);
        });
    };

    var getSdp = function (callback) {
        global.peerConnection.createOffer(global.offerSdpOption).then(function (offer) {
            return global.peerConnection.setLocalDescription(offer);
        }).then(function () {
            var desc = global.peerConnection.localDescription;
            rtcLog.debug("get local sdp info : " + desc.sdp);
            callback(0, desc);
        }).catch(function (reason) {
            console.error("create offer failed : reason = " + reason);
            callback(-10009, reason);
        });
    };

    var clearGlobalValues = function () {
        global.hasSendCandidate = false;
        global.isSdpSendOK = false;
        global.localCandidateList = [];
        global.config =  {
            sdkAppId: "",
            openid: "",
            tinyid: "",
            userSig: "",
            accountType : ""
        };
    };

    var createPeerConnection = function () {
        clearGlobalValues();
        var stun = {
            iceServers: [{
                urls: global.WEBRTC_STUN_SERVER
            }],
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require",
            tcpCandidatePolicy: "disable",
            IceTransportsType: "nohost"
        };

        var optional = {
            optional: [{
                DtlsSrtpKeyAgreement: true
            }]
        };
        try {
            global.peerConnection = new RTCPeerConnection(stun, optional);
            global.peerConnection.onicecandidate = onIceCandidate;
            global.peerConnection.onaddstream = onTrack;
            global.peerConnection.oniceconnectionstatechange = onIceConnectionStateChange;
            global.peerConnection.onremovestream = onRemoveStream;

        } catch (e) {
            console.error("create peer connection failed!!! e = " + e);
            return false;
        }
        return true;
    };

    var wsonopen = function () {
        rtcLog.debug("web socket init success");
    };
    var wsonmessage = function (message) {
        var msg = message.data;
        var resJson = JSON.parse(msg);
        var cmd = resJson.cmd;
        rtcLog.debug("on websocket message, cmd = " + cmd);
        if (cmd === global.WS_CMD.CANDIDATE) {
            onRemoteCandidate(resJson.content);
        } else if (cmd === global.WS_CMD.SDP) {
            onRemoteSdp(resJson.content);
        } else if (cmd === global.WS_CMD.MEDIA_CHANGE) {
            onMediaChange(resJson.content);
        } else if (cmd === global.WS_CMD.QUIT_CHAT) {
            onQuitChat(resJson.content);
        } else if (cmd === global.WS_CMD.START_CHAT) {

        } else if (cmd === global.WS_CMD.WS_INIT_OK) {
            global.websocket.socketid = resJson.content.socketid;
            global.relayip = resJson.content.relayip;
            global.dataport = resJson.content.dataport;
            global.stunport = resJson.content.stunport;
            global.WEBRTC_STUN_SERVER = "stun:" + global.relayip + ":" + global.stunport;
            console.log("WS_INIT_OK : data = " + JSON.stringify(resJson.content) + " , stun server = " + global.WEBRTC_STUN_SERVER);
            rtclistener.config.onWebSocketInit(0);
        } else if (cmd === global.WS_CMD.CREATE_ROOM_RESULT) {
            var data = resJson.content;
            if (data.ret !== 0) {
                rtcLog.error("create room error!!! e = " + data.error);
                rtclistener.config.onCreateRoomResult(data.ret);
                return;
            }
            global.roomid = data.data.roomid;
            global.config.tinyid = data.data.tinyid;
            rtcLog.debug("create room ok!!! data = " + JSON.stringify(data.data));
            rtclistener.config.onCreateRoomResult(0);
        }
    };
    var wsonerror = function (error) {
        var errorStr = "websocket error : " + error;
        alert(errorStr);
        rtcLog.error(errorStr);
    };
    var wsonclose = function () {
        rtcLog.error("websocket close!");
    };

    var filterIceCandidate = function (candidate) {
        var str = candidate.candidate;
        if (str.indexOf("tcp") !== -1) {
            return false;
        }
        var type = getIceCandidateType(candidate);
        if (type !== "srflx") {
            return false;
        }
        return true;
    };

    var getIceCandidateType = function (candidate) {
        try {
            var str = candidate.candidate;
            var params = str.split(" ");
            return params[7];
        } catch (e) {
            console.error("Get Ice Candidate Type Error : e = " + e);
            return null;
        }
    };

    var onIceCandidate = function (e) {
        var candidate = e.candidate;
        if (!candidate) {
            rtcLog.debug("Ice Candidate End!");
            return;
        }
        rtcLog.debug("on ice candidate : sdpMLineIndex = " + candidate.sdpMLineIndex
            + " , sdpMid = " + candidate.sdpMid
            + " , candidate = " + candidate.candidate);

        if (filterIceCandidate(candidate)) {
            var msg = {
                sdpMLineIndex: candidate.sdpMLineIndex,
                sdpMid: candidate.sdpMid,
                candidate: candidate.candidate
            };
            if (global.isSdpSendOK && !global.hasSendCandidate) {
                rtcLog.debug("send candidate when ice end!");
                global.hasSendCandidate = true;
                sendLocalCandidate(msg);
            }
            global.localCandidateList.push(msg);
        }
    };
    var onTrack = function (e) {
        rtcLog.debug("on track");
        rtclistener.config.onPeerStreamAdd(e.stream);
    };
    var onIceConnectionStateChange = function (e) {
        var str = "on ice connection state change : iceConnectionState = " + e.target.iceConnectionState + " , iceGatheringState = " + e.target.iceGatheringState;
        if (e.target.iceConnectionState === "failed" || e.target.iceGatheringState === "failed") {
            alert(str);
        }
        rtcLog.debug("on ice connection state change : iceConnectionState = " + e.target.iceConnectionState + " , iceGatheringState = " + e.target.iceGatheringState);
    };
    var onRemoveStream = function (e) {

    };
    var onRemoteCandidate = function (remoteCandidate) {
        rtcLog.debug("on peer candidate : remote candidate = " + JSON.stringify(remoteCandidate));
        global.peerConnection.addIceCandidate(remoteCandidate, function () {
            rtcLog.debug("add ice candidate ok");
        }, function (e) {
            rtcLog.error("error e = " + e);
        });
    };

    var sendLocalCandidate = function (candidate) {
        var sendData = createJsonFromTag(global.RTC_EVENT.ON_PEER_CANDIDATE);
        sendData.data = candidate;
        global.websocket.send(JSON.stringify(sendData));
    };
    var onRemoteSdp = function (remoteSdp) {
        rtcLog.debug("on anwser sdp : " + remoteSdp.sdp);
        global.peerConnection.setRemoteDescription(new RTCSessionDescription(remoteSdp), function () {
            if (global.localCandidateList.length > 0 && !global.hasSendCandidate) {
                global.hasSendCandidate = true;
                sendLocalCandidate(global.localCandidateList[global.localCandidateList.length - 1]);
            }
            global.isSdpSendOK = true;
        }, function (e) {
            alert(e);
            console.log(e);
        });
    };

    var onMediaChange = function (info) {

    };
    var onQuitChat = function (info) {

    };

    var createSendJson = function (tag) {
        return {
            tag_key: tag,
            data: null
        }
    };

    var openRoom = function (openid, tinyid, roomid, userSig) {
        rtcLog.debug("open room : openid = " + openid + " , tinyid = " + tinyid + " , roomid = " + roomid);

        var sendData = createJsonFromTag(global.RTC_EVENT.ON_CREATE_ROOM);
        sendData.data = {
            openid: openid,
            tinyid: tinyid,
            roomid: roomid,
            sdkAppID: global.config.sdkAppId,
            socketid: global.websocket.socketid,
            userSig:  global.config.userSig,
            relayip : global.relayip,
            dataport : global.dataport,
            stunport : global.stunport
        };
        global.websocket.send(JSON.stringify(sendData));
        return true;
    };

    var createJsonFromTag = function (tag) {
        return {
            tag_key: tag,
            data: ""
        };
    };

    var sendSdp = function (sdp) {
        var sendData = createJsonFromTag(global.RTC_EVENT.ON_PEER_SDP);
        sendData.data = sdp;
        global.websocket.send(JSON.stringify(sendData));
    };

    var changeLocalMedia = function (isVideo, isOpen) {
        rtcLog.debug("change local media : is video : " + isVideo + " , is open = " + isOpen);
        if (!global.localStream) {
            rtcLog.error("change local media failed! local media is null");
            return false;
        }
        var tracks = null;
        var mediaType = 0;
        if (isVideo) {
            tracks = global.localStream.getVideoTracks();
            if (isOpen) {
                mediaType = global.WS_CMD.OPEN_VIDEO;
            } else {
                mediaType = global.WS_CMD.CLOSE_VIDEO;
            }
        } else {
            tracks = global.localStream.getAudioTracks();
            if (isOpen) {
                mediaType = global.WS_CMD.OPEN_AUDIO;
            } else {
                mediaType = global.WS_CMD.CLOSE_AUDIO;
            }
        }
        for (var i = 0; i < tracks.length; i++) {
            tracks[i].enabled = isOpen;
        }
        if (global.websocket) {
            var sendData = createSendJson(global.RTC_EVENT.ON_MEDIA_CHANGE);
            sendData.data = {
                mediatype: mediaType
            };
            global.websocket.send(JSON.stringify(sendData));
        }
        return true;
    };
    webrtc.init = function (config, callback) {
        global.config.userSig = config.userSig;
        global.config.openid = config.openid;
        global.config.sdkAppId = config.sdkAppId;
        global.config.accountType = config.accountType;

        //check sig
        var requestUrl = global.WEBRTC_CGI_SERVER + "checksig?callback=?";
        var sendData = {
            openid: global.config.openid,
            userSig: global.config.userSig,
            sdkAppID: global.config.sdkAppId
        };

        var strSendData = "data=" + JSON.stringify(sendData);
        $.ajax({
            type: "GET",
            dataType: 'jsonp',
            jsonp: 'callback',
            url: requestUrl,
            data: strSendData,
            success: function (data) {
                if (!data || data.ret !== 0) {
                    rtcLog.error("Check userSig failed!!!");
                    callback(-10003);
                    return;
                }
                rtcLog.debug("Check userSig ok!!!");
                initWebSocket(function (ret) {
                    callback(ret);
                });
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                var errorStr = "Check userSig ajax error!!! : readystate = " + XMLHttpRequest.readyState + " , status = " + XMLHttpRequest.status + " , responseText = " + XMLHttpRequest.responseText + " , textStatus = " + textStatus;
                alert(errorStr);
                rtcLog.debug(errorStr);
                callback(-10012);
            }
        });
        return 0;
    };

    webrtc.createRoom = function (roomid, callback) {
        rtclistener.config.onCreateRoomResult = callback;
        openRoom(global.config.openid, global.config.tinyid, roomid, global.config.userSig);
    };

    webrtc.setlistener = function (listener) {
        return setlistener(listener);
    };
    webrtc.quit = function () {

        if (global.localStream) {
            global.localStream.getTracks().forEach(function (track) {
                track.stop();
            });
            global.localStream = null;
        }
        if (global.peerConnection) {
            global.peerConnection.close();
            global.peerConnection = null;
        }
        if (global.websocket) {
            global.websocket.close();
            global.websocket = null;
        }
        clearGlobalValues();
    };
    webrtc.closeAudio = function () {
        return changeLocalMedia(false, false);
    };
    webrtc.closeVideo = function () {
        return changeLocalMedia(true, false);
    };
    webrtc.openAudio = function () {
        return changeLocalMedia(false, true);
    };
    webrtc.openVideo = function () {
        return changeLocalMedia(true, true);
    };
    webrtc.startWebRTC = function (callback) {
        if (!createPeerConnection()) {
            callback(-10007);
            return;
        }
        getLocalStream(function (result, info) {
            if (result !== 0) {
                rtcLog.error("get local stream failed! e = " + info);
                callback(result);
                return;
            }
            rtclistener.config.onLocalStreamAdd(info);

            getSdp(function (result, info) {
                if (result !== 0) {
                    rtcLog.error("get local sdp failed!!! e = " + info);
                    callback(result);
                    return;
                }
                sendSdp(info);
                callback(0);
            });
        });
    };
})(webrtc);

(function (WebRTCAPI) {
    var global = new function () {
        this.config = {
            openid        : "",
            userSig       : "",
            sdkAppId      : "",
            accountType   : ""
        };
        this.jumpurl = null;
        this.listener = {
            onRemoteCloseVideo: null,
            onRemoteCloseAudio: null,
            onRemoteLeave: null,
            onKickout: null,
            onInitResult: null
        };
        this.roomid = 0;
    };

    var onMediaChange = function (isVideo, isOpen) {

    };

    var onRemoteLeave = function () {

    };

    var onLocalStreamAdd = function (stream) {
        console.log("local stream add!!!");
        global.listener.onLocalStreamAdd(stream);
    };

    var onPeerStreamAdd = function (stream) {
        console.log("remote stream add!!!");
        global.listener.onRemoteStreamAdd(stream);
    };

    var webrtcListener = {
        onMediaChange: onMediaChange,
        onRemoteLeave: onRemoteLeave,
        onLocalStreamAdd: onLocalStreamAdd,
        onPeerStreamAdd: onPeerStreamAdd
    };

    var onKickOut = function () {
        console.error("On Kick Out!!!");
        webrtc.quit();
    };

    var getBrowserInfo = function () {
        var Sys = {};
        var ua = navigator.userAgent.toLowerCase();
        console.log('navigator.userAgent=' + ua);
        var s;
        (s = ua.match(/msie ([\d.]+)/)) ? Sys.ie = s[1] :
            (s = ua.match(/firefox\/([\d.]+)/)) ? Sys.firefox = s[1] :
                (s = ua.match(/chrome\/([\d.]+)/)) ? Sys.chrome = s[1] :
                    (s = ua.match(/opera.([\d.]+)/)) ? Sys.opera = s[1] :
                        (s = ua.match(/version\/([\d.]+).*safari/)) ? Sys.safari = s[1] : 0;
        if (Sys.ie) {//Js判断为IE浏览器
            return {
                'type': 'ie',
                'ver': Sys.ie
            };
        }
        if (Sys.firefox) {//Js判断为火狐(firefox)浏览器
            return {
                'type': 'firefox',
                'ver': Sys.firefox
            };
        }
        if (Sys.chrome) {//Js判断为谷歌chrome浏览器
            return {
                'type': 'chrome',
                'ver': Sys.chrome
            };
        }
        if (Sys.opera) {//Js判断为opera浏览器
            return {
                'type': 'opera',
                'ver': Sys.opera
            };
        }
        if (Sys.safari) {//Js判断为苹果safari浏览器
            return {
                'type': 'safari',
                'ver': Sys.safari
            };
        }
        return {
            'type': 'unknow',
            'ver': -1
        };
    };

    WebRTCAPI.init = function (listener, config) {
        if (!listener || !listener.onRemoteCloseVideo ||
            !listener.onRemoteLeave || !listener.onRemoteCloseAudio ||
            !listener.onInitResult  || !listener.onLocalStreamAdd   || !listener.onRemoteStreamAdd) {
            console.error("WebRTC API init failed! listener is incorrect!");
            return -10001;
        }

        global.listener.onRemoteCloseAudio = listener.onRemoteCloseAudio;
        global.listener.onRemoteLeave = listener.onRemoteLeave;
        global.listener.onRemoteCloseVideo = listener.onRemoteCloseVideo;
        global.listener.onInitResult = listener.onInitResult;
        global.listener.onLocalStreamAdd = listener.onLocalStreamAdd;
        global.listener.onRemoteStreamAdd = listener.onRemoteStreamAdd;

        //check config
        if (!config || !config.openid || !config.userSig || !config.sdkAppId || !config.accountType) {
            console.error("WebRTC API init failed! config is incorrect!");
            global.listener.onInitResult(-10001);
            return 0;
        }

        global.config = config;

        //check browser
        var info = getBrowserInfo();
        if (info.type !== "chrome" && info.type !== "firefox") {
            console.error("WebRTC API init failed! browser not support webrtc!");
            global.listener.onInitResult(-10002);
            return 0;
        }
        webrtc.setlistener(webrtcListener);
        return webrtc.init(global.config, function (ret) {
            global.listener.onInitResult(ret);
        });
    };

    WebRTCAPI.createRoom = function (roomid, callback) {
        return webrtc.createRoom(roomid, callback);
    };

    WebRTCAPI.startWebRTC = function (callback) {
        return webrtc.startWebRTC(callback);
    };

    WebRTCAPI.closeAudio = function () {
        return webrtc.closeAudio();
    };

    WebRTCAPI.closeVideo = function () {
        return webrtc.closeVideo();
    };

    WebRTCAPI.openAudio = function () {
        return webrtc.openAudio();
    };

    WebRTCAPI.openVideo = function () {
        return webrtc.openVideo();
    };

    WebRTCAPI.quit = function () {
        return webrtc.quit();
    };
})(WebRTCAPI);
