const db = require('../src/db')

db.init(true)
    .then(()=> console.log("\n[+] 数据库初始化成功\n[-] 请使用npm run dev启动服务器"))
    .catch((err)=>{
        console.log("[!] !!发生错误!!")
        console.error(err)
    })