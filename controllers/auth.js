import User from "../models/user.js"
import Blog from "../models/blog.js"
import jwt from "jsonwebtoken"
import _ from "lodash"
import { expressjwt } from "express-jwt"
import "dotenv/config.js";
import { errorHandler } from "../helpers/dbErrorHandler.js"
import sgMail from "@sendgrid/mail"
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const preSignup = async (req, res) => {
    try {
        const { name, email, username, password } = req.body;
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) { return res.status(400).json({ error: 'Email is taken' }); }
        const token = jwt.sign({ name, username, email, password }, process.env.JWT_ACCOUNT_ACTIVATION, { expiresIn: '10m' });

        const emailData = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Account activation link',
            html: `
            <p>Please use the following link to activate your account:</p>
            <p>${process.env.MAIN_URL}/auth/account/activate/${token}</p>
            <hr />
            `
        };
        await sgMail.send(emailData);
        res.json({ message: `Email has been sent to ${email}. Follow the instructions to activate your account.` });
    } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
};



/*
export const signup = async (req, res) => {
    try {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
            return res.status(400).json({
                error: 'Email is taken'
            });
        }

        const usernameExists = await User.findOne({ username: req.body.username });
        if (usernameExists) {
            return res.status(400).json({
                error: 'Username is taken'
            });
        }

        const { name, username, email, password } = req.body;

        let usernameurl = username.toLowerCase();
        let profile = `${process.env.CLIENT_URL}/profile/${usernameurl}`;

        const newUser = new User({ name, username, email, password, profile });
        await newUser.save();

        res.json({
            message: 'Signup success! Please signin.'
        });
    } catch (err) {
        return res.status(400).json({
            error: err.message
        });
    }
};
*/

export const signup = async (req, res) => {
    const token = req.body.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION);

            if (decoded) {
                const { name, username, email, password } = jwt.decode(token);
                const usernameurl = username.toLowerCase();
                const profile = `${process.env.MAIN_URL}/profile/${usernameurl}`;
                const user = new User({ name, email, password, profile, username });
                await user.save();
                res.json({ message: 'Signup success! Please sign in' });
            }
            else { res.status(401).json({ error: 'Expired link. Signup again' }); }

        } catch (err) { res.status(401).json({ error: 'Expired link. Signup again' }); }
    } else { res.json({ message: 'Something went wrong. Try again' }); }
};



export const signin = async (req, res) => {
    const { password } = req.body;
    try {
        const user = await User.findOne({ email: req.body.email }).exec();

        if (!user) { return res.status(400).json({ error: 'User with that email does not exist. Please sign up.' }); }
        if (!user.authenticate(password)) { return res.status(400).json({ error: 'Email and password do not match.' }); }
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '100d' });
        res.cookie('token', token, { expiresIn: '1d' });
        const { _id, username, name, email, role } = user;
        res.json({ token, user: { _id, username, name, email, role } });
    } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
};




export const signout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Signout success' });
};


export const requireSignin = expressjwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
    userProperty: "auth",
});



export const authMiddleware = async (req, res, next) => {
    try {
        const authUserId = req.auth._id;
        const user = await User.findById({ _id: authUserId }).exec();

        if (!user) { return res.status(400).json({ error: 'User not found' }); }
        req.profile = user;
        next();
    } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
};



export const adminMiddleware = async (req, res, next) => {
    try {
        const adminUserId = req.auth._id;
        const user = await User.findById({ _id: adminUserId }).exec();
        if (!user) { return res.status(400).json({ error: 'User not found' }); }
        if (user.role !== 1) { return res.status(400).json({ error: 'Admin resource. Access denied' }); }
        req.profile = user;
        next();
    } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
};



export const canUpdateDeleteBlog = async (req, res, next) => {
    try {
        const slug = req.params.slug.toLowerCase();
        const data = await Blog.findOne({ slug }).exec();

        if (!data) { return res.status(400).json({ error: errorHandler(err) }); }
        const authorizedUser = data.postedBy._id.toString() === req.profile._id.toString();

        if (!authorizedUser) { return res.status(400).json({ error: 'You are not authorized' }); }
        next();
    } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
};



export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) { return res.status(400).json({ error: 'User with that email does not exist' }); }
        const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, { expiresIn: '10m' });
        const emailData = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Password reset link',
            html: `
            <p>Please use the following link to reset your password:</p>
            <p>${process.env.MAIN_URL}/auth/password/reset/${token}</p>
            <hr />
            <p>This email may contain sensitive information</p>
            <p>${process.env.MAIN_URL}</p>
            `
        };
        await user.updateOne({ resetPasswordLink: token });
        await sgMail.send(emailData);
        res.json({ message: `Email has been sent to ${email}. Follow the instructions to reset your password. Link expires in 10 minutes.` });
    } catch (err) { res.json({ error: errorHandler(err) }); }
};



export const resetPassword = async (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;
    if (resetPasswordLink) {
        try {
            const decoded = jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD);
            if (decoded) {
                const user = await User.findOne({ resetPasswordLink });

                if (!user) { return res.status(401).json({ error: 'Something went wrong. Try later' }); }
                const updatedFields = { password: newPassword, resetPasswordLink: '' };
                user.set(updatedFields);
                await user.save();

                res.json({ message: 'Great! Now you can login with your new password' });
            } else { return res.status(401).json({ error: 'Expired link. Try again' }); }
        } catch (err) { res.status(400).json({ error: errorHandler(err) }); }
    }
};


/*
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = (req, res) => {
    const idToken = req.body.tokenId;
    client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID }).then(response => {
        const { email_verified, name, email, jti } = response.payload;
        if (email_verified) {
            User.findOne({ email }).exec((err, user) => {
                if (user) {
                    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
                    res.cookie('token', token, { expiresIn: '1d' });
                    const { _id, email, name, role, username } = user;
                    return res.json({ token, user: { _id, email, name, role, username } });
                } else {
                    // let username = shortId.generate();
                    // let profile = `${process.env.CLIENT_URL}/profile/${username}`;
                    let password = jti;
                    user = new User({ name, email, profile, username, password });
                    user.save((err, data) => {
                        if (err) {
                            return res.status(400).json({
                                error: errorHandler(err)
                            });
                        }
                        const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
                        res.cookie('token', token, { expiresIn: '1d' });
                        const { _id, email, name, role, username } = data;
                        return res.json({ token, user: { _id, email, name, role, username } });
                    });
                }
            });
        } else {
            return res.status(400).json({
                error: 'Google login failed. Try again.'
            });
        }
    });
};
*/