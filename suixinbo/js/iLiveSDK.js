

/**
* iliveSDK成功回调
* @callback ILiveSDK~iliveSucCallback
*/

/**
* iliveSDK失败回调
* @callback ILiveSDK~iliveErrCallback
* @param {ILiveErrorMessage} message 错误信息
*/

/**
* iliveSDK收消息回调
* @callback ILiveSDK~iliveMessageCallback
* @param {ILiveMessage} msg 消息
*/

/**
* iliveSDK房间内事件回调
* @callback ILiveSDK~iliveRoomEventListener
* @param {ILiveRoomEvent} roomevent 房间内事件
*/

/**
* iliveSDK被踢下线回调
* @callback ILiveSDK~iliveOnForceOffline
*/


/**
* ILiveSDK
* @constructor
* @throws iliveSDKObj不存在时抛出异常
* @param {number} appid - 腾讯云分配的appid
* @param {number} accountType - 腾讯云分配的accoutType
* @param {string} iliveSDK - html页面中iLiveSDK object的ID
*/
function ILiveSDK(appid, accountType, iliveSDKObj) {
    this.appid = appid;
    this.accountType = accountType;
    this.ilive = document.getElementById(iliveSDKObj);
    if (!this.ilive) throw new Error("iliveSDK object not found");
}

ILiveSDK.prototype = {
    /**
    * 获取iliveSDK版本
    * @returns {string} 版本号
    */
    version: function () {
        return this.ilive.GetVersion();
    },

    /**
    * 将初始化iliveSDK.
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    init: function (suc, err)
    {
        this.ilive.initSdk(this.appid, this.accountType, function () {
            if(suc) {
                suc();
            }
        },
        function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        }
        );
    },

    /**
    * 释放iliveSDK
    */
    unInit: function () {
        this.ilive.destroy();
    },

    /**
    * 登录
    * @param {string} id - 登录id
    * @param {string} sig - 登录签名
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    login: function (id, sig, suc, err) {
        this.ilive.iLiveLogin(id, sig, function () {
            if (suc) {
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },

    /**
    * 登出
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    logout: function (suc, err) {
        this.ilive.iLiveLogout(function () {
            if (suc) {
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },

    /**
    * 创建房间
    * @param {number} roomID - 房间ID
    * @param {string} controlRole - 角色
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    createRoom: function (roomID, controlRole, suc, err) {
        this.ilive.createRoom(roomID, controlRole, function () {
            if (suc) {
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },

   /**
    * 加入房间
    * @param {number} roomID - 房间ID
    * @param {string} controlRole - 角色
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    joinRoom: function (roomID, controlRole, suc, err) {
        this.ilive.joinRoom(roomID, controlRole, function () {
            if (suc) {
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },

   /**
    * 退出房间
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    quitRoom: function (suc, err) {
        this.ilive.quitRoom(function () {
            if (suc) {
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },

   /**
    * 打开摄像头
    * @param {string} id - 需要打开的摄像头ID
    * @returns {number} 结果（0为成功）
    */
    openCamera: function (id) {
        return this.ilive.openCamera(id);
    },

   /**
    * 获取摄像头列表
    * @returns {number} 结果（0为成功）
    */
    getCameraList: function () {        
        var ret = this.ilive.getCameraList();
        var obj = JSON.parse(ret);
        var cList = [];
        if (obj.code == 0) {
            for (var i = 0; i < obj.cameralist.length; ++i) {
                var camera = new ILiveCamera(obj.cameralist[i].id, obj.cameralist[i].name);
                cList.push(camera);
            }
        }
        var ret = new IliveCameraList(obj.code, cList)
        return ret;
    },


   /**
    * 关闭摄像头
    * @returns {number} 结果（0为成功）
    */
    closeCamera: function () {
        return this.ilive.closeCamera();
    },

   /**
    * 打开麦克风
    * @returns {number} 结果（0为成功）
    */
    openMic: function () {
        return this.ilive.openMic();
    },

   /**
    * 关闭麦克风
    * @returns {number} 结果（0为成功）
    */
    closeMic: function () {
        return this.ilive.closeMic();
    },

   /**
    * 打开扬声器
    * @returns {number} 结果（0为成功）
    */
    openSpeaker: function () {
        return this.ilive.openPlayer();
    },

   /**
    * 关闭扬声器
    * @returns {number} 结果（0为成功）
    */
    closeSpeaker: function () {
        return this.ilive.closePlayer();
    },

   /**
    * 发送群消息
    * @param {ILiveMessage} message - 消息
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    sendGroupMessage: function (message, suc, err) {
        if (message instanceof ILiveMessage) {
            if (message.elems.length == 0) return;

            var msg = {};
	        var elems = [];
	        for (var i = 0; i < message.elems.length; ++i) {
            	var elem = {};
	            elem.type = message.elems[i].type;
	            elem.content = message.elems[i].content;	
	            elems.push(elem);
            }
            msg.elems = elems;
            this.ilive.sendGroupMessage(JSON.stringify(msg), function () {
                if (suc) {
                    suc();
                }
            }, function (msg) {
                if (err) {
                    var obj = JSON.parse(msg);
                    err(obj);
                }
            });
        }        
    },

    /**
    * 发送C2C消息
    * @param {string} to - 发送对象
    * @param {ILiveMessage} message - 消息
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    sendC2CMessage: function (to, message, suc, err) {
        if (message instanceof ILiveMessage) {
            if (message.elems.length == 0) return;
	        var msg = {};
	        var elems = [];
	        msg.to = to;
	        for (var i = 0; i < message.elems.length; ++i) {
            	var elem = {};
	            elem.type = message.elems[i].type;
	            elem.content = message.elems[i].content;	
	            elems.push(elem);
            }
	        msg.elems = elems;
            this.ilive.sendC2CMessage(JSON.stringify(msg), function () {
                if (suc) {
                    suc();
                }
            }, function (msg) {
                if (err) {
                    var obj = JSON.parse(msg);
                    err(obj);
                }
            });
        }        
    },

    /**
    * 设置C2C消息监听
    * @param {iliveMessageCallback} listener - 消息监听
    */
    setC2CListener: function (listener) {
        var c2c = function (msg) {
            var obj = JSON.parse(msg);
            elems = [];
            for (var i = 0; i < obj.elements.length; ++i) {
                var elem = new ILiveMessageElem(obj.elements[i].type, obj.elements[i].content);
                elems.push(elem);
            }
            var message = new ILiveMessage(elems);
            message.time = obj.time;
            message.sender = obj.sender;
            listener(message);
        };
        if (listener) {
            this.ilive.setC2CMessageCallBack(c2c);
        }
    },

   /**
    * 设置群消息监听
    * @param {iliveMessageCallback} listener - 消息监听
    */
    setGroupListener: function (listener) {
        var group = function (msg) {
            var obj = JSON.parse(msg);
            elems = [];
            for (var i = 0; i < obj.elements.length; ++i) {
                var elem = new ILiveMessageElem(obj.elements[i].type, obj.elements[i].content);
                elems.push(elem);
            }
            var message = new ILiveMessage(elems);
            message.time = obj.time;
            message.sender = obj.sender;
            listener(message);
        };
        if (listener) {
            this.ilive.setGroupMessageCallBack(group);
        }
    },

    /**
    * 设置与房间断开连接的监听函数
    * @param {ILiveSDK~iliveErrCallback} listener - 监听函数
    * @description 在一些异常情况下，sdk会自动退出房间，如断网超时未能自动重连成功等。
    * 收到此回调后,sdk已自动退出房间，重新连上网后，需重新进入房间;
    */
    setRoomDisconnectListener: function(listener)
    {
        this.ilive.setRoomDisconnectListener( function (msg) {
            if (listener) {
                var obj = JSON.parse(msg);
                listener(obj);
            }
        });
    },

   /**
    * 设置房间内事件的监听函数
    * @param {iliveRoomEventListener} listener - 事件监听函数
    */
    setRoomEventListener: function (listener) {        
        this.ilive.setRoomEventListener(function (eventid, identifier) {
            roomevent = new ILiveRoomEvent(eventid, identifier);
            listener(roomevent);
        });
    },

   /**
    * 设置被踢下线监听
    * @param {iliveOnForceOffline} listener - 事件监听
    */
    setForceOfflineListener: function (listener) {
        this.ilive.setForceOfflineCallback(function () {
            listener();
        });
    },
    
   /**
    * 开始推流
    * @param {ILivePushStreamOption} option - 推流参数
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调, 回调返回流信息
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    startPushStream: function (option, suc, err) {
        if (option instanceof ILivePushStreamOption) {
            this.ilive.startPushStream(JSON.stringify(option), function (msg) {
                if (suc) {
                    var obj = JSON.parse(msg);
                    suc(obj);
                }
            }, function (msg) {
                if (err) {
                    var obj = JSON.parse(msg);
                    err(obj);
                }
            });
        }
    },

   /**
    * 结束推流
    * @param {number} channelID - 流ID
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    stopPushStream: function (channelID, suc, err) {
        this.ilive.stopPushStream(channelID, function () {
            if (suc) {
                suc();
            }
        }, function (msg) {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },

   /**
    * 设置美颜程度
    * @param {number} beauty - 美颜程度 0~7
    */
	setBeauty: function (beauty) {

		this.ilive.setBeauty(beauty);
	},
    /**
    * 设置美白程度
    * @param {number} white - 美白程度 0~9
    */
	setWhite: function (white) {
		this.ilive.setWhite(white);
	},
    /**
    * 设置清晰程度
    * @param {number} sharpen - 清晰程度 0~9
    */
	setSharpen: function (sharpen) {
		this.ilive.setSharpen(sharpen);
	},
	/**
    * 销毁滤镜资源
    */
	destroyFilter: function(){
		this.ilive.destroyFilter();
	},

   /**
    * 修改角色
    * @param {string} role - 角色名
    * @param {ILiveSDK~iliveSucCallback} suc - 成功回调
    * @param {ILiveSDK~iliveErrCallback} err - 失败回调
    */
    changeRole: function (role, suc, err) {
        this.ilive.changeRole(role, function () {
            if (suc) {
                suc();
            }
        }, function () {
            if (err) {
                var obj = JSON.parse(msg);
                err(obj);
            }
        });
    },
}

/**
* 错误信息
* @class
* @constructor
* @param {string} module - 报错的模块
* @param {number} code - 错误码
* @param {string} message - 错误描述
*/
function ILiveErrorMessage(module, code, message) {
    this.module = module;
    this.code = code;
    this.message = message;
}

/**
* 消息
* @class
* @constructor
* @param {ILiveMessageElem[]} elems - 消息内容
*/
function ILiveMessage(elems) {
    this.elems = elems;
}

/**
* 消息内容元素
* @class
* @constructor
* @param {E_iLiveMessageElemType} type - 消息类型
* @param {string} content - 消息内容
*/
function ILiveMessageElem(type, content) {
    this.type = type;
    this.content = content;
}

/**
* 房间内事件
* @class
* @constructor
* @param {E_iLiveRoomEventType} eventid - 事件id
* @param {string} identifier - 发生此事件的用户id
*/
function ILiveRoomEvent(eventid, identifier) {
    this.eventid = eventid;
    this.identifier = identifier;
}

/**
* 摄像头列表
* @class
* @constructor
* @param {number} code - 获取结果,0表示成功
* @param {ILiveCamera[]} cameras - 摄像头信息列表
*/
function IliveCameraList(code, cameras) {
    this.code = code;
    this.cameras = cameras;
}

/**
* 摄像头信息
* @class
* @constructor
* @param {string} id - 摄像头ID
* @param {string} name - 摄像头名称
*/
function ILiveCamera(id, name) {
    this.id = id;
    this.name = name;
}


/**
* 视频渲染器
* @class
* @constructor
* @param {string} iliveRenderObj - html中iLiveRender object的ID
*/
function ILiveRender(iliveRenderObj) {
    this.render = document.getElementById(iliveRenderObj);
}

ILiveRender.prototype = {
    /**
    * 设置渲染器绑定的用户id。
    * @description 渲染器绑定id后，将会开始渲染绑定用户的视频画面;
    * @param {string} identifer - 用户id
    */
    setIdentifer: function (identifer) {
        this.render.setIdentifer(identifer);
    },

    /**
    * 获取渲染器绑定的用户id
    * @returns {string} 绑定用户的id
    */
    getIdentifer: function () {
        return this.render.getIdentifer();
    },

    /**
    * 渲染器是否空闲可用。
    * @returns {boolean} 控件是否空闲可用，true 是，false 否;
    */
    isFreeRender: function () {
        return this.render.isFreeRender();
    },

    /**
    * 释放控件
    * @description 收到用户关闭摄像头事件时，需要释放渲染控件;
    */
    freeRender: function () {
        this.render.freeRender();
    },

    /**
    * 视频帧截图.
    * @description 对渲染器的当前画面进行截图.
    * @returns {string} 截图的base64编码数据,如果截图失败，返回空字符串;
    */
    snapShot: function () {
        return this.render.snapShot();
    },
}

/**
* 直播码推流录制参数
* @class
* @constructor
* @param {E_iLivePushDataType} dataType - 推流数据类型
* @param {E_iLivePushEncode} encode - 推流数据编码方式
* @param {E_iLivePushRecordFileType} fileType - 录制文件类型
*/
function ILivePushStreamOption(dataType, encode, fileType) {
    this.dataType = dataType;
    this.encode = encode;
    this.fileType = fileType;
}

/**
 * 消息元素类型
 * @readonly
 * @enum {number}
 */
var E_iLiveMessageElemType = {
    /** 文本消息 */
    TEXT: 0,
    /** 自定义消息，消息内容为string。业务层负责解析 */
    CUSTOM: 1,
};

/**
 * 房间内事件类型
 * @readonly
 * @enum {number}
 */
var E_iLiveRoomEventType = {
    /** 打开摄像头 */
    HAS_CAMERA_VIDEO: 3,
    /** 关闭摄像头 */
    NO_CAMERA_VIDEO: 4,
};

/**
 * 推流数据类型
 * @readonly
 * @enum {number}
 */
var E_iLivePushDataType = {
    /** 摄像头 */
    CAMERA: 0,
    /** 辅路 */
    SCREEN: 1,
};

/**
 * 推流数据编码类型
 * @readonly
 * @enum {number}
 */
var E_iLivePushEncode = {
    HLS: 0x1,
    FLV: 0x2,
    HLS_AND_FLV: 0x3,
    RAW: 0x4,
    RTMP: 0x5,
    HLS_AND_RTMP: 0x6,
};

/**
 * 录制文件类型
 * @readonly
 * @enum {number}
 */
var E_iLivePushRecordFileType = {
    /** 不录制，默认。控制台如果设置了自动录制则以控制台配置为准 */
    NONE: 0,
    HLS: 1,
    FLV: 2,
    HLS_FLV: 3,
    MP4: 4,
    HLS_MP4: 5,
    FLV_MP4: 6,
    HLS_FLV_MP4: 7,
};