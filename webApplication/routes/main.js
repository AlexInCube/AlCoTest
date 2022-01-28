const fs = require("fs");
module.exports = function (app){

    function isFolder(path){
        return fs.statSync(path).isDirectory() && fs.existsSync(path)
    }

    app.get('/',(req,res) => {
        res.send("Как у тебя хватило ума сюда попасть?")
    })
}