var client = require('./marketo');

/**
 * Returns a marketo API wrapper object of the specified version.
 *
 * Required options are:
 *  - api_key or oauth_token -  An authenticated users oAuth Token.
 * Available options are:
 *  - userAgent   a user agent you would like used in place of the default
 *  - version     The API version to use (v3). Defaults to v3.
 *
 * @return Instance of the marketo API in the specified version
 */

function marketoAPI (options) {
  if (!options) {
    throw new Error('All versions of the API require authentication. Please review https://github.com/Datahero/node-marketo/blob/master/README.md');
  } else {
    return new client(options);
  }
}

module.exports = marketoAPI;
