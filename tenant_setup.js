require('dotenv').config()
const axios = require('axios');
axios.defaults.headers.common['Authorization'] = `SSWS  `+process.env.OKTA_CLIENT_TOKEN

configureScope()

async function configureScope(){
    try {
        var serverList = await axios.get(
            process.env.OKTA_CLIENT_ORGURL + '/api/v1/authorizationServers')
        
        //this is only true for new tenants
        var authzId = serverList.data[0].id

        await axios.post(
        process.env.OKTA_CLIENT_ORGURL+ '/api/v1/authorizationServers/'+authzId+'/scopes',
        {
            "description": "Allows the execution of a demonstration.",
            "name": "demonstration:perform",
        })
    }
    catch(error){
        console.log(error)
    }
}