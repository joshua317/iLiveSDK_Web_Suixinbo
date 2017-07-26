/**
 * Created by wadesheng on 2017/7/14.
 */
"use strict";
var WebRTCAPI = {
    version: "0.0.1",
    GLOBAL: {
        AudioContext: null,
        PeerConnections: null,

    },
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
    init: function(listener, config) {},

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
    createRoom: function(roomid, callback) {},

    /*
     * function startWebRTC
     *   启动WebRTC
     * params :
     *   callback : function(result)             -启动WebRTC回调
     * return:
     *   true                                    -params符合要求并且已经初始化并且房间创建成功，返回true
     *   false                                   -params不符合要求或者没有初始化或者没有创建成功房间，返回false
     * */
    startWebRTC: function(callback) {},

    /*
     * function closeVideo
     *   关闭视频
     * params :
     *   null
     * return:
     *   true                                    -params关闭成功，返回true
     *   false                                   -params关闭失败，返回false
     * */
    closeVideo: function() {},

    /*
     * function openVideo
     *   打开视频（默认初始化打开）
     * params :
     *   null
     * return:
     *   true                                    -params打开成功，返回true
     *   false                                   -params打开失败，返回false
     * */
    openVideo: function() {},

    /*
     * function closeAudio
     *   关闭音频
     * params :
     *   null
     * return:
     *   true                                    -params关闭成功，返回true
     *   false                                   -params关闭失败，返回false
     * */
    closeAudio: function() {},

    /*
     * function openAudio
     *   打开音频（默认初始化打开）
     * params :
     *   null
     * return:
     *   true                                    -params打开成功，返回true
     *   false                                   -params打开失败，返回false
     * */
    openAudio: function() {},

    /*
     * function quit
     *   退出（会清除掉tls和imweb sdk的登录态）
     * params :
     *   null
     * return :
     *   true                                      -params退出成功，返回true
     *   false                                     -params退出失败，返回false
     * */
    quit: function(wsnotify) {}
        /*
         * function quit
         *   退出（会清除掉tls和imweb sdk的登录态）
         * params :
         *   notify                                    -params wsnotify 为true时，会触发websocket的close回调，默认不触发
         * */
};

var webrtc = {
    init: function(conf, callback) {},
    createRoom: function(roomid, callback) {},
    startWebRTC: function(callback) {},
    setlistener: function(listener) {},
    closeVideo: function() {},
    closeAudio: function() {},
    openVideo: function() {},
    openAudio: function() {},
    quit: function() {}
};

var SvrDomain = "webrtc.qq.com";
if (/test(\d*)\.rtc\.qq\.com/.test(document.domain)) {
    SvrDomain = document.domain;
}

(function(webrtc) {
    var global = new function() {
        this.relayip = null;
        this.dataport = null;
        this.stunport = null;
        this.websocket = null;
        this.peerConnection = null;
        this.peerConnections = {};
        this.remoteStreams = {};
        this.preReportData = null;
        this.WEBRTC_WS_SERVER = "wss://" + SvrDomain + ":8687";
        this.WEBRTC_STUN_SERVER = "";
        this.WEBRTC_CGI_SERVER = "https://" + SvrDomain + ":8687/webrtc/";
        this.COOKIE_EXPIRES_TIME = 3600 * 24;
        this.notify = false;
        this.config = {
            sdkAppId: "",
            openid: "",
            tinyid: "",
            srctinyid: "",
            userSig: "",
            accountType: ""
        };
        this.reportSto = null;
        this.roomid = -1;
        this.localStream = null;
        //this.constraintVideo = { width: { exact: 640 }, height: { exact: 368 }, frameRate: { exact: 20 }, googCpuOveruseDetection: false };

        this.constraints = {
            "audio": true,
            "video": true //this.constraintVideo
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
            ON_CREATE_ROOM: "on_create_room",
            ON_CREATE_PEER: "on_create_peer",
            ON_QUALITY_REPORT: "on_quality_report"
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
            CREATE_ROOM_RESULT: 0x14,
            NOTIFY_CREATE_PEER_CONNECTION: 0x10, //通知建立新peerconnection
            NOTIFY_CREATE_PEER_CONNECTION_RES: 0x11, //通知建立新peerconnection
            NOTIFY_CLOSE_PEER_CONNECTION: 0x12, //通知关闭peerconnection
        };
    };
    WebRTCAPI.GLOBAL.PeerConnections = global.peerConnections;
    var rtclistener = new function() {
        this.config = {
            onRemoteLeave: null,
            onLocalStreamAdd: null,
            onPeerStreamAdd: null,
            onPeerStreamRemove: null,
            onMediaChange: null,
            onCreateRoomResult: null,
            onCreatePeerResult: null,
            onWebSocketInit: null,
            onWSClose: null
        };
    };

    var rtcLog = new function() {
        var TAG = "WEBRTC_API : ";
        this._debugLogOpen = true;
        this.openDebugLog = function() {
            this._debugLogOpen = true;
        };
        this.closeDebugLog = function() {
            this._debugLogOpen = false;
        };
        this.error = function(msg) {
            console.error(TAG + msg);
        };
        this.debug = function(msg) {
            if (!this._debugLogOpen) {
                return;
            }
            console.log(TAG + msg);
        }
    };

    var checkConfig = function() {
        if (!global.config.openid || !global.config.userSig || !global.config.sdkAppId) {
            rtcLog.error("config is null!!! config = " + JSON.stringify(global.config));
            return false;
        }
        return true;
    };

    var initWebSocket = function(callback) {
        try {
            if (callback) {
                rtclistener.config.onWebSocketInit = callback;
            }
            //set userSig appid identifer in url
            var identifier = encodeURIComponent(global.config.openid).replace(/'/g, "%27").replace(/"/g, "%22");
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

    var setlistener = function(listeners) {
        if (!listeners.onRemoteLeave || !listeners.onLocalStreamAdd || !listeners.onPeerStreamAdd || !listeners.onPeerStreamRemove || !listeners.onMediaChange) {
            rtcLog.error("listener is empty!!!");
            return false;
        }
        rtclistener.config.onMediaChange = listeners.onMediaChange;
        rtclistener.config.onRemoteLeave = listeners.onRemoteLeave;
        rtclistener.config.onLocalStreamAdd = listeners.onLocalStreamAdd;
        rtclistener.config.onPeerStreamAdd = listeners.onPeerStreamAdd;
        rtclistener.config.onPeerStreamRemove = listeners.onPeerStreamRemove;
        rtclistener.config.onWSClose = listeners.onWSClose;
        rtclistener.config.onRelayTimeout = listeners.onRelayTimeout;
        rtclistener.config.onKickout = listeners.onKickout;
        rtclistener.config.onIceConnectionClose = listeners.onIceConnectionClose;
        return true;
    };

    var getLocalStream = function(callback) {
        navigator.getUserMedia(global.constraints, function(media) {
            rtcLog.debug("get user media ok!!!");
            // //处理音频音量
            // WebRTCAPI.GLOBAL.AudioContext = WebRTCAPI.GLOBAL.AudioContext || new AudioContext();
            // var ctx = WebRTCAPI.GLOBAL.AudioContext;
            // var source = ctx.createMediaStreamSource(media);
            // var audio = ctx.createMediaStreamDestination();
            // global.gainNode = ctx.createGain();
            // source.connect(global.gainNode);
            // global.gainNode.connect(audio);
            // global.gainNode.gain.value = 1;
            // //删除原来的音轨
            // media.getAudioTracks().forEach(function(item) {
            //     media.removeTrack(item);
            // });
            // media.addTrack(audio.stream.getTracks()[0]);

            //origin

            WebRTCAPI.GLOBAL.LocalStream = global.localStream = media;
            var peerConnection = global.peerConnections[0];
            if (peerConnection) {
                peerConnection.addStream(media);
            }
            callback(0, media);
        }, function(error) {
            rtcLog.error("get user media failed : error = " + error);
            callback(-10008, error);
        });
    };

    var dropSsrc = function(sdp) {
        return sdp;
        //本地sdp去掉ssrc
        //先屏蔽处理逻辑
        var arr = [];
        sdp.split("\r\n").forEach(function(item) {
            if (item.indexOf("a=ssrc") !== 0) {
                arr.push(item);
            } else {
                console.error("drop", item);
            }
        });
        return arr.join("\r\n");
    };


    var getSdp = function(srctinyid, callback) {
        if (!srctinyid) {
            srctinyid = 0;
        }
        var peerConnection = global.peerConnections[srctinyid];
        var offerOption = global.offerSdpOption;
        if (srctinyid === 0) {
            offerOption.offerToReceiveAudio = false;
            offerOption.offerToReceiveVideo = false;
        } else {
            offerOption.offerToReceiveAudio = true;
            offerOption.offerToReceiveVideo = true;
        }
        peerConnection.createOffer(offerOption).then(function(offer) {
            return peerConnection.setLocalDescription(offer);
        }).then(function() {
            var desc = peerConnection.localDescription;
            //desc.sdp = dropSsrc(desc.sdp);
            rtcLog.debug("get local sdp info : " + desc.sdp);
            callback(0, desc);
        }).catch(function(reason) {
            rtcLog.error("create offer failed : reason = " + reason);
            callback(-10009, reason);
        });
    };

    var clearGlobalValues = function() {
        // global.hasSendCandidate = false;
        // global.isSdpSendOK = false;
        // global.localCandidateList = [];
        global.config = {
            sdkAppId: "",
            openid: "",
            tinyid: "",
            srctinyid: "",
            userSig: "",
            accountType: ""
        };
    };

    var createPeerConnection = function(srctinyid) {
        rtcLog.debug('createPeerConnection with srctinyid:' + srctinyid);
        // clearGlobalValues();
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
            var peerConnection = new RTCPeerConnection(stun, optional);
            peerConnection.onicecandidate = function(e) {
                onIceCandidate(e, srctinyid);
            };
            peerConnection.onaddstream = function(e) {
                rtcLog.debug('onaddstream');
                onTrack(e, srctinyid);
            };
            peerConnection.oniceconnectionstatechange = function(e) {
                onIceConnectionStateChange(e, srctinyid);
                rtcLog.debug('onIceConnectionStateChange', e);
            };
            peerConnection.localCandidateList = [];
            peerConnection.isSdpSendOK = false;
            peerConnection.hasSendCandidate = false;
            global.peerConnections[srctinyid] = peerConnection;

        } catch (e) {
            rtcLog.error("create peer connection failed!!! e = " + e);
            return false;
        }
        return true;
    };

    var wsonopen = function() {
        rtcLog.debug("web socket init success");
    };
    var setConstraints = function(videoCtrlAbility) {
        if (videoCtrlAbility) {
            rtcLog.debug("videoCtrlAbility.length=" + videoCtrlAbility.length);
            if (videoCtrlAbility.length > 0) {
                var VidWidth = videoCtrlAbility[0].VidWidth;
                var VidHeight = videoCtrlAbility[0].VidHeight;
                var VidFr = videoCtrlAbility[0].VidFr;
                var CpuOverUseDetect = videoCtrlAbility[0].CpuOverUseDetect;

                if (VidWidth > 0 && VidHeight > 0 && VidFr > 0) {
                    global.constraints = {
                        "audio": true,
                        "video": { width: { exact: VidWidth }, height: { exact: VidHeight }, frameRate: { exact: VidFr }, googCpuOveruseDetection: CpuOverUseDetect ? true : false }
                    };
                }
            }
        }
    };
    var wsonmessage = function(message) {
        var msg = message.data;
        var resJson = JSON.parse(msg);
        var cmd = resJson.cmd;
        rtcLog.debug("on websocket message, cmd = " + cmd);
        if (cmd === global.WS_CMD.CANDIDATE) {
            onRemoteCandidate(resJson.content, resJson.srctinyid);
        } else if (cmd === global.WS_CMD.SDP) {
            onRemoteSdp(resJson.content, resJson.srctinyid);
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
            rtcLog.debug("WS_INIT_OK : data = " + JSON.stringify(resJson.content) + " , stun server = " + global.WEBRTC_STUN_SERVER);
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
            global.config.srctinyid = data.data.srctinyid;
            if (data.data.videoability) {
                setConstraints(data.data.videoability);
            }
            rtcLog.debug("create room ok!!! data = " + JSON.stringify(data.data));
            webrtc.startWebRTC($.noop);
            rtclistener.config.onCreateRoomResult(0);
        } else if (cmd === global.WS_CMD.NOTIFY_CREATE_PEER_CONNECTION) {
            var data = resJson.content;
            global.config.sdkAppId = data.sdkAppId;
            global.config.userSig = data.userSig;
            addPeer(data.openid, data.tinyid, global.roomid, data.srctinyid, loginInfo.userSig, data.peerconnectionport);
        } else if (cmd === global.WS_CMD.NOTIFY_CREATE_PEER_CONNECTION_RES) {
            var data = resJson.content;
            global.roomid = data.data.roomid;
            global.config.tinyid = data.data.tinyid;
            global.config.srctinyid = data.data.srctinyid;
            //video control
            if (data.data.videoability) {
                setConstraints(data.data.videoability);
            }
            rtcLog.debug("add peer ok!!! data = " + JSON.stringify(data.data));
            webrtc.startWebRTC($.noop, data.data.srctinyid);
            reportQuality();
        } else if (cmd === global.WS_CMD.NOTIFY_CLOSE_PEER_CONNECTION) {
            var data = resJson.content;
            onRemoveStream(data);
        }
    };
    var wsonerror = function(error) {
        var errorStr = "websocket error : " + error;
        clearTimeout(global.reportSto);
        rtcLog.error(errorStr);
        if (global.notify) {
            rtclistener.config.onWSClose();
        }
    };
    //https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
    var wsonclose = function(e) {
        rtcLog.error("websocket close!");
        switch (e.code) {
            case 1000:
                //正常关闭
                break;
            default:
                break;
        }
        if (global.notify) {
            rtclistener.config.onWSClose();
        }
    };

    var filterIceCandidate = function(candidate) {
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

    var getIceCandidateType = function(candidate) {
        try {
            var str = candidate.candidate;
            var params = str.split(" ");
            return params[7];
        } catch (e) {
            console.error("Get Ice Candidate Type Error : e = " + e);
            return null;
        }
    };

    var onIceCandidate = function(e, srctinyid) {
        var pc = e.currentTarget;
        var candidate = e.candidate;
        if (!candidate) {
            rtcLog.debug("Ice Candidate End!");
            if (!pc.hasSendCandidate) {
                try {
                    var sendData = createJsonFromTag(global.RTC_EVENT.ON_CANDIDATE_FAILED);
                    sendData.data = {
                        openid: global.config.openid,
                        sessionid: global.roomid
                    };
                    if (global.websocket) {
                        global.websocket.send(JSON.stringify(sendData));
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            return;
        }
        rtcLog.debug("on ice candidate : sdpMLineIndex = " + candidate.sdpMLineIndex +
            " , sdpMid = " + candidate.sdpMid +
            " , candidate = " + candidate.candidate);

        if (filterIceCandidate(candidate)) {
            var msg = {
                sdpMLineIndex: candidate.sdpMLineIndex,
                sdpMid: candidate.sdpMid,
                candidate: candidate.candidate
            };
            if (pc.isSdpSendOK && !pc.hasSendCandidate) {
                rtcLog.debug("send candidate when ice end!");
                pc.hasSendCandidate = true;
                sendLocalCandidate(msg, srctinyid);
            }
            pc.localCandidateList.push(msg);
        }
    };
    var onTrack = function(e, srctinyid) {
        rtcLog.debug("on track", srctinyid);
        if (srctinyid != "0") {
            global.remoteStreams[srctinyid] = e.stream;
            rtclistener.config.onPeerStreamAdd(e.stream, srctinyid);
        }
    };
    var onIceConnectionStateChange = function(e, srctinyid) {
        var str = "on ice connection state change : iceConnectionState = " + e.target.iceConnectionState + " , iceGatheringState = " + e.target.iceGatheringState;
        if (e.target.iceConnectionState === "failed" || e.target.iceGatheringState === "failed") {
            rtclistener.config.onIceConnectionClose();
        }
        rtcLog.debug("on ice connection state change : iceConnectionState = " + e.target.iceConnectionState + " , iceGatheringState = " + e.target.iceGatheringState);
    };

    var onRemoveStream = function(data) {
        rtcLog.debug("on onRemoveStream", data);
        rtclistener.config.onPeerStreamRemove(data);
        var peerConnection = global.peerConnections[data.srctinyid];
        if (peerConnection) {
            if (peerConnection.signalingState != 'closed') {
                peerConnection.close();
            }
            peerConnection = null;
            delete global.peerConnections[data.srctinyid];
        }
        rtclistener.config.onPeerStreamRemove(data);
    };
    var onRemoteCandidate = function(remoteCandidate, srctinyid) {
        rtcLog.debug("on peer candidate : remote candidate = " + JSON.stringify(remoteCandidate) + ' ,srctinyid ' + srctinyid);
        var peerConnection = global.peerConnections[srctinyid || 0] || global.peerConnections[0];

        peerConnection.addIceCandidate(remoteCandidate, function() {
            rtcLog.debug("add ice candidate ok");
        }, function(e) {
            rtcLog.error("error e = " + e);
        });
    };

    var sendLocalCandidate = function(candidate, srctinyid) {
        if (candidate) {
            var sendData = createJsonFromTag(global.RTC_EVENT.ON_PEER_CANDIDATE);
            sendData.data = candidate;
            sendData.srctinyid = srctinyid || "0";
            global.websocket.send(JSON.stringify(sendData));
        }
    };
    var onRemoteSdp = function(remoteSdp, srctinyid) {
        rtcLog.debug("on anwser sdp : " + remoteSdp.sdp);
        var peerConnection = global.peerConnections[srctinyid || 0] || global.peerConnections[0];

        peerConnection.setRemoteDescription(new RTCSessionDescription(remoteSdp), function() {
            if (peerConnection.localCandidateList.length > 0 && !peerConnection.hasSendCandidate) {
                peerConnection.hasSendCandidate = true;
                sendLocalCandidate(peerConnection.localCandidateList[peerConnection.localCandidateList.length - 1], srctinyid);
            }
            peerConnection.isSdpSendOK = true;
        }, function(e) {
            try {
                var sendData = createJsonFromTag(global.RTC_EVENT.ON_SDP_FAILED);
                sendData.data = {
                    openid: global.config.openid,
                    sessionid: global.roomid
                };
                global.websocket.send(JSON.stringify(sendData));
            } catch (e) {
                console.log(e);
            }

            alert(e);
            console.log(e);
        });
    };

    var onMediaChange = function(info) {

    };
    var onQuitChat = function(info) {
        rtcLog.debug("onQuitChat , call onRelayTimeout");
        webrtc.quit();
        if (info.type == 'kick') {
            rtclistener.config.onKickout(info);
        } else {
            rtclistener.config.onRelayTimeout(info);
        }
    };

    var createSendJson = function(tag) {
        return {
            tag_key: tag,
            data: null
        }
    };

    var openRoom = function(openid, tinyid, roomid, userSig, peerconnectionport) {
        rtcLog.debug("open room : openid = " + openid + " , tinyid = " + tinyid + " ,  roomid = " + roomid);
        var sendData = createJsonFromTag(global.RTC_EVENT.ON_CREATE_ROOM);
        sendData.data = {
            openid: openid,
            tinyid: tinyid,
            peerconnectionport: peerconnectionport,
            roomid: roomid,
            sdkAppID: global.config.sdkAppId,
            socketid: global.websocket.socketid,
            userSig: userSig || global.config.userSig,
            relayip: global.relayip,
            dataport: global.dataport,
            stunport: global.stunport
        };
        //能力上报
        var reportData = typeof WebRTCStat !== "undefined" && WebRTCStat.ability(global.constraints);
        sendData.report = reportData || null;
        global.websocket.send(JSON.stringify(sendData));
        return true;
    };
    var addPeer = function(openid, tinyid, roomid, srctinyid, userSig, peerconnectionport) {
        var data = {
            openid: openid,
            tinyid: tinyid,
            srctinyid: srctinyid,
            peerconnectionport: peerconnectionport,
            roomid: roomid,
            sdkAppID: global.config.sdkAppId,
            socketid: global.websocket.socketid,
            userSig: userSig || global.config.userSig,
            relayip: global.relayip,
            dataport: global.dataport,
            stunport: global.stunport
        };
        rtcLog.debug("add peer : openid = " + JSON.stringify(data));
        var sendData = createJsonFromTag(global.RTC_EVENT.ON_CREATE_PEER);
        sendData.data = data;
        global.websocket.send(JSON.stringify(sendData));
        return true;
    };
    var getQuality = function(pc, track, callback) {
        var webkit = !!window.webkitRTCPeerConnection;

        var onerror = function(e) {
            callback(new Error(e.message || e));
        };

        var onstats = function(response) {
            var result = [];

            if (typeof response.result === 'function') {
                response.result().forEach(function(report) {
                    var stats = {
                        id: report.id,
                        timestamp: report.timestamp,
                        type: report.type
                    };

                    report.names().forEach(function(name) {
                        stats[name] = report.stat(name);
                    });

                    result.push(stats);
                });
            } else if (typeof response.forEach === 'function') {
                response.forEach(function(stats) {
                    result.push(stats);
                });
            }

            callback(null, result);
        };

        if (webkit) {
            pc.getStats(onstats, track);
        } else {
            pc.getStats(track, onstats, onerror);
        }
    };

    function getQulityAsync(pcMap, callback) {
        var size = Object.keys(pcMap).length;
        var doneSize = 0;
        var cpuMaxFrequency = 0;
        if (navigator && navigator.cpuMaxFrequency) {
            cpuMaxFrequency = navigator.cpuMaxFrequency;
        }
        var micStatus = 0;
        if (WebRTCAPI.GLOBAL.LocalStream) {
            if (WebRTCAPI.GLOBAL.LocalStream.getAudioTracks()[0].muted) {
                micStatus = 3;
            } else {
                micStatus = 1;
            }
        }
        var finalReportData = {
            WebRTCQualityReq: {
                uint64_begine_utime: new Date().getTime(),
                uint64_end_utime: 0,
                uint32_real_num: 0,
                uint32_delay: 0,
                uint32_CPU_curfreq: cpuMaxFrequency,
                uint32_total_send_bps: 0,
                AudioReportState: {
                    uint32_audio_real_recv_pkg: 0,
                    uint32_audio_delay: 0,
                    uint32_audio_jitter: 0,
                    uint32_microphone_status: micStatus
                },
                VideoReportState: {
                    uint32_video_delay: 0,
                    uint32_video_snd_br: 0,
                    VideoEncState: [{
                        uint32_enc_width: 0,
                        uint32_enc_height: 0,
                        uint32_capture_fps: 0,
                        uint32_enc_fps: 0
                    }]
                }
            }
        };
        for (var key in pcMap) {
            (function(index) {
                if (index == 0) {
                    //统计上行数据
                    var pc = pcMap[index];
                    if (global.localStream) {
                        var videoTrack = global.localStream.getVideoTracks()[0];
                        var audioTrack = global.localStream.getAudioTracks()[0];
                        getQuality(pc, audioTrack, function(error, result) {
                            if (error) {
                                console.log("audio track index = " + index + ", error : " + error);
                                return;
                            }

                            result.forEach(function(item) {
                                if (item.type == "ssrc") {
                                    finalReportData.WebRTCQualityReq.uint32_delay = parseInt(item.googRtt || 0);
                                    finalReportData.WebRTCQualityReq.uint32_total_send_bps = parseInt(item.bytesSent || 0);
                                }
                            });

                            getQuality(pc, videoTrack, function(error, result) {
                                if (error) {
                                    console.log("video track index = " + index + ", error : " + error);
                                    return;
                                }

                                result.forEach(function(item) {
                                    if (item.type == "ssrc") {
                                        finalReportData.WebRTCQualityReq.VideoReportState.uint32_video_delay = parseInt(item.googRtt || 0);
                                        finalReportData.WebRTCQualityReq.VideoReportState.uint32_video_snd_br = parseInt(item.bytesSent || 0);
                                        finalReportData.WebRTCQualityReq.VideoReportState.VideoEncState[0].uint32_capture_fps = parseInt(item.googFrameRateInput || 0);
                                        finalReportData.WebRTCQualityReq.VideoReportState.VideoEncState[0].uint32_enc_fps = parseInt(item.googFrameRateSent || 0);
                                        finalReportData.WebRTCQualityReq.VideoReportState.VideoEncState[0].uint32_enc_width = parseInt(item.googFrameWidthSent || 0);
                                        finalReportData.WebRTCQualityReq.VideoReportState.VideoEncState[0].uint32_enc_height = parseInt(item.googFrameHeightSent || 0);
                                    }
                                });
                                doneSize++;
                            });
                        });
                    } else {
                        doneSize++;
                    }

                } else {
                    //多个数据下行
                    var pc = pcMap[index];
                    if (global.remoteStreams[index]) {
                        var videoTrack = global.remoteStreams[index].getVideoTracks()[0];
                        var audioTrack = global.remoteStreams[index].getAudioTracks()[0];
                        getQuality(pc, audioTrack, function(error, result) {
                            if (error) {
                                console.log("audio track index = " + index + ", error : " + error);
                                return;
                            }

                            result.forEach(function(item) {
                                if (item.type == "ssrc") {
                                    finalReportData.WebRTCQualityReq.uint32_real_num += parseInt(item.packetsReceived) || 0;
                                    finalReportData.WebRTCQualityReq.AudioReportState.uint32_audio_real_recv_pkg += parseInt(item.packetsReceived || 0);
                                    if (finalReportData.WebRTCQualityReq.AudioReportState.uint32_audio_delay < parseInt(item.googJitterBufferMs || 0)) {
                                        finalReportData.WebRTCQualityReq.AudioReportState.uint32_audio_delay = parseInt(item.googJitterBufferMs || 0);
                                    }
                                    if (finalReportData.WebRTCQualityReq.AudioReportState.uint32_audio_delay < parseInt(item.googJitterBufferMs || 0)) {
                                        finalReportData.WebRTCQualityReq.AudioReportState.uint32_audio_delay = parseInt(item.googJitterBufferMs || 0);
                                    }
                                }
                            });

                            getQuality(pc, videoTrack, function(error, result) {
                                if (error) {
                                    console.log("video track index = " + index + ", error : " + error);
                                    return;
                                }
                                result.forEach(function(item) {
                                    if (item.type == "ssrc") {}
                                });
                                doneSize++;
                            });
                        });
                    } else {
                        doneSize++;
                    }

                }
            })(key);
        }

        var checkDone = setTimeout(function() {
            //do what you need here
            if (size <= doneSize) {
                // rtcLog.log("size = " + size + " done size = " + doneSize);
                clearTimeout(checkDone);

                finalReportData.WebRTCQualityReq.uint64_end_utime = new Date().getTime();

                if (!global.preReportData) {
                    finalReportData.WebRTCQualityReq.uint32_total_send_bps = finalReportData.WebRTCQualityReq.uint32_total_send_bps * 8 + finalReportData.WebRTCQualityReq.VideoReportState.uint32_video_snd_br;
                    callback(true, finalReportData);
                    global.preReportData = cloneObj(finalReportData);
                } else {
                    finalReportData.WebRTCQualityReq.uint64_begine_utime = global.preReportData.WebRTCQualityReq.uint64_end_utime;
                    var tmp = cloneObj(finalReportData);
                    finalReportData.WebRTCQualityReq.uint32_total_send_bps -= global.preReportData.WebRTCQualityReq.uint32_total_send_bps;
                    if (finalReportData.WebRTCQualityReq.uint32_total_send_bps <= 0) {
                        finalReportData.WebRTCQualityReq.uint32_total_send_bps = 0;
                    }
                    finalReportData.WebRTCQualityReq.uint32_real_num -= global.preReportData.WebRTCQualityReq.uint32_real_num;
                    if (finalReportData.WebRTCQualityReq.uint32_real_num <= 0) {
                        finalReportData.WebRTCQualityReq.uint32_real_num = 0;
                    }
                    finalReportData.WebRTCQualityReq.AudioReportState.uint32_audio_real_recv_pkg -= global.preReportData.WebRTCQualityReq.AudioReportState.uint32_audio_real_recv_pkg;
                    if (finalReportData.WebRTCQualityReq.AudioReportState.uint32_audio_real_recv_pkg <= 0) {
                        finalReportData.WebRTCQualityReq.AudioReportState.uint32_audio_real_recv_pkg = 0;
                    }
                    finalReportData.WebRTCQualityReq.VideoReportState.uint32_video_snd_br -= global.preReportData.WebRTCQualityReq.VideoReportState.uint32_video_snd_br;
                    if (finalReportData.WebRTCQualityReq.VideoReportState.uint32_video_snd_br <= 0) {
                        finalReportData.WebRTCQualityReq.VideoReportState.uint32_video_snd_br = 0;
                    }
                    finalReportData.WebRTCQualityReq.uint32_total_send_bps = finalReportData.WebRTCQualityReq.uint32_total_send_bps * 8 + finalReportData.WebRTCQualityReq.VideoReportState.uint32_video_snd_br;
                    global.preReportData = tmp;
                    callback(true, finalReportData);
                }
            }
        }, 20);
    }

    var reportQuality = function() {
        if (global.reportSto) {
            clearTimeout(global.reportSto);
        }

        console.log("report quality : peer connection size = " + Object.keys(global.peerConnections).length);
        getQulityAsync(global.peerConnections, function(result, data) {
            if (!result) {
                return;
            }
            data = resetReportValue(data);
            rtcLog.debug("get qualityData : " + JSON.stringify(data));
            var sendData = createSendJson(global.RTC_EVENT.ON_QUALITY_REPORT);
            sendData.data = data;
            if (global.websocket) {
                global.websocket.send(JSON.stringify(sendData));
            }
            global.reportSto = setTimeout(function() {
                reportQuality();
            }, 2000);
        });
    };

    function cloneObj(obj) {
        if (typeof obj !== "object") {
            return obj;
        }
        var newobj = {};
        for (var attr in obj) {
            newobj[attr] = cloneObj(obj[attr]);
        }
        return newobj;
    }

    function resetReportValue(obj) {
        if (typeof obj !== "object") {
            return obj + "";
        }
        var newobj = {};
        for (var attr in obj) {
            newobj[attr] = resetReportValue(obj[attr]);
        }
        return newobj;
    }

    var createJsonFromTag = function(tag) {
        return {
            tag_key: tag,
            data: ""
        };
    };

    var sendSdp = function(sdp, srctinyid) {
        var sendData = createJsonFromTag(global.RTC_EVENT.ON_PEER_SDP);
        sendData.data = sdp;
        sendData.srctinyid = srctinyid;
        global.websocket.send(JSON.stringify(sendData));
    };

    var changeLocalMedia = function(isVideo, isOpen) {
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

    webrtc.init = function(config, callback) {
        global.notify = false;
        global.config.userSig = config.userSig;
        global.config.openid = config.openid;
        global.config.sdkAppId = config.sdkAppId;
        global.config.accountType = config.accountType;
        global.config.srctinyid = config.srctinyid;

        //check sig
        /*var requestUrl = global.WEBRTC_CGI_SERVER + "checksig?callback=?";
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
            success: function(data) {
                if (!data || data.ret !== 0) {
                    rtcLog.error("Check userSig failed!!!");
                    callback(-10003);
                    return;
                }
                rtcLog.debug("Check userSig ok!!!");
                initWebSocket(function(ret) {
                    callback(ret);
                });
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                var errorStr = "Check userSig ajax error!!! : readystate = " + XMLHttpRequest.readyState + " , status = " + XMLHttpRequest.status + " , responseText = " + XMLHttpRequest.responseText + " , textStatus = " + textStatus;
                alert(errorStr);
                rtcLog.debug(errorStr);
                callback(-10012);
            }
        });*/
        initWebSocket(function(ret) {
            callback(ret);
        });
        return 0;
    };

    var startWebRTCCalllback = function(result) {
        if (result !== 0) {
            var errorStr = "";
            if (result === -10007) {
                errorStr = "PeerConnection 创建失败";
            } else if (result === -10008) {
                errorStr = "getUserMedia 失败";
            } else if (result === -10009) {
                errorStr = "getLocalSdp 失败";
            } else {
                errorStr = "start WebRTC failed!!!";
            }
            console.error(errorStr);
        }
    };

    webrtc.createRoom = function(roomid, callback) {
        rtclistener.config.onCreateRoomResult = callback;
        if (!global.config.openid) return;
        openRoom(global.config.openid, global.config.tinyid, roomid, global.config.userSig);
    };

    webrtc.setlistener = function(listener) {
        return setlistener(listener);
    };
    webrtc.quit = function(notify) {
        global.notify = notify || false;
        clearTimeout(global.reportSto);
        if (global.localStream) {
            global.localStream.getTracks().forEach(function(track) {
                track.stop();
            });
            global.localStream = null;
        }
        if (global.peerConnections) {
            for (var key in global.peerConnections) {
                var item = global.peerConnections[key];
                if (item) {
                    if (item.signalingState != 'closed') {
                        item.close();
                    }
                    item = null;
                }
            }
        }

        if (global.websocket) {
            global.websocket.close();
            global.websocket = null;
        }
        clearGlobalValues();
    };
    webrtc.closeAudio = function() {
        return changeLocalMedia(false, false);
    };
    webrtc.closeVideo = function() {
        return changeLocalMedia(true, false);
    };
    webrtc.openAudio = function() {
        return changeLocalMedia(false, true);
    };
    webrtc.openVideo = function() {
        return changeLocalMedia(true, true);
    };
    webrtc.startWebRTC = function(callback, srctinyid) {
        if (!callback) { callback = startWebRTCCalllback };
        if (!createPeerConnection(srctinyid || 0)) {
            callback(-10007);
            return;
        }
        if (parseInt(srctinyid || 0) === 0) {
            getLocalStream(function(result, info) {
                if (result !== 0) {
                    rtcLog.error("get local stream failed! e = " + info);
                    callback(result);
                    return;
                }
                rtclistener.config.onLocalStreamAdd(info);
                getSdp(srctinyid, function(result, info) {
                    if (result !== 0) {
                        rtcLog.error("get local sdp failed!!! e = " + info);
                        callback(result);
                        return;
                    }
                    sendSdp(info, srctinyid);
                    callback(0);
                });
            });
        } else {
            getSdp(srctinyid, function(result, info) {
                if (result !== 0) {
                    rtcLog.error("get local sdp failed!!! e = " + info);
                    callback(result);
                    return;
                }
                sendSdp(info, srctinyid);
                callback(0);
            });
        }
    };

})(webrtc);

(function(WebRTCAPI) {
    var global = new function() {
        this.config = {
            openid: "",
            userSig: "",
            sdkAppId: "",
            accountType: "",
            srctinyid: ""
        };
        this.jumpurl = null;
        this.listener = {
            onRemoteCloseVideo: null,
            onRemoteCloseAudio: null,
            onRemoteLeave: null,
            onKickout: null,
            onInitResult: null,
            onWebSocketClose: null,
            onRelayTimeout: null
        };
        this.roomid = 0;
    };

    var onMediaChange = function(isVideo, isOpen) {

    };

    var onRemoteLeave = function() {

    };

    var onLocalStreamAdd = function(stream) {
        console.log("local stream add!!!");
        global.listener.onLocalStreamAdd(stream);
    };

    var onPeerStreamAdd = function(stream, srctinyid) {
        console.log("remote stream add!!!");
        global.listener.onRemoteStreamAdd(stream, srctinyid);
    };

    var onPeerStreamRemove = function(stream, srctinyid) {
        console.log("remote peer remove!!!");
        global.listener.onRemoteStreamRemove(stream);
    };

    var onWSClose = function() {
        console.log("on websocket close!");
        webrtc.quit();
        global.listener.onWebSocketClose();
    };

    var onRelayTimeout = function(info) {
        global.listener.onRelayTimeout(info);
    };

    var onKickout = function(info) {
        global.listener.onKickout(info);
    };

    var onIceConnectionClose = function() {
        global.listener.onIceConnectionClose();
    };

    var webrtcListener = {
        onMediaChange: onMediaChange,
        onRemoteLeave: onRemoteLeave,
        onLocalStreamAdd: onLocalStreamAdd,
        onPeerStreamAdd: onPeerStreamAdd,
        onPeerStreamRemove: onPeerStreamRemove,
        onWSClose: onWSClose,
        onKickout: onKickout,
        onRelayTimeout: onRelayTimeout,
        onIceConnectionClose: onIceConnectionClose
    };

    var onKickOut = function() {
        console.error("On Kick Out!!!");
        webrtc.quit();
    };

    var getBrowserInfo = function() {
        var Sys = {};
        var ua = navigator.userAgent.toLowerCase();
        console.log('navigator.userAgent=' + ua);
        var s;
        (s = ua.match(/msie ([\d.]+)/)) ? Sys.ie = s[1]:
            (s = ua.match(/firefox\/([\d.]+)/)) ? Sys.firefox = s[1] :
            (s = ua.match(/chrome\/([\d.]+)/)) ? Sys.chrome = s[1] :
            (s = ua.match(/opera.([\d.]+)/)) ? Sys.opera = s[1] :
            (s = ua.match(/version\/([\d.]+).*safari/)) ? Sys.safari = s[1] : 0;
        if (Sys.ie) { //Js判断为IE浏览器
            return {
                'type': 'ie',
                'ver': Sys.ie
            };
        }
        if (Sys.firefox) { //Js判断为火狐(firefox)浏览器
            return {
                'type': 'firefox',
                'ver': Sys.firefox
            };
        }
        if (Sys.chrome) { //Js判断为谷歌chrome浏览器
            return {
                'type': 'chrome',
                'ver': Sys.chrome
            };
        }
        if (Sys.opera) { //Js判断为opera浏览器
            return {
                'type': 'opera',
                'ver': Sys.opera
            };
        }
        if (Sys.safari) { //Js判断为苹果safari浏览器
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

    WebRTCAPI.init = function(listener, config) {
        var listener_list = [
            'onRemoteCloseVideo',
            'onRemoteLeave',
            'onRemoteCloseAudio',
            'onInitResult',
            'onLocalStreamAdd',
            'onRemoteStreamAdd',
            'onRemoteStreamRemove',
            'onWebSocketClose',
            'onRelayTimeout',
            'onIceConnectionClose'
        ];
        var unlisten = [];
        if (listener) {
            listener_list.forEach(function(item) {
                if (!listener[item]) {
                    unlisten.push(item);
                }
            });
        }
        if (!listener || unlisten.length > 0) {
            console.error("WebRTC API init failed! listener is incorrect! " + unlisten.join(","));
            return -10001;
        }

        global.listener.onRemoteCloseAudio = listener.onRemoteCloseAudio;
        global.listener.onRemoteLeave = listener.onRemoteLeave;
        global.listener.onRemoteCloseVideo = listener.onRemoteCloseVideo;
        global.listener.onInitResult = listener.onInitResult;
        global.listener.onLocalStreamAdd = listener.onLocalStreamAdd;
        global.listener.onRemoteStreamAdd = listener.onRemoteStreamAdd;
        global.listener.onRemoteStreamRemove = listener.onRemoteStreamRemove;
        global.listener.onWebSocketClose = listener.onWebSocketClose;
        global.listener.onKickout = listener.onKickout;
        global.listener.onRelayTimeout = listener.onRelayTimeout;
        global.listener.onIceConnectionClose = listener.onIceConnectionClose;

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
        return webrtc.init(global.config, function(ret) {
            global.listener.onInitResult(ret);
        });
    };

    WebRTCAPI.createRoom = function(roomid, callback) {
        return webrtc.createRoom(roomid, callback);
    };


    WebRTCAPI.startWebRTC = function(callback, srctinyid) {
        return webrtc.startWebRTC(callback, srctinyid);
    };


    WebRTCAPI.closeAudio = function() {
        return webrtc.closeAudio();
    };

    WebRTCAPI.closeVideo = function() {
        return webrtc.closeVideo();
    };

    WebRTCAPI.openAudio = function() {
        return webrtc.openAudio();
    };

    WebRTCAPI.openVideo = function() {
        return webrtc.openVideo();
    };

    WebRTCAPI.quit = function(wsnotify) {
        var notify = typeof wsnotify === "undefined" ? false : wsnotify;
        return webrtc.quit(notify);
    };
})(WebRTCAPI);