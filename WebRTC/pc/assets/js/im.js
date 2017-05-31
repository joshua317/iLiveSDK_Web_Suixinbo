var selType = webim.SESSION_TYPE.GROUP; //当前聊天类型
var selToID = null; //当前选中聊天id（当聊天类型为私聊时，该值为好友帐号，否则为群号）
var selSess = null; //当前聊天会话对象
var recentSessMap = {}; //保存最近会话列表
var reqRecentSessCount = 50; //每次请求的最近会话条数，业务可以自定义

//默认好友头像
var friendHeadUrl = 'img/friend.jpg'; //仅demo使用，用于没有设置过头像的好友
//默认群头像
var groupHeadUrl = 'img/group.jpg'; //仅demo使用，用于没有设置过群头像的情况


//存放c2c或者群信息（c2c用户：c2c用户id，昵称，头像；群：群id，群名称，群头像）
var infoMap = {}; //初始化时，可以先拉取我的好友和我的群组信息


var maxNameLen = 12; //我的好友或群组列表中名称显示最大长度，仅demo用得到
var reqMsgCount = 15; //每次请求的历史消息(c2c获取群)条数，仅demo用得到

var pageSize = 15; //表格的每页条数，bootstrap table 分页时用到
var totalCount = 200; //每次接口请求的条数，bootstrap table 分页时用到

var emotionFlag = false; //是否打开过表情选择框

var curPlayAudio = null; //当前正在播放的audio对象

var getPrePageC2CHistroyMsgInfoMap = {}; //保留下一次拉取好友历史消息的信息
var getPrePageGroupHistroyMsgInfoMap = {}; //保留下一次拉取群历史消息的信息

var defaultSelGroupId = null; //登录默认选中的群id，选填，仅demo用得到

//监听（多终端同步）群系统消息方法，方法都定义在receive_group_system_msg.js文件中
//注意每个数字代表的含义，比如，
//1表示监听申请加群消息，2表示监听申请加群被同意消息，3表示监听申请加群被拒绝消息
var onGroupSystemNotifys = {
    "1": function() {}, //申请加群请求（只有管理员会收到）
    "2": function() {}, //申请加群被同意（只有申请人能够收到）
    "3": function() {}, //申请加群被拒绝（只有申请人能够收到）
    "4": function() {}, //被管理员踢出群(只有被踢者接收到)
    "5": function() {}, //群被解散(全员接收)
    "6": function() {}, //创建群(创建者接收)
    "7": function() {}, //邀请加群(被邀请者接收)
    "8": function() {}, //主动退群(主动退出者接收)
    "9": function() {}, //设置管理员(被设置者接收)
    "10": function() {}, //取消管理员(被取消者接收)
    "11": function() {}, //群已被回收(全员接收)
    //"15": onReadedSyncGroupNotify, //群消息已读同步通知
    //"255": onCustomGroupNotify //用户自定义通知(默认全员接收)
};

//监听连接状态回调变化事件
var onConnNotify = function(resp) {
    var info;
    switch (resp.ErrorCode) {
        case webim.CONNECTION_STATUS.ON:
            webim.Log.warn('建立连接成功: ' + resp.ErrorInfo);
            break;
        case webim.CONNECTION_STATUS.OFF:
            info = '连接已断开，无法收到新消息，请检查下你的网络是否正常: ' + resp.ErrorInfo;
            // alert(info);
            webim.Log.warn(info);
            break;
        case webim.CONNECTION_STATUS.RECONNECT:
            info = '连接状态恢复正常: ' + resp.ErrorInfo;
            // alert(info);
            webim.Log.warn(info);
            break;
        default:
            webim.Log.error('未知连接状态: =' + resp.ErrorInfo);
            break;
    }
};

//IE9(含)以下浏览器用到的jsonp回调函数
function jsonpCallback(rspData) {
    webim.setJsonpLastRspData(rspData);
}

//监听事件
var listeners = {
    "onConnNotify": onConnNotify //监听连接状态回调变化事件,必填
        ,
    "onMsgNotify": onMsgNotify //监听新消息(私聊，普通群(非直播聊天室)消息，全员推送消息)事件，必填
};

var isAccessFormalEnv = true; //是否访问正式环境

if (webim.Tool.getQueryString("isAccessFormalEnv") == "false") {
    isAccessFormalEnv = false; //访问测试环境
}

var isLogOn = false; //是否开启sdk在控制台打印日志

//初始化时，其他对象，选填
var options = {
    'isAccessFormalEnv': isAccessFormalEnv, //是否访问正式环境，默认访问正式，选填
    'isLogOn': isLogOn //是否开启控制台打印日志,默认开启，选填
}



function webimLogin(cb) {
    webim.login(loginInfo, listeners, options,
        function(identifierNick) {
            webim.Log.info('webim登录成功');
            if (RoomNumber > 0) {
                selToID = String(RoomNumber);
            }
            if (cb) { cb(); }
        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );
}


function createGroup() {
    var options = {
        'GroupId': String(RoomNumber),
        'Owner_Account': loginInfo.identifier,
        'Type': "Public", //Private/Public/ChatRoom/AVChatRoom
        'ApplyJoinOption': 'FreeAccess',
        'Name': String(RoomNumber),
        'Notification': $("#cg_notification").val(),
        'Introduction': $('#cg_introduction').val(),
        'MemberList': [],
    };
    webim.createGroup(
        options,
        function(resp) {
            console.info('创建会话成功');
        },
        function(err) {
            if (err.ErrorCode == 10025) {
                console.info('创建会话成功');
            } else {
                console.error(err.ErrorInfo);
            }
        }
    );
}

function applyJoinGroup() {
    var options = {
        'GroupId': String(RoomNumber)
    };
    webim.applyJoinGroup(
        options,
        function(resp) {
            console.info('加入会话成功');
        },
        function(err) {
            if (err.ErrorCode == 10013) {
                console.info('加入会话成功');
            } else {
                console.error(err.ErrorInfo);
            }
        }
    );
}

function onMsgNotify(newMsgList) {
    var sess, newMsg;
    //获取所有聊天会话
    var sessMap = webim.MsgStore.sessMap();
    for (var j in newMsgList) { //遍历新消息
        newMsg = newMsgList[j];
        if (newMsg.getSession().id() == selToID) { //为当前聊天对象的消息
            addMsg(newMsg);
        }
    }
    //消息已读上报，以及设置会话自动已读标记
    webim.setAutoRead(selSess, true, true);
}



function onSendMsg() {
    var msgContent = $("#msg_input").val();
    var msgLen = webim.Tool.getStrBytes(msgContent);
    if (msgContent.length < 1) {
        alert("发送的消息不能为空!");
        $("#send_msg_text").val('');
        return;
    }
    //发消息处理
    handleMsgSend(msgContent);
}


function handleMsgSend(msgContent) {
    if (RoomNumber > 0) {
        selToID = String(RoomNumber);
    }
    if (!selSess) {
        var selSess = new webim.Session(selType, selToID, selToID, friendHeadUrl, Math.round(new Date().getTime() / 1000));
    }
    var isSend = true; //是否为自己发送
    var seq = -1; //消息序列，-1表示sdk自动生成，用于去重
    var random = Math.round(Math.random() * 4294967296); //消息随机数，用于去重
    var msgTime = Math.round(new Date().getTime() / 1000); //消息时间戳
    var subType; //消息子类型
    if (selType == webim.SESSION_TYPE.C2C) {
        subType = webim.C2C_MSG_SUB_TYPE.COMMON;
    } else {
        //webim.GROUP_MSG_SUB_TYPE.COMMON-普通消息,
        //webim.GROUP_MSG_SUB_TYPE.LOVEMSG-点赞消息，优先级最低
        //webim.GROUP_MSG_SUB_TYPE.TIP-提示消息(不支持发送，用于区分群消息子类型)，
        //webim.GROUP_MSG_SUB_TYPE.REDPACKET-红包消息，优先级最高
        subType = webim.GROUP_MSG_SUB_TYPE.COMMON;
    }
    var msg = new webim.Msg(selSess, isSend, seq, random, msgTime, loginInfo.identifier, subType, loginInfo.identifierNick);

    var text_obj, face_obj, tmsg, emotionIndex, emotion, restMsgIndex;
    //解析文本和表情
    text_obj = new webim.Msg.Elem.Text(msgContent);
    msg.addText(text_obj);

    msg.sending = 1;
    msg.originContent = msgContent;
    // addMsg(msg);

    webim.sendMsg(msg, function(resp) {}, function(err) {});
}


function addMsg(msg, prepend) {
    var isSelfSend, fromAccount, fromAccountNick, fromAccountImage, sessType, subType;

    isSelfSend = msg.getIsSend(); //消息是否为自己发的
    fromAccount = msg.getFromAccount();
    window.mmm = msg;

    var msgHtml = "<p>" + webim.Tool.formatText2Html(msg.getFromAccount() +
        // "&nbsp;&nbsp;" + webim.Tool.formatTimeStamp(msg.getTime()) +
        ":" + mmm.toHtml()) + "</p>";

    $("#msg-box").append(msgHtml);
    setTimeout(function() {
        $("#msg-box").parent().scrollTop(100000);
    }, 10);
    //消息列表
}