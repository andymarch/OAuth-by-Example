const OktaJwtVerifier = require('@okta/jwt-verifier');
var atob = require('atob');

const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: process.env.OKTA_OAUTH2_ISSUER,
    clientId: process.env.OKTA_OAUTH2_CLIENT_ID,
    });

class Auth {
    ensureAuthenticated(){
        return async (req, res, next) => {
            if(req.userContext != null){
                oktaJwtVerifier.verifyAccessToken(req.userContext.tokens.access_token,process.env.OKTA_OAUTH2_AUDIENCE)
                .then(jwt => {
                    return next();
                })
                .catch(err => {
                    console.log(err)
                    res.redirect("/")
                });      
            }
            else{
                console.log("no context")
                res.redirect("/")
            }
        }
    }

    setContext(req,res,next){
        if(req.userContext == undefined){
            req.userContext = {
                userinfo: {
                    sub : "",
                    family_name : "",
                    givenName: "",
                },
                tokens: {
                    access_token: "",
                    id_token: ""
                }
            }
        }
        if(req.session.user){
            if(req.session.user.id_token){
                var token = () =>{decodeToken(req.session.user.id_token)}
                req.userContext = {
                    'userinfo': {
                        'sub' : token.sub,
                        'family_name' : token.name,
                        'givenName': token.name,
                        'preferred_username': token.preferred_username
                    },
                    'tokens': {
                        'access_token': req.session.user.access_token,
                        'id_token': req.session.user.id_token,
                        'refresh_token':req.session.user.refresh_token
                    }
                }
            }
            else {
                req.userContext = {
                    'tokens': {
                        'access_token': req.session.user.access_token,
                    }
                }
            }
        }
        if(req.session.server){
            req.serverContext = {
                'tokens' :{
                    'access_token': req.session.server.access_token
                }
            }
        }
        return next();
    }

    getAddressableHost(req){
        let protocol = "http"
        if(req.secure){
            protocol = "https"
        }
        else if(req.get('x-forwarded-proto')){
            protocol = req.get('x-forwarded-proto').split(",")[0]
        }
        return protocol+"://"+req.headers.host
    }

    getAccessToken(req){
        if(req.session.user){
            return req.userContext.tokens.access_token
        }
        else if(req.session.server){
            return req.serverContext.tokens.access_token
        }
    }

    decodeToken(token){
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace('-', '+').replace('_', '/');
        return JSON.parse(atob(base64))
    }
}

module.exports = Auth