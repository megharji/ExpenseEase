var express = require('express');   //route ke liye hota hain
var router = express.Router();       
var upload = require("../utils/multer").single("avatar");
const User = require("../models/userModel");
const Expense  = require("../models/expenseModel");
const nodemailer = require("nodemailer");
const passport = require("passport");
const LocalStrategy = require("passport-local");      //kud ka method lagaya hai
passport.use(new LocalStrategy(User.authenticate()));    //login ka fasality 
const { sendmail } = require("../utils/sendmail");





/* GET home page. */
router.get('/', function(req, res, next) {            
  res.render('index', { admin: req.user });
});

router.get('/about', function(req, res, next) {            
  res.render('about', { admin: req.user });
});

router.get('/login', function(req, res, next) {  

  res.render('login', { admin: req.user });
});

router.post("/login", passport.authenticate("local", {               
      successRedirect: "/profile",
      failureRedirect: "/login",
      failureMessage: true,
  }),
  function (req, res, next) {}
);

router.get('/register', function(req, res, next) {                            //SIGN UP 
  res.render('register', { admin: req.user });
});

router.post('/register', async function(req, res, next) {               //SIGN UP 
  try {
        await User.register({
          username: req.body.username, email:req.body.email},
          req.body.password
        );
        res.redirect("/login")
  } catch (error) {
    console.log(error);
    res.send(error)
  }                        
});

router.get('/image', function(req, res, next) {            
  res.render('image', { admin: req.user });
});

router.post("/upload", function (req, res, next) {
  upload(req, res, async function (err) {
      if (err) throw err;
      const currentUser = await User.findOne({
        _id:req.user._id
      })

      currentUser.image = req.file.filename

      await currentUser.save()
      res.redirect("/profile")
      
  });
});


router.get('/profile', isLoggedIn, async function(req, res, next) {
  try {
    const { expenses } = await req.user.populate("expenses");     // Populate is written so that the full Details of the user Is received in post who is logged in
    console.log(req.user, expenses);
    res.render("profile", { admin: req.user, expenses, file: req.file, });
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});

router.get("/signout", isLoggedIn, function (req, res, next) {
  req.logout(() => {
      res.redirect("/login");
  });
});


router.get('/delete/:id', isLoggedIn,async function(req, res){
  try {
    
    const expenseIndex = await req.user.expenses.findIndex((mov)=>mov._id.toString() === req.params.id);
    req.user.expenses.splice(expenseIndex, 1);
    await req.user.save();

    await Expense.findByIdAndDelete(req.params.id);
    res.redirect('/profile')
  } catch (error) {
    console.log(error);
    res.send(err)

  }
})

router.get('/update/:id',isLoggedIn, async function(req, res, next) {
  try{
   const user = await Expense.findById(req.params.id)  // data le rha 
   res.render("update",{user, admin: req.user})
}
  catch(err){
    res.send(err)
  }
});

router.post('/update/:id',isLoggedIn,  async function(req, res, next) {
  try{
  await Expense.findByIdAndUpdate(req.params.id,req.body) //   Expense mai se data nikal rhe hai findById(req.params.id) req.params.id se id mil gya and findById se id find kiya aur  AndUpdate(req.body) isse req.body se form ka data mila usko And Update se update kr diya
   res.redirect("/profile")
}
  catch(err){
    res.send(err)
  }
});

router.get('/forget', function(req, res, next) {
  res.render('forget', { admin: req.user });
});


router.post("/send-mail", async function (req, res, next) {
  try {
      const user = await User.findOne({ email: req.body.email });
      if (!user)
          return res.send("User Not Found! <a href='/forget'>Try Again</a>");

      sendmail(user.email, user, res, req);
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});


router.post("/forget/:id", async function (req, res, next) {
  try {
      const user = await User.findById(req.params.id);
      if (!user)
          return res.send("User not found! <a href='/forget'>Try Again</a>.");

      if (user.token == req.body.token) {
          user.token = -1;
          await user.setPassword(req.body.newpassword);
          await user.save();
          res.redirect("/login");
      } else {
          user.token = -1;
          await user.save();
          res.send("Invalid Token! <a href='/forget'>Try Again<a/>");
      }
  } catch (error) {
      res.send(error);
  }
});


router.get("/reset", isLoggedIn, async function (req, res, next) {
  res.render("reset", { admin: req.user });
});

router.post("/reset", isLoggedIn, async function (req, res, next) {
  try {
      await req.user.changePassword(
          req.body.oldpassword,
          req.body.newpassword
      );
      await req.user.save();
      res.redirect("/profile");
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});



router.get("/createexpense", isLoggedIn, function (req, res, next) {
  res.render("createexpense", { admin: req.user });
});


router.post("/createexpense", isLoggedIn, async function (req, res, next) {
  try {
      const expense = new Expense(req.body);  // form ka data save kr rhe hai
      req.user.expenses.push(expense._id);    //user ko bata rhe hai konsa data create kiya hai expnse ka 
      expense.user = req.user._id;     
      await expense.save();
      await req.user.save();
      res.redirect("/profile");
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});

router.get("/filter", async function (req, res, next) {
  try {
      let { expenses } = await req.user.populate("expenses");
      expenses = expenses.filter((e) => e[req.query.key] == req.query.value);
      res.render("profile", { admin: req.user, expenses });
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {                 
      next();    
  } else {
      res.redirect("/login");
  }
}



module.exports = router;
