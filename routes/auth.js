const express = require('express');
const router = express.Router();
const axios = require('axios');
const uuidv1 = require('uuid/v1');
const qs = require('querystring')
var base64 = require('base-64');

module.exports = function (_auth){
    auth = _auth;

    router.get('/authorization-code/login', (req,res) =>{
        req.session.state = uuidv1();
        res.redirect(process.env.OKTA_OAUTH2_ISSUER + 
            '/v1/authorize?' +
            'client_id=' + process.env.OKTA_OAUTH2_CLIENT_ID_WEB +
            '&response_type=code' +
            '&redirect_uri='+ getAddressableHost(req) +'/authorization-code/callback' + 
            '&scope= openid profile' + 
            '&state=' + req.session.state)
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
                + encodeURI(getAddressableHost(req))
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

    router.get("/authorization-code/callback", (req,res) => {
        if(req.query.state === req.session.state)
        {
            if(req.query.error){
                if(req.query.error_description){
                    res.render('error', {message: unescape(req.query.error_description)})
                } else {
                    res.render('error', {message: req.query.error})
                }
            }
            else {
                    res.render('callback',{state:req.query.state, code: req.query.code})
            }
        }
        else{
            res.redirect("/error",{err: "State mismatch"})
        }
    })

    router.post("/authorization-code/callback", async (req,res)=>{
        try{
            var tokenresponse = await axios.post(process.env.OKTA_OAUTH2_ISSUER + '/v1/token',
            qs.stringify({
                "code":req.body.code,
                "grant_type": "authorization_code",
                "redirect_uri": getAddressableHost(req)+"/authorization-code/callback",
            }),
            {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'authorization': "Basic "+base64.encode(process.env.OKTA_OAUTH2_CLIENT_ID_WEB+":"+process.env.OKTA_OAUTH2_CLIENT_SECRET_WEB)
            }
            }
            )
            if(tokenresponse.data.refresh_token){
                req.session.user =
                {
                    'id_token': tokenresponse.data.id_token,
                    'access_token': tokenresponse.data.access_token,
                    'refresh_token': tokenresponse.data.refresh_token
                }
            }
            else{
                req.session.user =
                {
                    'id_token': tokenresponse.data.id_token,
                    'access_token': tokenresponse.data.access_token
                }
            }
            res.redirect("/user-token")
        }
        catch(err){
            console.log(err)
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};

            // render the error page
            res.status(err.status || 500);
            res.render('error', { title: 'Error' });
        } 
    })

    router.get("/client-credentials/login", async (req,res) => {
        try{
            var response = await axios.post(process.env.OKTA_OAUTH2_ISSUER + '/v1/token',
                qs.stringify({
                    "grant_type": "client_credentials",
                    "redirect_uri": getAddressableHost(req)+"/authorization-code/callback",
                    "scope": "demonstration:perform"
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'authorization': "Basic " + base64.encode(
                            process.env.OKTA_OAUTH2_CLIENT_ID_WEB 
                            + ":" +
                            process.env.OKTA_OAUTH2_CLIENT_SECRET_WEB
                        )
                    }
                }
            )
            req.session.server =
            {
                'access_token': response.data.access_token
            }
            res.redirect("/service-token")
        }
        catch(err){
            console.log(err)
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};

            // render the error page
            res.status(err.status || 500);
            res.render('error', { title: 'Error' });
        } 
    })

    function getAddressableHost(req){
        let protocol = "http"
        if(req.secure){
            protocol = "https"
        }
        else if(req.get('x-forwarded-proto')){
            protocol = req.get('x-forwarded-proto').split(",")[0]
        }
        return protocol+"://"+req.headers.host
    }

  return router;
}
