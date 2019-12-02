const OktaJwtVerifier = require('@okta/jwt-verifier');

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
                    res.redirect("/login")
                });      
            }
            else{
                console.log("no context")
                res.redirect("/login")
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
            var atob = require('atob');
              var base64Url = req.session.user.id_token.split('.')[1];
              var base64 = base64Url.replace('-', '+').replace('_', '/');
              var token = JSON.parse(atob(base64))
            req.userContext = {
                'userinfo': {
                    'sub' : token.sub,
                    'family_name' : token.name,
                    'givenName': token.name,
                    'preferred_username': token.preferred_username
                },
                'tokens': {
                    'access_token': req.session.user.access_token,
                    'id_token': req.session.user.id_token
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
}

module.exports = Auth