var g_appId = 0;
var g_accountType = 0;
var g_sdk = null;
var g_token = null;
var g_userSig = null;
var g_appId = 1400027849;
var g_report = 0;
var g_roomnum = null;
var g_groupid = null;
var g_role = null;
var g_id = null;
var g_getUserList = null;
var g_invite = null;
var g_liveGuestCount = 0; //连麦用户总数
var g_liveGuestMax = 3; //连麦用户总数
var g_request_status = 0;



var E_IM_CustomCmd = {
    AVIMCMD_None: 0, // 无事件：0
    AVIMCMD_EnterLive: 1, // 用户加入直播, Group消息 ： 1
    AVIMCMD_ExitLive: 2, // 用户退出直播, Group消息 ： 2
    AVIMCMD_Praise: 3, // 点赞消息, Demo中使用Group消息 ： 3
    AVIMCMD_Host_Leave: 4, // 主播或互动观众离开, Group消息 ： 4
    AVIMCMD_Host_Back: 5, // 主播或互动观众回来, Group消息 ： 5
    AVIMCMD_Multi: 2048, // 多人互动消息类型 ： 2048
    AVIMCMD_Multi_Host_Invite: 2049, // 多人主播发送邀请消息, C2C消息 ： 2049
    AVIMCMD_Multi_CancelInteract: 2050, // 已进入互动时，断开互动，Group消息，带断开者的imUsreid参数 ： 2050
    AVIMCMD_Multi_Interact_Join: 2051, // 多人互动方收到AVIMCMD_Multi_Host_Invite多人邀请后，同意，C2C消息 ： 2051
    AVIMCMD_Multi_Interact_Refuse: 2052, // 多人互动方收到AVIMCMD_Multi_Invite多人邀请后，拒绝，C2C消息 ： 2052
};



function consoleLog(loginfo) {
    if (window.console) {
        console.log(loginfo);
    }
}
////////////////界面逻辑相关////////////////////////

var sdk;
var g_localRender = null;
var g_renders = new Array();

//状态管理
var StatusManager = {
    camera: 0,
    mic: 0,
    player: 0,
    logined: 0,
    setLogin: function(val) {
        this.logined = val;
        renderButton();
    },
    setCamera: function(val) {
        this.camera = val;
        renderButton();
    },
    setMic: function(val) {
        this.mic = val;
        renderButton();
    },
    setPlayer: function(val) {
        this.player = val;
        renderButton();
    },
    getLogin: function(val) {
        return this.logined;
    },
    getCamera: function() {
        return !!this.camera;
    },
    getMic: function() {
        return !!this.mic;
    },
    getPlayer: function() {
        return !!this.player;
    },
    getAll: function() {
        return {
            camera: this.camera,
            mic: this.mic,
            player: this.player,
            logined: this.logined,
        }
    },
    reset: function(cb) {
        this.camera = 0;
        this.mic = 0;
        this.player = 0;
        if (cb) {
            cb();
        }
    }
};

var renderButton = function() {
    var status = StatusManager.getAll();
    for (var a in status) {
        $("#btn_open_" + a).prop("disabled", status[a] ? true : false);
        $("#btn_close_" + a).prop("disabled", status[a] ? false : true);
    }
}



/**
 * 账号登录互踢
 */
function onForceOfflineCallback() {
    toastr.warning("你的账号在其他地方登陆.");
}

/**
 * 失去网络连接超时回调
 */
function onRoomDisconnect(errMsg) {
    g_localRender.freeRender();
    for (i in g_renders) {
        g_renders[i].freeRender();
    }
    alert("SDK已自动退出房间,原因: " + errMsg.code + " " + errMsg.desc);
    toastr.warning("SDK已自动退出房间,原因: " + errMsg.code + " " + errMsg.desc);
}

/**
 * 群消息通知
 */
function onGroupMessageCallback(msg) {
    var obj = JSON.parse(msg);
    toastr.success(obj.sender);
}

/**
 * C2C消息通知
 */
function onC2CMessageCallback(msg) {
    var obj = JSON.parse(msg);
    toastr.success(msg);
}

/**
 * 成功登录
 */
function onLoginSuc() {
    $('#loginBox').css('display', 'none');
    $('#logout').css('display', 'inline');
    $('#user').css('display', 'inline').text(username);
    $('#list').css('display', 'block');
    $('#user').html(g_id);
    OnBtnGetList();
    toastr.success("login succeed");

    //更新状态
    StatusManager.setLogin(1);
}

/**
 * 成功失败
 */
function onLoginErr(errMsg) {
    toastr.warning("登录失败. " + "错误码:" + errMsg.code + " 错误信息:" + errMsg.desc);
}

function onQuitRoomSuc() {
    //清理g_roomnum
    initState();
    //清理渲染器
    freeAllRender();
    toastr.success("退出房间成功.");
}

function onQuitRoomErr(code, desc) {
    toastr.warning("退出房间失败. " + "错误码:" + code + " 错误信息:" + desc);
}

function onSendMessageSuc() {
    toastr.success("发消息成功.");
}

function onSendMessageErr(code, desc) {
    toastr.warning("发消息失败. " + "错误码:" + code + " 错误信息:" + desc);
}

function onStartPushSuc(msg) {
    toastr.success(msg);
}

function onStartPushErr(code, desc) {
    toastr.warning("开始推流失败. " + "错误码:" + code + " 错误信息:" + desc);
}

function onStopPushSuc() {
    toastr.success("结束推流成功.");
}

function onStopPushErr(code, desc) {
    toastr.warning("结束推流失败. " + "错误码:" + code + " 错误信息:" + desc);
}


function onVoiceRecognizeErr(code) {
    toastr.warning("语音识别出错，错误码: " + code);
}

function onVoiceRecognizeResult(message) {
    OnBtnSendGroupMessage(message);
}

//界面事件
var g_serverUrl = "https://sxb.qcloud.com/sxb_new/index.php";

function ajaxPost(url, data, succ, err) {
    if (!window.XMLHttpRequest) {
        toastr.warning("你的浏览器不支持AJAX!");
        return;
    }
    var ajax = new XMLHttpRequest();
    ajax.open("post", url, true);
    ajax.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    ajax.onreadystatechange = function() {
        if (ajax.readyState == 4) {
            if (ajax.status == 200) {
                var rspJson = null;
                try {
                    rspJson = JSON.parse(ajax.responseText);
                } catch (e) {
                    toastr.warning("json解析出错,服务器返回内容:\n" + ajax.responseText);
                    return;
                }
                if (rspJson.errorCode == 0) {
                    succ(rspJson);
                } else {
                    toastr.warning("错误码:" + rspJson.errorCode + " 错误信息:" + rspJson.errorInfo);
                }
            } else {
                toastr.warning("HTTP请求错误！错误码：" + ajax.status);
                if (err) {
                    err();
                }
            }
        }
    }
    ajax.send(data);
}

function onRoomEvent(roomevent) {
    if (roomevent.eventid == E_iLiveRoomEventType.HAS_CAMERA_VIDEO) //打开摄像头
    {
        //为其分配渲染器
        for (i in g_renders) {
            if (g_renders[i].isFreeRender()) {
                g_renders[i].setIdentifer(roomevent.identifier);
                break;
            }
        }
    } else if (roomevent.eventid == E_iLiveRoomEventType.NO_CAMERA_VIDEO) //关闭摄像头
    {
        //释放其占用的渲染器
        for (i in g_renders) {
            if (g_renders[i].getIdentifer() == roomevent.identifier) {
                g_renders[i].freeRender();
                break;
            }
        }
    }
}


function OnInit() {
    consoleLog("OnInit");
    sdk = new ILiveSDK(1400027849, 11656, "iLiveSDKCom");
    toastr.info('正在初始化，请稍后');
    sdk.init(function() {
            toastr.success('初始化成功');
            $('#loginBox').css('display', 'block');
            g_localRender = new ILiveRender("localRender");
            g_renders[0] = new ILiveRender("render0");
            g_renders[1] = new ILiveRender("render1");
            g_renders[2] = new ILiveRender("render2");

            sdk.setForceOfflineListener(onForceOfflineCallback);
            sdk.setRoomDisconnectListener(onRoomDisconnect);
            sdk.setRoomEventListener(onRoomEvent);

            document.getElementById("version").innerHTML = sdk.version();
            sdk.setC2CListener(function(msg) {
                showMessage(msg);
            });
            sdk.setGroupListener(function(msg) {
                showMessage(msg);
            });

        },
        function(errMsg) {
            toastr.warning("初始化失败! 错误码: " + errMsg.code + "描述: " + errMsg.desc);
        });

}

function showMessage(msg) {
    for (i in msg.elems) {
        if (msg.elems[i].type == E_iLiveMessageElemType.TEXT) {
            addMessage(msg.sender + '说:' + escapeHTML(msg.elems[i].content));
        } else if (msg.elems[i].type == E_iLiveMessageElemType.CUSTOM) {
            dealCustomMessage(msg.sender, JSON.parse(msg.elems[i].content));
        }
    }
}

//反初始化
function OnUninit() {
    freeAllRender();
    sdk.unInit();
}

//释放所有渲染器
function freeAllRender() {
    g_localRender.freeRender();
    for (i in g_renders) {
        g_renders[i].freeRender();
    }
}

function OnBtnReg() {
    //注册
    var id = document.getElementById("username").value;
    var pwd = document.getElementById("password").value;
    var jsonObj = {
        "id": id,
        "pwd": pwd
    };
    ajaxPost(g_serverUrl + "?svc=account&cmd=regist", JSON.stringify(jsonObj),
        function(rspJson) {
            toastr.success("注册成功");
        }
    );
}

function OnBtnLogin() {
    //从业务侧服务器获取sig
    var id = document.getElementById("username").value;
    var pwd = document.getElementById("password").value;
    var jsonObj = {
        "id": id,
        "pwd": pwd
    };
    ajaxPost(g_serverUrl + "?svc=account&cmd=login", JSON.stringify(jsonObj),
        function(rspJson) {
            g_token = rspJson.data.token;
            g_userSig = rspJson.data.userSig;
            g_id = id;
            var sig = rspJson.data.userSig;
            sdk.login(id, sig, onLoginSuc, onLoginErr);
        }
    );
}

function OnBtnLogout(cb) {
    var jsonObj = {
        "token": g_token
    };
    ajaxPost(g_serverUrl + "?svc=account&cmd=logout", JSON.stringify(jsonObj),
        function(rspJson) {
            sdk.logout(function() {
                g_token = null;
                g_userSig = null;
                cb();
                initState();
                //清理渲染器
                freeAllRender();
                toastr.success("logout succ");
                //更新状态机
                StatusManager.setLogin(0);
            }, function(errMsg) {
                toastr.warning("错误码:" + errMsg.code + " 错误信息:" + errMsg.desc);
            });
        }
    );

}

function OnBtnGetList() {
    //从业务侧获取房间列表
    $('#room-list').html('');
    var jsonObj = {
        "type": 'live',
        "token": g_token,
        "index": 0,
        "size": 30,
        "appid": g_appId
    };
    ajaxPost(g_serverUrl + "?svc=live&cmd=roomlist", JSON.stringify(jsonObj),
        function(rspJson) {
            for (var i = 0; i < rspJson.data.rooms.length; i++) {
                var item = rspJson.data.rooms[i];
                $('#room-list').append('<a class="list-group-item" data-roomnum="' + item.info.roomnum + '" data-groupid="' + item.info.groupid + '">房间:' + item.info.title + '</a>');
            }
        }
    );
}


function OnBtnCreateRoom(cb) {
    var jsonObj = {
        "type": 'live',
        "token": g_token
    };
    //创建房间先清理一下渲染器，避免不正常退出的画面遗留
    freeAllRender();
    ajaxPost(g_serverUrl + "?svc=live&cmd=create", JSON.stringify(jsonObj),
        function(rspJson) {
            sdk.createRoom(rspJson.data.roomnum, "LiveMaster", function() {
                toastr.success("create room succ");
                g_role = 1;
                g_roomnum = rspJson.data.roomnum;
                g_groupid = rspJson.data.groupid;
                jsonObj = {
                    "token": g_token,
                    "room": {
                        "title": 'Web随心播',
                        "roomnum": rspJson.data.roomnum,
                        "type": "live",
                        "groupid": rspJson.data.groupid,
                        "appid": g_appId,
                        "device": 2,
                        "videotype": 0
                    }
                };
                ajaxPost(g_serverUrl + "?svc=live&cmd=reportroom", JSON.stringify(jsonObj),
                    function(rspJson) {
                        cb(g_roomnum);
                        report({
                            "token": g_token,
                            "roomnum": g_roomnum,
                            "role": g_role,
                            "thumbup": 0
                        });
                        getUserList();
                    }
                ); //这个是运营后台的事件
            }, function(errMsg) {
                toastr.warning("错误码:" + errMsg.code + " 错误信息:" + errMsg.desc);
            }); //这个是sdk的事件
        }
    );
}

function report(obj) {
    clearInterval(g_report);
    var handleReport = function() {
        ajaxPost(g_serverUrl + "?svc=live&cmd=heartbeat", JSON.stringify(obj),
            function(rspJson) {}
        );
    };
    handleReport();
    g_report = setInterval(handleReport, 10000)
}

function getUserList() {
    clearInterval(g_getUserList);
    var temp = function() {
        var obj = {
            "token": g_token,
            "roomnum": g_roomnum,
            "index": 0,
            "size": 20
        };
        ajaxPost(g_serverUrl + "?svc=live&cmd=roomidlist", JSON.stringify(obj),
            function(rspJson) {
                g_liveGuestCount = 0;
                $('#user-list').html('');
                var roleList = { '0': '' /*观众（不显示）*/ , '1': '主播', '2': '连麦' };
                for (var i = 0; i < rspJson.data.idlist.length; i++) {
                    var item = rspJson.data.idlist[i];
                    var role = roleList[item.role] ? ('(' + roleList[item.role] + ')') : "";
                    $('#user-list').append('<button type="button" class="list-group-item" data-id="' + item.id + '" data-role="' + item.role + '">' +
                        item.id + role + '</button>');
                    if (item.role == 2) {
                        g_liveGuestCount++;
                    }
                }
            }
        );
    };
    temp();
    g_getUserList = setInterval(temp, 10000);
};

function OnBtnJoinRoom(roomid, role, succ) {
    if (g_request_status) {
        toastr.warning("正在发起加入房间请求，请稍后..");
        return;
    }
    g_request_status = 1;
    var jsonObj = {
        "token": g_token,
        "roomnum": roomid,
        "role": 0,
        "operate": 0,
        "id": g_id
    };
    //加入房间先清理一下渲染器，避免不正常退出的画面遗留
    freeAllRender();
    ajaxPost(g_serverUrl + "?svc=live&cmd=reportmemid", JSON.stringify(jsonObj),
        function(rspJson) {
            sdk.joinRoom(roomid, "Guest", function() {
                g_request_status = 0;
                toastr.success("join room succ");
                g_role = role || 0;
                g_roomnum = roomid;
                succ();
                SendGroupMessage({
                    "userAction": E_IM_CustomCmd.AVIMCMD_EnterLive,
                    "actionParam": ''
                })
                report({
                    "token": g_token,
                    "roomnum": g_roomnum,
                    "role": g_role,
                    "thumbup": 0
                });
                getUserList();
                if (role == 2) {
                    sdk.changeRole('LiveGuest', function() {

                    });
                }
            }, function(errMsg) {
                g_request_status = 0;
                toastr.warning("错误码:" + errMsg.code + " 错误信息:" + errMsg.desc);
                err(errMsg);
            });
        },
        function() {
            g_request_status = 0;
        }
    );
}

function OnBtnQuitRoom(cb) {
    var url = null;
    var param = {};
    if (g_role == 1) {
        url = g_serverUrl + "?svc=live&cmd=exitroom",
            param = {
                "token": g_token,
                "type": "live",
                "roomnum": g_roomnum,
            }
    } else { //观众
        url = g_serverUrl + "?svc=live&cmd=reportmemid",
            param = {
                "token": g_token,
                "id": g_id,
                "roomnum": g_roomnum,
                "role": g_role,
                "operate": 1
            }
    }
    var quit_callback = function() {
        ajaxPost(url, JSON.stringify(param),
            function(rspJson) {
                sdk.quitRoom(function() {
                    toastr.success("quit room succ");
                    initState();
                    //清理渲染器
                    freeAllRender();
                    cb();
                }, function(errMsg) {
                    toastr.warning("错误码:" + errMsg.code + " 错误信息:" + errMsg.desc);
                });
            }
        );
    }
    if (g_role == 1) {
        SendGroupMessage({
                "userAction": E_IM_CustomCmd.AVIMCMD_ExitLive,
                "actionParam": ''
            }, quit_callback) //主播要先发送退出房间的信令
    } else {
        quit_callback();
    }
}

function OnBtnOpenCamera() {
    if (g_role == 0) {
        toastr.error('被连麦之后才可以打开摄像头');
        return;
    }
    var nRet = sdk.getCameraList();
    if (nRet.code != 0) {
        toastr.warning("获取摄像头列表出错; 错误码:" + nRet);
        return;
    }
    ret = sdk.openCamera(nRet.cameras[0].id);
    if (ret != 0) {
        toastr.warning("打开摄像头失败; 错误码:" + ret);
    } else {
        g_localRender.setIdentifer(g_id);

        //更新状态
        StatusManager.setCamera(1);
    }
}

function OnBtnCloseCamera() {
    if (g_role == 0) {
        return toastr.error('被连麦之后才可以关闭摄像头');
    }
    var nRet = sdk.closeCamera();
    if (nRet != 0) {
        toastr.warning("关闭摄像头失败; 错误码:" + nRet);
    } else {
        g_localRender.freeRender();
        //更新状态
        StatusManager.setCamera(0);
    }
    // 销毁美颜滤镜资源
    sdk.destroyFilter();
}

function OnBtnOpenMic() {
    if (g_role == 0) {
        return toastr.error('被连麦之后才可以打开麦克风');
    }
    var nRet = sdk.openMic();
    if (nRet != 0) {
        toastr.warning("打开麦克风失败; 错误码:" + nRet);
    } else {
        toastr.success("打开麦克风成功.");
        //更新状态
        StatusManager.setMic(1);
    }
}

function OnBtnCloseMic() {
    if (g_role == 0) {
        return toastr.error('被连麦之后才可以关闭麦克风');
    }
    var nRet = sdk.closeMic();
    if (nRet != 0) {
        toastr.warning("关闭麦克风失败; 错误码:" + nRet);
    } else {
        toastr.success("关闭麦克风成功.");
        //更新状态
        StatusManager.setMic(0);
    }
}

function OnBtnOpenPlayer() {
    var nRet = sdk.openSpeaker();
    if (nRet != 0) {
        toastr.warning("打开扬声器失败; 错误码:" + nRet);
    } else {
        toastr.success("打开扬声器成功.");
        //更新状态
        StatusManager.setPlayer(1);
    }
}

function OnBtnClosePlayer() {
    var nRet = sdk.closeSpeaker();
    if (nRet != 0) {
        toastr.warning("关闭扬声器失败; 错误码:" + nRet);
    } else {
        toastr.success("关闭扬声器成功.");
        //更新状态
        StatusManager.setPlayer(0);
    }
}

function OnBtnSendGroupMessage(msg, succ, err) {
    var elem = new ILiveMessageElem(E_iLiveMessageElemType.TEXT, msg);
    var elems = [];
    elems.push(elem);
    var message = new ILiveMessage(elems);
    sdk.sendGroupMessage(message, function() {
        toastr.success("send message succ");
        addMessage('我说:' + escapeHTML(msg));
        $("#group-message").val('');
    }, function(errMsg) {
        toastr.warning("错误码:" + errMsg.code + " 错误信息:" + errMsg.desc);
    });
}

function OnBtnSendC2CMessage(msg, user) {
    var elem = new ILiveMessageElem(E_iLiveMessageElemType.TEXT, msg);
    var elems = [];
    elems.push(elem);
    var message = new ILiveMessage(elems);
    sdk.sendC2CMessage(user, message, function() {
        toastr.success("send message succ");
        addMessage('我说:' + escapeHTML(msg));
    }, function(errMsg) {
        toastr.warning("错误码:" + errMsg.code + " 错误信息:" + errMsg.desc);
    });
}

function OnBtnStartRecognizeVoice() {
    var wxvoice = document.getElementById("WXVoiceSDKCom");

    toastr.success("同时开启语音识别");
    wxvoice.startVoiceRecognize(onVoiceRecognizeErr, onVoiceRecognizeResult);
}

function OnBtnStopRecognizeVoice() {
    var wxvoice = document.getElementById("WXVoiceSDKCom");
    wxvoice.stopVoiceRecognize();
}

function OnBtnStartPushStream() {
    var op = new ILivePushStreamOption(E_iLivePushDataType.CAMERA, E_iLivePushEncode.HLS, E_iLivePushRecordFileType.MP4);
    sdk.startPushStream(op, function(msg) {
        toastr.success(msg.channelID);
    }, function() {
        toastr.warning("错误码:" + errMsg.code + " 错误信息:" + errMsg.desc);
    });
}

function OnBtnStopPushStream(chanelId) {
    sdk.stopPushStream(chanelId, function() {
        toastr.success("stop push succ");
    }, function(errMsg) {
        toastr.warning("错误码:" + errMsg.code + " 错误信息:" + errMsg.desc);
    });
}


function addMessage(msg) {
    $('#chat_box').append('<div>' + msg + '</div>')
    $('#chat_box').scrollTop(document.getElementById('chat_box').scrollHeight);
}

function sendC2CMessage(user, msg, cb) {
    var elem = new ILiveMessageElem(E_iLiveMessageElemType.CUSTOM, JSON.stringify(msg));
    var elems = [];
    elems.push(elem);
    var message = new ILiveMessage(elems);
    sdk.sendC2CMessage(user, message, function() {
        if (cb) {
            cb();
        }
    }, function(errMsg) {
        toastr.warning("错误码:" + errMsg.code + " 错误信息:" + errMsg.desc);
    });
}

function SendGroupMessage(msg, cb) {
    var elem = new ILiveMessageElem(E_iLiveMessageElemType.CUSTOM, JSON.stringify(msg));
    var elems = [];
    elems.push(elem);
    var message = new ILiveMessage(elems);
    sdk.sendGroupMessage(message, function() {
        if (cb) {
            cb();
        }
        //重新拉取用户列表
        getUserList();
    }, function(errMsg) {
        toastr.warning("错误码:" + errMsg.code + " 错误信息:" + errMsg.desc);
    });
}

function initState() {
    clearInterval(g_report);
    clearInterval(g_getUserList);

    StatusManager.reset(function() {
        renderButton();
    });
    g_roomnum = null;

    // OnBtnGetList();

    $('#chat_box').html('');
    $('#user-list').html('');
    for (var i = 0; i < 3; i++) {
        $('#username' + i).html('');
    }

}

/**
 * 自定义消息处理函数
 */
function dealCustomMessage(user, msg) {
    consoleLog(user);
    consoleLog(JSON.stringify(msg));
    switch (msg.userAction) {
        case E_IM_CustomCmd.AVIMCMD_EnterLive:
            addMessage(user + '进入了房间');
            getUserList();
            break;
        case E_IM_CustomCmd.AVIMCMD_ExitLive:
            toastr.warning('主播' + user + '退出了房间');
            sdk.quitRoom(function() {
                toastr.success("quit room succ");
                initState();
                OnBtnGetList();
                $('#detail').css('display', 'none');
                $('#list').css('display', 'block');
            }, function(errMsg) {
                toastr.warning("错误码:" + errMsg.code + " 错误信息:" + errMsg.desc);
            });
            getUserList();
            break;
        case E_IM_CustomCmd.AVIMCMD_Praise:
            addMessage(user + '点了赞');
            break;
        case E_IM_CustomCmd.AVIMCMD_Host_Leave:
        case E_IM_CustomCmd.AVIMCMD_Host_Back:
            getUserList();
            break;
        case E_IM_CustomCmd.AVIMCMD_Multi:
            break;
        case E_IM_CustomCmd.AVIMCMD_Multi_Host_Invite:
            g_invite = user;
            $('#invitedBox').modal('show');
            break;
        case E_IM_CustomCmd.AVIMCMD_Multi_CancelInteract:
            if (g_role != 1) {
                sdk.changeRole('Guest', function() {
                    toastr.warning("被主播下麦");
                    OnBtnCloseCamera();
                    g_role = 0;
                    report({
                        "token": g_token,
                        "roomnum": g_roomnum,
                        "role": g_role,
                        "thumbup": 0
                    });
                    getUserList();
                });
            } else {
                getUserList();
            }
            break;
        case E_IM_CustomCmd.AVIMCMD_Multi_Interact_Join:
            toastr.success("对方接受了你的邀请");
            getUserList();
            break;
        case E_IM_CustomCmd.AVIMCMD_Multi_Interact_Refuse:
            toastr.warning("对方拒绝了你的邀请");
        default:
            break;
    }
}

function escapeHTML(str) {
    if (typeof str != 'string') {
        return '' + str;
    }
    return str.replace(/[<>&"']/g, function($0) {
        switch ($0) {
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '&':
                return '&amp;';
            case '"':
                return '&quot;';
            case '\'':
                return '&#39;';
        }
    });
}