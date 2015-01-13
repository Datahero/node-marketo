var crypto = require('crypto');

/**
 * MarketoSecurity is a security module for node-soap.
 *
 * Marketo SOAP uses HMAC-SHA1 signatures require the following:
 *  - A User ID (also called Access Key) that is transmitted with the service request
 *  - A Signature that is calculated using a shared secret-key and message content and is transmitted with the service request
 *  - A shared secret-key (also called Encryption Key) that is not transmitted with the service request
 * @param user_id
 * @param key
 * @constructor
 */
function MarketoSecurity(user_id, key) {
  this.user_id = user_id;
  this.key = key;

  if (!this.key) throw new Error("missing key");
  if (!this.user_id) throw new Error("missing user_id");
}

/**
 * toXML
 *
 * node-soap security objects must implement a #toXML function that is inserted into the header of each request.
 * @returns {string}
 */

MarketoSecurity.prototype.toXML = function () {
  var timestamp = (new Date()).toISOString();

  var signature = crypto.createHmac('sha1', this.key)
    .update(timestamp + this.user_id).digest('hex');

  return [
    "<AuthenticationHeader>",
      "<mktowsUserId>" + this.user_id + "</mktowsUserId>",
      "<requestSignature>" + signature + "</requestSignature>",
      "<requestTimestamp>" + timestamp + "</requestTimestamp>",
    "</AuthenticationHeader>"
  ].join('');
};

module.exports = MarketoSecurity;
