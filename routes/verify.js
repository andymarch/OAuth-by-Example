const express = require('express');
const router = express.Router();
const OktaJwtVerifier = require('@okta/jwt-verifier');

module.exports = function (_auth){
    var auth = _auth;

    const oktaJwtVerifier = new OktaJwtVerifier({
        issuer: process.env.OKTA_OAUTH2_ISSUER,
        clientId: process.env.OKTA_OAUTH2_CLIENT_ID,
        });

    router.get('/',(req, res) => {
        res.render('verify-explainer', {
            issuer: process.env.OKTA_OAUTH2_ISSUER,
            audience: process.env.OKTA_OAUTH2_AUDIENCE,
            expiry: new Date(auth.decodeToken(auth.getAccessToken(req)).exp*1000).toISOString()
        })
    });

    router.get('/submit',(req,res) =>{
        oktaJwtVerifier.verifyAccessToken(
            req.userContext.tokens.access_token,
            process.env.OKTA_OAUTH2_AUDIENCE)                
            .then(jwt => {
                res.redirect("/verify/success")
            })
            .catch(err => {
                console.log(err)
                res.redirect("/verify/failed")
            })
    })

    router.get('/success',(req,res)=>{
        res.render('verify-result',{success:true})
    })

    router.get('/failed',(req,res)=>{
        res.render('verify-result')
    })

    return router;
}
