# lOOKiNTO

> I consider nobody but Chinese will use the total grap, so unlike to what I will often do, I did not prepare English version REAME.

[![安装脚本](https://img.shields.io/badge/Install%20Script-GreasyFork-orange)](https://raw.githubusercontent.com/unamed-coder/lOOKiNTO/main/lookinto.user.js)

## 概览

一个简单至极的 Tampermonkey 脚本，方便查看某个洛谷用户的最后活跃时间。以及其他统计信息（尚未实现）。

## 功能特性


- 在洛谷用户主页：

    - 右边的侧边栏信息卡片中添加了**最后一次提交题目**的日期、时间和提交详情超链接。

没了。

## 安装方法

1. 安装 Tampermonkey 篡改猴插件。

    - 谷歌浏览器：[Crx 搜搜](https://www.crxsoso.com/webstore/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo)或[Google 扩展商店](https://chromewebstore.google.com/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo)（需科学上网）

    - 火狐浏览器：[Mozilla Firefox 扩展商店](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)

    - Microsoft Edge 浏览器：[Microsoft Edge 商店](https://microsoftedge.microsoft.com/addons/detail/iikmkjmpaadaobahmlepeloendndfphd)

    - 可参照 [Tampermonkey 官网](https://www.tampermonkey.net/index.php?locale=zh) 教程。

2. 安装 [lOOKiNTO 脚本](https://raw.githubusercontent.com/unamed-coder/lOOKiNTO/main/lookinto.user.js)。

3. 享用。打开任意洛谷用户主页，即可在从右边的侧边栏最后一个信息卡片看见脚本注入的信息。

    - 如果没有生效，记得去 Tampermonkey 管理面板看看是否有开启运行。

## 设计初衷

我喜欢在洛谷上 $\xcancel{\text{调查}}$ 别人。比如说看看某个洛谷用户最后一次提交记录的时间，以了解 TA 在洛谷上最后活动的时间。还有，在和同团队的用户交流时，想要知道 TA 的团队备注名（一般是人名）必须要到团队的成员板块查看，非常不方便。

鉴于我有能力自己动手解决，便编写了这个脚本。

## 真心话

我连 JavaScript 都没学扎实，就来这一顿乱敲，不过看着还行吧。由于我还要备战 CCF CSP-J/S，便不能浪费在这旁骛上。因此，我仅仅实现了一个功能，出了 MVP 就把它发布了。

## 许可证

MIT 许可证。