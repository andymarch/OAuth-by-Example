const express = require('express')
const router = express.Router()
const axios = require('axios')
const uuidv1 = require('uuid/v1')
const qs = require('querystring')
var base64 = require('base-64')

module.exports = function (_auth){
    var auth = _auth;

    router.get('/', (req, res) => {
        res.render('ac-explainer',
        {
            authorize_url:process.env.OKTA_OAUTH2_ISSUER + '/v1/authorize',
            client_id_web: process.env.OKTA_OAUTH2_CLIENT_ID_WEB,
            redirect_uri: auth.getAddressableHost(req) +'/authorization-code/callback',
            response_type: 'code',
            scope: 'demonstration:perform openid profile offline_access',
            state: uuidv1()
        });
    });

    router.post('/login', (req,res) => {
        req.session.state = req.body.state
        res.redirect(process.env.OKTA_OAUTH2_ISSUER + 
            '/v1/authorize?' +
            'client_id=' + req.body.client_id +
            '&response_type=code' +
            '&redirect_uri='+ auth.getAddressableHost(req) +'/authorization-code/callback' + 
            '&scope='+ req.body.scope +
            '&state=' + req.session.state)
    })

    router.get("/callback", (req,res) => {
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
                    res.render('ac-callback',{
                        state:req.query.state,
                        code: req.query.code,
                        sent_state: req.session.state,
                        redirect_uri: auth.getAddressableHost(req) +'/authorization-code/callback',
                        client_id: process.env.OKTA_OAUTH2_CLIENT_ID_WEB
                    })
            }
        }
        else{
            res.redirect("/error",{err: "State mismatch"})
        }
    })

    router.post("/callback", async (req,res)=>{
        try{
            var tokenresponse = await axios.post(process.env.OKTA_OAUTH2_ISSUER + '/v1/token',
            qs.stringify({
                "code":req.body.code,
                "grant_type": "authorization_code",
                "redirect_uri": auth.getAddressableHost(req)+"/authorization-code/callback",
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
            res.redirect("/authorization-code/token")
        }
        catch(err){
            console.log(err)
            if(err.response.data.error_description){
                res.status(err.status || 500);
                res.render('error', { title: 'Error',message: err.response.data.error_description });
            }
            else{
                console.log(err)
                // set locals, only providing error in development
                res.locals.message = err.message;
                res.locals.error = req.app.get('env') === 'development' ? err : {};

                // render the error page
                res.status(err.status || 500);
                res.render('error', { title: 'Error' });
            }
        } 
    })

    router.get('/refresh', auth.ensureAuthenticated(), (req,res) => {
        res.render('ac-refresh',{
            refresh_token:req.userContext.tokens.refresh_token,
            scope:'openid profile demonstration:perform offline_access',
            client_id: process.env.OKTA_OAUTH2_CLIENT_ID_WEB,
            issuer: process.env.OKTA_OAUTH2_ISSUER
        })
    })

    router.post('/refresh', auth.ensureAuthenticated(), async (req,res) => {
        try{
        var tokenresponse = await axios.post(process.env.OKTA_OAUTH2_ISSUER + '/v1/token',
        qs.stringify({
            "grant_type": "refresh_token",
            "scope": "openid profile demonstration:perform offline_access",
            "refresh_token": req.session.user.refresh_token
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
        res.redirect("/authorization-code/token")
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

    router.get("/token", auth.ensureAuthenticated(), (req,res) => {
        res.render('usertoken',
        { 
            accessToken: req.userContext.tokens.access_token,
            idToken: req.userContext.tokens.id_token,
            refreshToken: req.userContext.tokens.refresh_token
        })
    })

    return router;
}
