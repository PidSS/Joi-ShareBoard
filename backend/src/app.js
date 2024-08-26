const express = require('express')
const path = require('path')
require('express-async-errors')
const fileUpload = require('express-fileupload')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const cors = require('cors')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const randString = require('string-random')

const db = require('./db.js')
const ResError = require('./err.js')

const app = express()

app.use(fileUpload({
    createParentPath: true,
    defCharset: 'utf8',
    defParamCharset: 'utf8'
}))
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(morgan('dev'))

app.use("/avatars", express.static('public/avatars'))
app.use("/files", express.static('public/files'))

app.get("/", (req, res)=>{
    res.send("BACKEND SERVING")
})

// 根据uid获取特定用户的信息
app.get("/userinfo/:uid", async (req,res)=>{
    let uid = req.params.uid
    try {
        res.send( await db.getUserByUid(uid) )
    } catch (err) {
        throw new ResError(404, "未找到用户")
    }
})

// 根据用户名获取特定用户的信息
app.get("/userinfo", async (req, res)=>{
    let name = req.query.name
    if ( name===undefined || name==='' )
        throw new ResError(400, "参数缺失：name或uid")
    try {
        res.send( await db.getUserByName(name) )
    } catch(err) {
        throw new ResError(404, "未找到用户")
    }
})

// 获取全部用户的信息
app.get("/allUserInfo", async (req, res)=>{
    res.send( await db.queryAllUsers() )
})

// 创建新用户
app.get("/createUser", async (req, res)=>{
    const { name, avatar_path } = req.query
    if ( name===undefined || name==='' )
        throw new ResError(400, "参数缺失：name")
    if (name.length>15)
        throw new ResError(400, "用户名过长")
    try {
        res.send( await db.createUser(name, avatar_path) )
    } catch(err) {
        if (err==='Name Already Exists')
            throw new ResError(400, "用户名已存在")
        else if (err instanceof Error)
            throw err
        else
            throw new Error(`GET /createUser: 未知错误`)
    }
})

// 修改头像
app.get("/updateAvatar", async (req, res)=> {
    const { uid, avatar_path } = req.query
    if ( uid===undefined || uid==='' )
        throw new ResError(400, "参数缺失：name")
    if ( avatar_path===undefined || avatar_path==='' )
        throw new ResError(400, "参数缺失：avatar_path")
    try {
        res.send( await db.updateAvatar(uid, avatar_path) )
    } catch (err) {
        throw new Error("修改头像:更新数据库数据时发生未知错误，可能是uid不存在")
    }
})


// 上传头像，返回头像存储路径
const avatarStoragePath = 'public/avatars'
const avatarRoutePath = 'avatars'
app.post("/uploadAvatar", (req, res)=>{
    if (req.files===undefined)
        throw new ResError(400, "上传图片缺失")
    const { file } = req.files
    const fileExt = path.extname(file.name)

    //生成唯一文件名
    let newFileStoragePath, newFileRoutePath
    do {
        let newFileName = randString(8) + fileExt
        newFileStoragePath = path.join(avatarStoragePath, newFileName)
        newFileRoutePath = path.join(avatarRoutePath, newFileName)
    } while(fs.existsSync(newFileStoragePath))

    // 保存头像到头像存储目录
    file.mv(newFileStoragePath, (err)=>{
        if (err)
            throw new Error("移动上传的头像时发生未知错误")

        res.send(newFileRoutePath)
    })
})


// 上传文件
const filesStoragePath = 'public/files'
const filesRoutePath = 'files'
app.post("/uploadFile", async (req, res)=>{
    console.log(req.files)
    if (req.files===undefined)
        throw new ResError(400, "上传文件缺失")
    const { file } = req.files
    const fileOriginalName = file.name
    console.log(fileOriginalName)
    const fileExt = path.extname(file.name)

    // 生成唯一文件名
    let newFileStoragePath, newFileRoutePath
    while(true) {
        let newFileName = randString(12) + fileExt
        newFileStoragePath = path.join(filesStoragePath, newFileName)
        newFileRoutePath = path.join(filesRoutePath, newFileName)

        if (fs.existsSync(newFileStoragePath))
            continue

        // 在数据库中保存“存储的文件名”到“原始文件名”的映射，以便下载时使用
        try { await db.newFileRecord(newFileName, fileOriginalName) }
        catch { continue }

        break // 如果上面两条判断（本地文件名无重复、数据库数据无重复）都通过，才会在这里 break；否则继续下一次循环，尝试新的文件名
    }

    // 保存文件到文件存储目录
    file.mv(newFileStoragePath, (err)=>{
        if (err)
            throw new Error("移动上传的头像时发生未知错误")

        res.send(newFileRoutePath)
    })
})


// 下载指定的文件
app.get("/download", async (req, res)=>{
    const { filename } = req.query
    if ( filename===undefined || filename==='' )
        throw new ResError(400, "参数缺失：filename")

    storedName = path.basename(filename) // 这样处理是为了方便前端直接请求 `files/[A-Za-z0-9.]+` 甚至 `api/files/[A-Za-z0-9.]+` 形式的文件名，顺便防止路径穿越

    let originalName, fileStoragePath
    try {
        fileStoragePath = path.join(filesStoragePath, storedName)
        if (!fs.statSync(fileStoragePath).isFile())
            throw new Error()
        originalName = await db.getFileOriginalName(storedName)
    } catch(err) { console.log(err); throw new ResError(404, "文件不存在") }

    res.download(fileStoragePath, originalName)
})


// 创建空间的超级接口
app.post("/SuperCreateSpace", async (req,res)=>{
    let { name, owner, members } = req.body
    if ( name===undefined || name==='' )
        throw new ResError(400, "参数缺失：name")
    if (owner===undefined)
        res.send( await db.createSpace(name, null, null) )
    else try {
        const legalUids = new Set(await db.queryAllUids())
        members = Array.from(new Set(members)) // members去重
        for (let m of members) {
            if (!legalUids.has(m)) throw -1
        }
        if (members.includes(owner))
            res.send( await db.createSpace(name, owner, members) )
        else
            throw new ResError(400, "非法的owner或members")
    } catch (err) {
        if (err===-1) throw new ResError(400, "非法的owner或members")
        else throw err
    }
})

// 创建新空间
app.post("/createSpace", async (req,res)=>{
    let { name, owner, members } = req.body

    if ( name===undefined || name==='' )
        throw new ResError(400, "参数缺失：name")

    if (owner===undefined)
        throw new ResError(400, "参数缺失：owner")

    const legalUids = new Set(await db.queryAllUids())
    
    if (!(members instanceof Array) || members.length===0) {
        if (legalUids.has(owner))
            res.send( await db.createSpace(name, owner, null) )
        else throw new ResError(400, "非法的owner")
    }
    else {
        members = Array.from(new Set(members)) // members去重
        for (let m of members) {
            if (!legalUids.has(m)) throw new ResError(400, "非法的owner或members")
        }
        if (members.includes(owner))
            res.send( await db.createSpace(name, owner, members) )
        else
            throw new ResError(400, "非法的owner或members")
    }
})

// 查询所有可见空间（已登陆用户）
app.get("/listSpaces/:uid", async (req,res)=>{
    let uid = req.params.uid
    res.send( await db.listVisibleSpaces(uid) )
})

// 查询所有可见空间（访客）
app.get("/listSpaces", async (req,res)=>{
    res.send( await db.listPublicSpaces() )
})

// 查询默认空间（默认是Main）
app.get("/defaultSpace", async (req, res)=>{
    res.send( await db.defaultSpace() )
})

// 更改空间配置
app.post("/modifySpace/:sid", async(req,res)=>{
    const sid = req.params.sid
    let { name, members } = req.body
    if (name===undefined || name==='')
        name=null
    const { sid:default_sid } = await db.defaultSpace()
    if (sid===default_sid.toString())
        throw new ResError(403, "默认空间(Main)已经被我们严密保护起来了，不许修改！")

    if (!(members instanceof Array) || members.length===0) {
        members = null
    } else {
        const legalUids = new Set(await db.queryAllUids())
        members = Array.from(new Set(members)) // members去重
        for (let m of members) {
            if (!legalUids.has(m)) throw new ResError(400, "非法的members")
        }
    }

    try {
        await db.modifySpace(sid, name, members)
        res.status(200).end()
    } catch(err) {
        if (err===0)
            throw new ResError(404, "未找到sid对应内容")
        else throw err
    }
})

// 删除空间
app.get("/deleteSpace/:sid", async (req, res)=>{
    const sid = req.params.sid

    const { sid:default_sid } = await db.defaultSpace()
    if (sid===default_sid.toString())
        throw new ResError(403, "默认空间(Main)已经被我们严密保护起来了，不许修改！")

    try {
        await db.deleteSpace(sid)
        res.status(200).end()
    } catch(err) {
        if (err===0)
            throw new ResError(404, "未找到sid对应内容")
        else throw err
    }
})

// 列出空间内所有剪贴板
app.get("/listBoards/:sid", async (req, res)=>{
    let sid = req.params.sid
    res.send( await db.listBoards(sid) )
})

// 发布新剪贴板
app.post("/postBoard/:sid", async (req,res)=>{
    const sid = req.params.sid
    const { uid:poster_uid, content } = req.body
    check1 = poster_uid===undefined || poster_uid===''
    check2 = content===undefined || content===''
    if (check1 || check2)
        throw new ResError(400, "参数缺失：uid或content")
    res.send( await db.newBoard(sid, content, poster_uid) )
})

// 获取剪贴板内容
app.get("/getBoardContent/:sid", async (req,res)=>{
    const sid = req.params.sid
    const { bid } = req.query
    if (bid===undefined || bid==='')
        throw new ResError(400, "参数缺失：bid")
    try {
        res.send( await db.getBoardContent(sid, bid) )
    } catch(err) {
        if (err===0)
            throw new ResError(404, "未找到bid对应内容")
        else
            throw err
    }
})

// 修改剪贴板
app.post("/updateBoard/:sid", async (req,res)=>{
    const sid = req.params.sid
    const { bid, content } = req.body
    check1 = bid===undefined || bid===''
    check2 = content===undefined || content===''
    if (check1 || check2)
        throw new ResError(400, "参数缺失：uid或content")
    try {
        res.send( await db.updateBoard(sid, bid, content) )
    } catch (err) {
        if (err===0)
            throw new ResError(404, "未找到bid对应内容")
        else
            throw err
    }
})

// 删除剪贴板
app.get("/deleteBoard/:sid", async (req, res)=>{
    const sid = req.params.sid
    const { bid } = req.query
    if (bid===undefined || bid==='')
        throw new ResError(400, "参数缺失：bid")
    try {
        await db.deleteBoard(sid, bid)
        res.status(200).end()
    } catch (err) {
        if (err===0)
            throw new ResError(404, "未找到bid对应内容")
        else if (err===1)
            throw new ResError(404, "未找到sid对应内容")
        else
            throw err
    }
})

// 错误处理中间件
app.use((err, req, res, next) => {
    if (err instanceof ResError) {
        res.status(err.status).send(err.resMsg)
    } else {
        console.log(err.stack)
        res.status(500).send("服务器内部错误")
    }
})

exports.app = app