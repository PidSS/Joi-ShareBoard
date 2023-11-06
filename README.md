# Joi shareboard

***Joi shareboard*** 是一个在线剪贴板服务，支持多途径粘贴复制，Docker快速部署，Markdown编辑，多空间隔离。

*Joi shareboard* 服务于线下断网比赛场景，期望为选手提供可快速部署、简单易用的文件和信息共享能力。因此，*Joi shareboard* 不打算替代notion。

## 功能
- 注册 / 登陆 / 更改头像
- Markdown编辑（支持Github Flavored Markdown）
- 快捷键粘贴 / 拖拽粘贴
- 自动识别（大部分）文本文件并转为Markdown代码块格式
- 创建 / 修改 / 删除空间，空间可配置可见性，不会互相污染
- 前端搜索剪贴板内容 / 搜索特定用户

## TODO
- 面向curl的API
- 支持文件 / 图片的上传、下载、展示
- 剪贴板分页加载
- 后端搜索 / 正则匹配 / shell风格匹配
- 优化Markdown渲染效果
- 优化加载视觉提示和错误处理

## 部署

### 对于docker部署

> 首先将`frontend/`中的`dist.zip`解压为`dist/`（解压后应存在`frontend/dist/index.html`）
> 
> 在项目根目录 执行
> ```
> docker compose up
> ```

### 对于原生部署

#### 前端

**静态部署时**，将`fontend/dist.zip`解压为`dist/`，并使用任意静态网站托管工具（如nginx）托管此文件夹

环境变量`VITE_API_URL`指示了前端访问后端API的路由基地址，你可能需要为此设置转发

**若是开发**，请参照以下流程：
```
cd frontend
npm install
npm run dev
```
你可以在`frontend/`目录下创建`.env`文件来提供环境变量`VITE_API_URL`

`frontend/vite.config.js`中配置了proxy转发，请按需修改


#### 后端

环境变量`PG_URI`指示后端连接PostgreSQL数据库所需的URI（可以使用`.env`文件提供）
```
cd backend
npm install 
npm run db-init
npm run dev
```


## 技术栈
- 前端: Vue3 + Vite + Naive UI
- 后端: Express + PostgreSQL

## License
MIT @ 2023 Pid