const express = require('express');
const router = express.Router();
const axios = require('axios');

module.exports = function (_auth){
    var auth = _auth;

    router.get('/', (req, res) => {
        if(req.session.user){
            var token = auth.decodeToken(req.userContext.tokens.access_token)
            if(req.userContext.tokens.refresh_token){
                res.render('index',{hasIdentity:true, hasRefreshToken: true, sub: token.sub, exp:new Date(token.exp*1000).toISOString()})
            }
            else {
                res.render('index',{hasIdentity:true, sub: token.sub, exp:new Date(token.exp*1000).toISOString()})
            }
        }
        else if(req.session.server){
            var token = auth.decodeToken(req.serverContext.tokens.access_token)
            res.render('index',{hasIdentity:true,sub: token.sub,exp:new Date(token.exp*1000).toISOString()})
        }
        else{
            res.render('index')
        }
    });


    router.get("/logout", (req, res) => {
        if(req.session){
            req.session.destroy();
            res.redirect("/")
        }
        else {
            res.redirect("/")
        }
    })

    return router;
}
