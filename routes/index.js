const express = require('express');
const router = express.Router();
const axios = require('axios');

module.exports = function (_auth){
    var auth = _auth;

    router.get('/', (req, res) => {
        if(req.session.user){
            res.render('index',{hasIdentity:true})
        }
        else{
            res.render('index');
        }
    });

    router.get("/service-token", (req,res) => {
        res.render('servicetoken',
        { 
            accessToken: req.serverContext.tokens.access_token,
        })
    })

    router.get("/logout", (req, res) => {
        if(req.userContext){
            const tokenSet = req.userContext.tokens;
            const id_token_hint = tokenSet.id_token
            req.session.destroy();
            if(id_token_hint){
            res.redirect(process.env.OKTA_OAUTH2_ISSUER+'/v1/logout?id_token_hint='
                + id_token_hint
                + '&post_logout_redirect_uri='
                + encodeURI(auth.getAddressableHost(req))
                );
            }
            else{
            res.redirect("/")
            }
        }
        else {
            res.redirect("/")
        }
    })

    return router;
}
