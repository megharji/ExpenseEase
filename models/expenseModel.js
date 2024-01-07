const mongoose = require("mongoose");

const expenseModel = new mongoose.Schema(
    {
        amount: Number,
        description: String,
        category: String,
        title: String,
        paymentmode: {
            type: String,
            enum: ["Cash", "Online", "Cheque"]
        },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    },
    { timestamps: true }  //This provides the date time of the post when it is posted By the user
);

module.exports = mongoose.model("expense", expenseModel);