var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");

passport.use(new localStrategy(userModel.authenticate()));

router.get("/", function (req, res) {
  res.render("index", { footer: false });
});

router.get("/login", function (req, res) {
  res.render("login", { error: req.flash("error"), footer: false });
  console.log(req.flash("error"));
});

router.get("/feed", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const posts = await postModel.find().populate("user");
  console.log(posts);
  res.render("feed", { footer: true, posts, user });
});

router.get("/profile", isLoggedIn, async function (req, res) {
  try {
    const user = await userModel
      .findOne({ username: req.session.passport.user })
      .populate("posts");
    console.log(user);
    res.render("profile", { footer: true, user });
  } catch (error) {
    console.error(error);
    // Handle the error appropriately (send an error response, redirect, etc.)
    res.status(500).send("Internal Server Error");
  }
});

router.get("/userprofile/:username", isLoggedIn, async function (req, res) {
  try {
    const friend = await userModel
      .findOne({ username: req.params.username })
      .populate("posts");
    if (!friend) {
      return res.status(404).send("User not found");
    }

    res.render("friendprofile", { footer: true, user: friend });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/friendprofile/:username", isLoggedIn, async function (req, res) {
  try {
    const friend = await userModel
      .findOne({ username: req.params.username })
      .populate("posts");
    if (!friend) {
      return res.status(404).send("User not found");
    }
    res.render("friendprofile", { footer: true, user: friend });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/search", isLoggedIn, async function (req, res) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  res.render("search", { footer: true, user });
});

router.get("/like/post/:id", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const post = await postModel.findOne({ _id: req.params.id });

  //if user not liked the post
  if (post.likes.indexOf(user._id) === -1) {
    post.likes.push(user._id);
  } else {
    post.likes.splice(post.likes.indexOf(user._id), 1);
  }
  await post.save();
  res.redirect("/feed");
});

router.get("/edit", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("edit", { footer: true, user });
});

router.get("/upload", isLoggedIn, function (req, res) {
  res.render("upload", { footer: true });
});

router.get("/username/:username", isLoggedIn, async function (req, res) {
  const regex = new RegExp(`^${req.params.username}`, "i");
  const users = await userModel.find({ username: regex });
  res.json(users);
});

router.post("/register", function (req, res, next) {
  const userData = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
  });

  userModel.register(userData, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/feed",
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (req, res, next) {}
);

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.post("/update", upload.single("image"), async function (req, res) {
  const user = await userModel.findOneAndUpdate(
    { username: req.session.passport.user },
    { username: req.body.username, name: req.body.name, bio: req.body.bio },
    { new: true }
  );

  if (req.file) {
    user.profileImage = req.file.filename;
  }
  await user.save();
  res.redirect("/profile");
});


// Delete a post by ID
router.delete("/post/delete/:id", isLoggedIn, async function (req, res) {
  try {
    const postId = req.params.id;
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    // Find the post and check if it belongs to the logged-in user
    const post = await postModel.findOne({ _id: postId, user: user._id });

    if (!post) {
      return res
        .status(404)
        .json({
          message:
            "Post not found or you are not authorized to delete this post.",
        });
    }

    // Delete the post from the database
    await postModel.findByIdAndDelete(postId);

    // Remove the post from the user's posts array
    user.posts = user.posts.filter((p) => p.toString() !== postId);
    await user.save();

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting post", error });
  }
});

router.post(
  "/upload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const post = await postModel.create({
      picture: req.file.filename,

      user: user._id,

      caption: req.body.caption,
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/feed");
  }
);

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;
