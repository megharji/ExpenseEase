const mongoose = require("mongoose")
mongoose.connect("mongodb://127.0.0.1:27017/expense")
        .then(()=> console.log("DB connected"))
        .catch((err)=> console.log(err.message))