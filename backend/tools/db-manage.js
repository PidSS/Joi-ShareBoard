const db = require('../src/db')
const { sleep } = require('./tool')

function tryInitDB(count, maxcount, delay) {
    db.init(true)
        .then(()=> console.log("\n[+] 数据库初始化成功\n"))
        .catch((err)=>{
            if (err.code==='ECONNREFUSED') {
                if (count<maxcount) {
                    console.log("[-] 连接数据库失败，正在尝试重连\n")
                    sleep(delay).then(()=>{
                        tryInitDB(count+1, maxcount, delay)
                    })
                } else {
                    console.log("[!] 重连失败！数据库初始化失败\n")
                }
            }
            else { 
                console.log("[!] !!发生错误!!数据库初始化失败\n")
                console.error(err)
            }
        })
}

tryInitDB(0, 5, 500)