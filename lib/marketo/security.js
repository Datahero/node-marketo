var crypto = require('crypto');

function MarketoSecurity(user_id, key) {
  this.user_id = user_id;
  this.key = key;

  if (!this.key) throw new Error("missing key");
  if (!this.user_id) throw new Error("missing user_id");
}

MarketoSecurity.prototype.toXML = function () {
  var currentW3CTimeStamp = function () {
    var d = new Date(),
      year = d.getFullYear(),
      month = d.getMonth() + 1,
      day = d.getDate(),
      timeString = d.toTimeString(),
      time = timeString.slice(0, 8),
      offset = timeString.slice(12, 15);
    if (month < 10) month = "0" + month;
    if (day < 10) day = "0" + day;
    return [year, '-', month, '-', day, "T", time, offset, ":00"].join("");
  }

  var timestamp = currentW3CTimeStamp();
  var signature = crypto
    .createHmac('sha1', this.key)
    .update(timestamp + this.user_id)
    .digest('hex');
  return [
    "<ns1:AuthenticationHeader>",
      "<mktowsUserId>" + this.user_id + "</mktowsUserId>",
      "<requestSignature>" + signature + "</requestSignature>",
      "<requestTimestamp>" + timestamp + "</requestTimestamp>",
    "</ns1:AuthenticationHeader>"
  ].join('');
};

module.exports = MarketoSecurity;