# iLiveSDK常见问题

## 初始化时报错8002
如果IE不是以管理员身份运行，IE会对Activex做的运行做限制，就会报此错误码，此时有两种解决方案:
1. 以管理员身份运行IE浏览器;
2. 将对应的域名添加到信任的站点,如下图,
![](https://mc.qcloudimg.com/static/img/5f05f0bbb26dff457f8c89230e655613/image.jpg)

## 初始化时报错----对象不支持“initSdk”属性或方法

sdk仅支持32位IE8、32位IE9、32位IE10、32位和64位IE11，请检查IE是否使用了正确版本;查看IE版本方法:<br/>
打开IE-->工具-->关于Internet Explorer,如果有64-bit字样，即为64位版本，如下图,
![](https://mc.qcloudimg.com/static/img/575d9b76449c9c992fcd1bfee8796234/1.png)

## 如何让渲染画面没有黑边

将渲染控件的宽高比设置成和视频画面宽高比一致，比如，SPEAR上配置的画面分辨率是1280*720(16:9),渲染控件的宽高可以设置成如下，

```html
<object id="render" classid="CLSID:1EA15A99-7F53-4B6F-8947-B57A0729918E" width="160" height="90"/>
```
