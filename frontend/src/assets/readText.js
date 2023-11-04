import languageEncoding from "detect-file-encoding-and-language"

function _readFileArrayBuffer(file) {
    return new Promise((resolve, reject)=>{
        let fileReader = new FileReader()
        fileReader.onload = ev => resolve(ev.target.result)
        fileReader.onerror= err => reject(err)
        fileReader.readAsArrayBuffer(file)
    })
}

function _arbitraryReadTextFile(file, encoding) {
    return new Promise((resolve, reject)=>{
        let fileReader = new FileReader()
        fileReader.onload = ev => resolve(ev.target.result)
        fileReader.onerror= err => reject(err)
        fileReader.readAsText(file, encoding)
    })
}

const confidenceThreshold = 0.4

export async function readTextFile(file) {
    let fileInfo = await languageEncoding(file)
    let confidence = fileInfo.confidence.encoding
    if (confidence === null || confidence < confidenceThreshold) throw "readTextFile: confidence too low to return valid text"
    return await _arbitraryReadTextFile(file, fileInfo.encoding)
}