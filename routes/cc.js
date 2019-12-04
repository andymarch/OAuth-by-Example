const express = require('express')
const router = express.Router()
const axios = require('axios')
const qs = require('querystring')
var base64 = require('base-64')

module.exports = function (_auth){
    var auth = _auth;

    router.get('/', (req, res) => {
        res.render('cc-explainer', {
            issuer: process.env.OKTA_OAUTH2_ISSUER,
            client_id: process.env.OKTA_OAUTH2_CLIENT_ID_WEB,
            scope: 'demonstration:perform'
        });
    });

    router.get("/login", async (req,res) => {
        try{
            var response = await axios.post(process.env.OKTA_OAUTH2_ISSUER + '/v1/token',
                qs.stringify({
                    "grant_type": "client_credentials",
                    "redirect_uri": auth.getAddressableHost(req)+"/authorization-code/callback",
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
            res.redirect("/client-credentials/token")
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

    router.get("/token", (req,res) => {
        res.render('servicetoken',
        { 
            accessToken: req.serverContext.tokens.access_token,
        })
    })

    return router;
}
