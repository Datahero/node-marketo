// external deps
var crypto = require('crypto'),
  soap = require('soap'),
  async = require('async');

// local libs
var helpers = require('./helpers');

function Marketo(opts) {
  this.version = "1.0.0";
  this.WSDL = "themarketoWSDL";
  this.DEBUG = opts.DEBUG || false;


  if (!opts.accessID) {
    throw new Error('Missing accessID');
  } else {
    this.accessID = opts.accessID;
  }

  if (!opts.secretKey) {
    throw new Error("Missing secretKey");
  } else {
    this.secretKey = opts.secretKey;
  }
}

module.exports = Marketo;

Marketo.prototype.last = function (callback) {
  return callback(null, this.client.lastRequest);
};

function getSecurity(access, secret) {
  var timestamp = _getTimeStamp();
  signature = crypto
    .createHmac('sha1', secret)
    .update(timestamp + access)
    .digest('hex');
  return "<tns:AuthenticationHeader>\n    <mktowsUserId>" + access + "</mktowsUserId>\n    <requestSignature>" + signature + "</requestSignature>\n    <requestTimestamp>" + timestamp + "</requestTimestamp>\n</tns:AuthenticationHeader>";
}

function _getTimeStamp() {
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

Marketo.prototype.login = function (opts, callback) {
  var self = this;

  if (self.isInit && self.client) {
    return callback(null, {client: self.client});
  }

  soap.createClient(this.WSDL, function (err, client) {
    if (err) {
      return callback(err, null);
    }

    // Add Authentication - oauth if available, then username/pw
    client.setSecurity(getSecurity(this.accessID, this.secretKey));

    // Make a Call to confirm the user is logged in.
    if (self.DEBUG) {
      console.log("describe", client.describe());
    }

    self.isInit = true;
    self.client = client;
    return callback(null, {res: res, WSDL: self.WSDL});
  });
};

Marketo.prototype.retrieve = function (options, callback) {
  var self = this;

  this.client.Retrieve(options, function (err, data) {
    if (err) {
      return callback(err);
    } else {
      if (self.DEBUG) {
        console.log("response", data);
      }

      return callback(null, data);
    }
  });
};

Marketo.prototype.subscribers = function (opts, callback) {
  this.retrieve({
    RetrieveRequest: {
      ObjectType: "Subscriber",
      "Properties": [
        "CreatedDate",
        "EmailAddress",
        "EmailTypePreference",
        "ID",
        "PartnerKey",
        "Status",
        "SubscriberKey",
        "UnsubscribedDate"
      ]
    }
  }, callback);
};