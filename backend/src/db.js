/**
 * 提供与Postgres数据库的接口
 * @module
 * @author Pid
 */
const dotenv = require('dotenv')
dotenv.config()
const pgp = require('pg-promise')()
const db = pgp(process.env.PG_URI)

const spaceSchema = (sid) => `Space${sid}`

/**
 * @todo init 数据库初始化
 */

exports.init = (debug) =>
    db.tx(async t => {

        if (debug) console.log("[-] 数据库连接成功")

        // 创建users表
        await t.none(`CREATE TABLE IF NOT EXISTS public.users
        (
            uid smallserial NOT NULL,
            name character varying(15) COLLATE pg_catalog."default" NOT NULL,
            avatar_path text,
            CONSTRAINT users_pkey PRIMARY KEY (uid),
            CONSTRAINT users_name_key UNIQUE (name)
        )`)

        if (debug) console.log("[-] [用户表(users)创建成功")

        // 创建spaces表
        await t.none(`CREATE TABLE IF NOT EXISTS public.spaces
        (
            sid smallserial NOT NULL,
            name text NOT NULL,
            owner smallint,
            members smallint[],
            CONSTRAINT spaces_pkey PRIMARY KEY (sid)
        )`)

        if (debug) console.log("[-] 空间表(spaces)创建成功")

        // 创建Main空间
        const { sid } = await t.one('INSERT INTO spaces(name, owner, members) VALUES($1, $2, $3) RETURNING sid', ['Main', null, null])
        await t.none('CREATE SCHEMA $1:name', spaceSchema(sid))
        await t.none(`CREATE TABLE $1:name.index
            (
                bid smallserial NOT NULL,
                content text NOT NULL,
                poster_uid smallint NOT NULL,
                created_at timestamp without time zone NOT NULL DEFAULT LOCALTIMESTAMP,
                updated_at timestamp without time zone,
                PRIMARY KEY (bid)
            );`, spaceSchema(sid))

        if (debug) console.log("[-] 主空间(Main)创建成功")
        if (debug) console.log("[-] 数据库初始化完成")

        return
    })


/** @description ### 用户表相关部分 */


/**
 * @typedef {Object} UserInfo
 * @property {number} uid
 * @property {string} name
 * @property {string} avatar_path
 */

/**
 * 从用户id查询用户信息
 * @function
 * @param {number} uid 用户id
 * @return {Promise<UserInfo>} 返回UserInfo对象，Promise类型
 */
exports.getUserByUid = (uid) =>
    db.one('SELECT * FROM users WHERE uid = $1', uid)


/**
 * 从用户名查询用户信息
 * @function
 * @param {string} name 用户名
 * @returns {Promise<UserInfo>} 返回UserInfo对象，Promise类型
 */
exports.getUserByName = (name) =>
    db.one('SELECT * FROM users WHERE name = $1', name)


/**
 * @todo 查询所有用户
 */
exports.queryAllUsers = () => db.any('SELECT * FROM users')

/**
 * 查询所有用户uid的列表
 * @returns {Promise<number[]>}
 */
exports.queryAllUids = () => new Promise((resolve, reject)=>{
    db.any('SELECT uid FROM users')
        .then( data => resolve( data.map(item => item.uid) ) )
        .catch( err => reject(err) )
})


/**
 * 创建新用户，需要提供用户名，可选提供头像路径
 * @param {string} name
 * @param {string} avatar_path
 * @returns {Promise<UserInfo>} 新增的用户信息
 */
exports.createUser = (name, avatar_path) => new Promise((resolve, reject)=>{
    db.one('INSERT INTO users(name, avatar_path) VALUES($1, $2) RETURNING uid, name, avatar_path', [name, avatar_path])
        .then( data => resolve(data) )
        .catch( err => {
            if (err.code==='23505')
                reject('Name Already Exists')
            else
                console.log(err)
                reject(err)
        })
})


/**
 * @todo 用户重命名
 */
exports.renameUser = undefined


/**
 * 更新头像
 * @param {number} uid 
 * @param {string} avatar_path 
 * @returns {Promise<UserInfo>}
 */
exports.updateAvatar = (uid, avatar_path) => 
    db.one('UPDATE users SET avatar_path=$2 WHERE uid=$1 RETURNING uid, name, avatar_path', [uid, avatar_path])


/** @description ### 空间相关内容 */


/**
 * @typedef {Object} SpaceInfo
 * @property {number} sid
 * @property {string} name
 * @property {string} [owner]
 * @property {string[]} [members]
 */


/**
 * 创建新空间
 * @param {string} name 新空间名称
 * @returns {Promise<SpaceInfo>} 新创建的空间的信息
 */
exports.createSpace = (name, owner, members) =>
    db.tx(async t => {
        const { sid } = await t.one('INSERT INTO spaces(name, owner, members) VALUES($1, $2, $3) RETURNING sid', [name, owner, members])
        await t.none('CREATE SCHEMA $1:name', spaceSchema(sid))
        await t.none(`CREATE TABLE $1:name.index
            (
                bid smallserial NOT NULL,
                content text NOT NULL,
                poster_uid smallint NOT NULL,
                created_at timestamp without time zone NOT NULL DEFAULT LOCALTIMESTAMP,
                updated_at timestamp without time zone,
                PRIMARY KEY (bid)
            );`, spaceSchema(sid))
        return t.one('SELECT sid, name, owner, members FROM spaces WHERE sid=$1', sid)
    })


/**
 * 返回默认空间的sid和name（Main空间默认会被放在第一个，也就是返回Main空间）
 * @returns {Promise<SpaceInfo>}
 */
exports.defaultSpace = () =>
    db.one('SELECT sid, name FROM spaces ORDER BY sid LIMIT 1')


/**
 * 查询所有可见空间的sid和name, 按照sid排序，第一个理应是Main空间
 * @param {number} uid 
 * @returns {Promise<SpaceInfo[]>}
 */
exports.listVisibleSpaces = (uid) =>
    db.any('SELECT sid, name, owner, members FROM spaces WHERE members IS NULL or $1 = ANY (members) ORDER BY sid', uid)

/**
 * 查询所有公开空间
 * @returns {Promise<SpaceInfo[]>}
 */
exports.listPublicSpaces = () =>
    db.any('SELECT sid, name, owner, members FROM spaces WHERE members IS NULL ORDER BY sid')

/**
 * 修改空间名称、成员
 * @param {number} sid 
 * @param {string} name 
 * @param {number[]} members 
 * @returns {Promise<void>}
 * @throws {number} 0 没有找到对应空间
 */
exports.modifySpace = (sid, name, members) => new Promise((resolve, reject)=>{
    db.result('UPDATE spaces SET name=$2, members=$3 WHERE sid=$1', [sid, name, members])
        .then( result => {
            if (result.rowCount===1) resolve()
            else reject(0)
        })
        .catch( err => reject(err) )

})
    

/**
 * 删除空间
 * @param {number} sid 
 * @returns {Promise<void>}
 * @throws {number} 0 没有找到对应空间
 */
exports.deleteSpace = (sid) =>
    db.tx(async t => {
        try {
            const result = await t.result('DELETE FROM spaces WHERE sid=$1', sid)
            if (result.rowCount!==1) throw 0
            await t.none('DROP SCHEMA $1:name CASCADE', spaceSchema(sid))
            return
        } catch (err) {
            throw err
        }
    })



/** ### 剪贴板操作相关内容 */


/**
 * 列出空间下所有剪贴板信息（除content以外）
 * @param {number} sid 空间sid
 * @returns {Promise<{bid:number, poster_uid:number, created_at:string, updated_at:string}[]>} 剪贴板信息（除content以外）的列表
 */
exports.listBoards = (sid) =>
    db.any(`SELECT bid, poster_uid,
        to_char(created_at, 'YYYY/MM/DD HH24:MI') AS created_at,
        to_char(updated_at, 'YYYY/MM/DD HH24:MI') AS updated_at
        FROM $1:name.index`, spaceSchema(sid))


/**
 * 插入新剪贴板
 * @param {number} sid 空间sid
 * @param {string} content 剪贴板内容
 * @param {number} poster_uid 发布者uid
 * @returns {Promise<{bid:string, created_at:string, updated_at:string}>} 新插入的剪贴板的信息
 */
exports.newBoard = (sid, content, poster_uid) =>
    db.one(`INSERT INTO $1:name.index (content, poster_uid) VALUES($2, $3)
        RETURNING bid,
        to_char(created_at, 'YYYY/MM/DD HH24:MI') AS created_at,
        to_char(updated_at, 'YYYY/MM/DD HH24:MI') AS updated_at`, [spaceSchema(sid), content, poster_uid])


/**
 * 查询剪贴板内容
 * @param {number} sid 空间sid
 * @param {number} bid 剪贴板bid
 * @returns {Promise<{content:string}>} 剪贴板内容
 */
exports.getBoardContent = (sid, bid) => new Promise((resolve, reject)=>{
    db.one('SELECT content FROM $1:name.index WHERE bid=$2', [spaceSchema(sid), bid])
        .then( data => resolve(data) )
        .catch( err => {
            if (err.code===0) reject(0)
            else reject(err)
        })
})


/**
 * 修改剪贴板内容
 * @param {number} sid 空间sid
 * @param {number} bid 剪贴板bid
 * @param {string} content 剪贴板新内容
 * @returns {Promise<{updated_at: string}>} 剪贴板更新时间
 * @throws {number} 0 没有找到对应剪贴板
 * @throws {number} 1 没有找到对应空间 
 */
exports.updateBoard = (sid, bid, content) => new Promise((resolve, reject) =>{
    db.one(`UPDATE $1:name.index SET content=$3, updated_at=LOCALTIMESTAMP WHERE bid=$2
        RETURNING to_char(updated_at, 'YYYY/MM/DD HH24:MI') AS updated_at`, [spaceSchema(sid), bid, content])
        .then( data => resolve(data) )
        .catch( err => {
            if (err.code===0)
                reject(0)
            else
                reject(err)
        })
})

/**
 * 删除剪贴板
 * @param {number} sid 空间sid
 * @param {number} bid 剪贴板bid
 * @returns {void}
 * @throws {number} 0 没有找到对应剪贴板
 * @throws {number} 1 没有找到对应空间 
 */
exports.deleteBoard = (sid, bid) => new Promise((resolve, reject) =>{
    db.result('DELETE FROM $1:name.index WHERE bid=$2', [spaceSchema(sid), bid])
        .then( result=> {
            if (result.rowCount===1) resolve()
            else reject(0)
        })
        .catch( err => {
            if (err.code==='42P01')
                reject(1)
            else
                reject(err)
        })
})