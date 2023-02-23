# logseq-plugin-weread-sync

配合 Chrome 插件“微信读书 LS 同步助手”使用，同步微信读书数据。

## 功能特点

- 同步书架书籍。
- 同步划线。
- 同步想法。
- 增量更新。
- 已有划线与想法不会被更新覆盖，确保引用有效。
- 同步被删除的划线与想法时，已有引用的划线与想法不会被删除，而是会被标记为“已被删除”。
- 书籍页面正文可编辑，不影响后续数据同步。（请不要变动层级结构）

![sample](https://user-images.githubusercontent.com/3410293/220123566-e1b61281-709b-486f-a562-1005bda90182.png)

## 安装

你需要安装本插件以及[这里](https://github.com/sethyuan/chrome-weread-sync/releases)配套的 Chrome 插件。你还需要打开 Logseq 的 HTTP APIs Server。

### 本插件安装

在 Logseq 插件市场中找到并安装。

### Chrome 插件安装

1. 下载[最新的 zip 包](https://github.com/sethyuan/chrome-weread-sync/releases)，找个合适的地方解压。
1. 到 Chrome 中地址栏里打开 `chrome://extensions`，开启开发者模式。![image](https://user-images.githubusercontent.com/3410293/220122712-fcbd559a-c9f1-484c-a47b-667525838605.png)
1. 加载刚刚解压出的文件夹。![image](https://user-images.githubusercontent.com/3410293/220122743-5c575064-ac26-407c-868c-8aef443a9f43.png)

浏览器端插件安装完毕。

### 打开 HTTP APIs Server

Logseq 中开启 `设置 -> 更多功能 -> HTTP APIs Server`。

## 配置

1. 在 Logseq 窗口顶部 API Server 处打开 `Server configurations`。
1. Host 填 `127.0.0.1`，Port 填一个大于 10000 的数。
1. 关掉 `Server configurations`，打开 `Authorization tokens`。
1. 新建一个 token，名字随意，建议“微信读书”；值填写一段密文，例如 `A8d)a!d6`。
1. 来到浏览器端，在插件菜单打开插件的选项页。
1. 将刚刚做的 API Server 的配置输入进去保存。
1. 来到 Logseq，打开插件配置，这里你可以做些自定义如觉得有必要的话。

![image](https://user-images.githubusercontent.com/3410293/220122588-eb2b1e36-a501-4464-8826-b90b7caba572.png)

![image](https://user-images.githubusercontent.com/3410293/220123040-76277107-56ae-43a9-a4f8-8c7690b0ea04.png)

![image](https://user-images.githubusercontent.com/3410293/220123158-753a5965-86ce-4807-a34d-46192e2e672c.png)

配置工作完毕。

## 使用

### 如何同步

1. 确保 Logseq 已启动并且 HTTP APIs Server 也已在运行中。
1. 浏览器中点击插件按钮，它会帮你打开微信读书的网站。登录，如果你还没登录的话。
1. 再次点击插件按钮，同步开始，会有进度提示，最后看到“完成”字样同步成功。首次同步时由于数据量较大，微信读书的 API 很可能会报错，重复操作几次就可以了；另外首次导入时间也会较长，请耐心等待。

后续每次同步都是同样的过程。

### 如何查看导入的书籍与笔记

所有导入的书籍都是一个页面，都有一个“来源”属性，值是“微信读书”，所以如果想列出所有微信读书过来的书籍及笔记的话只要做这个属性的查询就可以了。

### 元数据

导入的书籍和笔记上都以属性的形式存放了一些有用的元数据，例如笔记的创建日期，可以方便用户查询。

### 隐藏属性

因为元数据属性太多，可能看起来会比较乱，这个时候可以用下面 Logseq 配置（config.edn）来隐藏不想看到的属性：

```edn
 ;; hide specific properties for blocks
 ;; E.g. :block-hidden-properties #{:created-at :updated-at}
 :block-hidden-properties #{:版本 :书籍id :章节id :划线id :想法id :创建日期 :起始 :结束 :部分}
```
