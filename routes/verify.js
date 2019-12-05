const express = require('express');
const router = express.Router();
const OktaJwtVerifier = require('@okta/jwt-verifier');
const { PerformanceObserver, performance } = require('perf_hooks');

module.exports = function (_auth){
    var auth = _auth;

    const oktaJwtVerifier = new OktaJwtVerifier({
        issuer: process.env.OKTA_OAUTH2_ISSUER,
        clientId: process.env.OKTA_OAUTH2_CLIENT_ID,
        });

    router.get('/',(req, res) => {
        var token = auth.decodeToken(auth.getAccessToken(req))
        res.render('verify-explainer', {
            issuer: process.env.OKTA_OAUTH2_ISSUER,
            audience: process.env.OKTA_OAUTH2_AUDIENCE,
            expiry: new Date(token.exp*1000).toISOString(),
            iat: new Date(token.iat*1000).toISOString(),
            current_time: new Date().toISOString()
        })
    });

    router.get('/submit',(req,res) =>{
        var t0 = performance.now();      
        oktaJwtVerifier.verifyAccessToken(
            auth.getAccessToken(req),
            process.env.OKTA_OAUTH2_AUDIENCE)                
            .then(jwt => {
                var t1 = performance.now();
                req.session.performance = t1 - t0             
                res.redirect("/verify/success?")
            })
            .catch(err => {
                console.log(err)
                res.redirect("/verify/failed")
            })
    })

    router.get('/success',(req,res)=>{
        var perf = req.session.performance
        req.session.performance = null
        res.render('verify-result',{success:true,performance: perf})
    })

    router.get('/failed',(req,res)=>{
        res.render('verify-result')
    })

    return router;
}
