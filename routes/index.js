const express = require('express');
const router = express.Router();
const axios = require('axios');

module.exports = function (_auth){
    var auth = _auth;

    router.get('/', (req, res) => {
        res.render('index');
    });

    router.get("/user-token", auth.ensureAuthenticated(), (req,res) => {
        res.render('usertoken',
        { 
            accessToken: req.userContext.tokens.access_token,
            idToken: req.userContext.tokens.id_token,
            refreshToken: req.userContext.tokens.refresh_token
        })
    })

    router.get("/service-token", (req,res) => {
        res.render('servicetoken',
        { 
            accessToken: req.serverContext.tokens.access_token,
        })
    })

    return router;
}
