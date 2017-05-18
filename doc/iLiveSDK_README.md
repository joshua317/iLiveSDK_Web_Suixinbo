# iLiveSDK集成参考

## 支持的浏览器
32位IE9，32位IE10，IE11

## iLiveSDK集成步骤
1、下载iLiveSDK的cab和js文件,点[这里](https://github.com/zhaoyang21cn/iLiveSDK_Web_Demos/blob/master/iLiveSDK)
2、将iLiveSDK.cab和iLiveSDK.js拷贝到项目目录下;
3、在html的head中引入js文件,如下:
	<script type="text/javascript" src="js/iLiveSDK.js"></script>
4、在html中加载cab文件,如下:
	<object id="iLiveSDKCom" classid="CLSID:54E71417-216D-47A2-9224-C991A099C531" codebase="路径/iLiveSDK.cab#version=版本号"></object>
	<br/>
	这里加上版本号，以后更新iLiveSDK，只需要替换cab文件和js文件，修改这里的版本号，用户打开此页面时，会自动安装新版本的cab文件;
	注意，这里的版本号分隔符是逗比，不是点号;
	详细接入参考demo[随心播](https://github.com/zhaoyang21cn/ILiveSDK_Web_Demos/tree/master/suixinbo);
	[版本更新说明](https://github.com/zhaoyang21cn/iLiveSDK_Web_Demos/blob/master/doc/iLiveSDK_ChangeList.md)
5、调用sdk的接口;


