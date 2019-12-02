# OAuth and OIDC by Example

This repository supports the "OAuth and OIDC by Example" workshop to guide you
through the setup and deployment of Okta as an OAuth identity provider to your
applications.

This example uses a simple Node.js server to demonstrate the different flows
available to you however the principals apply to any platform. This sample uses
direct calls to the identity provider to demonstrate each stage, However it is
recommended that you use a prebuild implementation standard to integrate your
production applications. Certified implementations can be found
[here](https://openid.net/developers/certified/).

## Get Started

This workshop uses a simple node application deployed to Heroku to guide you.
To provision you an instance of Okta to use with the example we are using the
[Beta Okta Heroku add on](https://devcenter.heroku.com/articles/okta).


[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)