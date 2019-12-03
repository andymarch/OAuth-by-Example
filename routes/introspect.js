const express = require('express')
const router = express.Router()
const axios = require('axios')
var base64 = require('base-64')
const qs = require('querystring')

module.exports = function (_auth){
    var auth = _auth;

    router.get('/',(req, res) => {
        res.render('introspect-explainer', {
            issuer: process.env.OKTA_OAUTH2_ISSUER,
            access_token: auth.getAccessToken(req),
            client_id: process.env.OKTA_OAUTH2_CLIENT_ID_WEB
        })
    });

    router.get('/submit', (req,res) => {
        axios.post(process.env.OKTA_OAUTH2_ISSUER + '/v1/introspect',
            qs.stringify({
                            token_type_hint: 'access_token',
                            token: auth.getAccessToken(req)
                        }),
                        {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'authorization': "Basic "+base64.encode(process.env.OKTA_OAUTH2_CLIENT_ID_WEB+":"+process.env.OKTA_OAUTH2_CLIENT_SECRET_WEB)
                        }
        })     
        .then(response => {
            req.session.introspect = response.data
            res.redirect("/introspect/success")
        })
        .catch(err => {
            req.session.introspect = err
            res.redirect("/introspect/failed")
        })
    })

    router.get('/success',(req,res)=>{
        var response = req.session.introspect
        console.log(response)
        req.session.introspect = null
        res.render('introspect-result',{success:true, response: response})
    })

    router.get('/failed',(req,res)=>{
        res.render('introspect-result')
    })

    return router;
}
