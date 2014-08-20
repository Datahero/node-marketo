// external deps
var soap = require('soap');

// local libs
var helpers = require('./helpers');

function Marketo(opts) {
  this.version = "2_4";
  this.WSDL = "http://app.marketo.com/soap/mktows/2_4?WSDL";
  this.DEBUG = (opts.DEBUG || false);

  if (!opts.user_id) {
    throw new Error('Missing user_id');
  } else {
    this.user_id = opts.user_id;
  }

  if (!opts.key) {
    throw new Error("Missing key");
  } else {
    this.key = opts.key;
  }
}

module.exports = Marketo;

Marketo.prototype.soapClient = function(callback){
  if (!this.client) {
    return callback("No Client, please #login", null);
  } else {
    return callback(null, this.client);
  }
};

Marketo.prototype.setClientSecurity = function () {
  this.client.addSoapHeader(helpers.marketoSecurity(this.user_id, this.key));
};

Marketo.prototype.login = function (opts, callback) {
  var self = this;

  if (self.isInit && self.client) {
    return callback(null, {client: self.client});
  }

  soap.createClient(this.WSDL, function (err, client) {
    if (err) {
      return callback(err, null);
    }

    // Make a Call to confirm the user is logged in.
    if (self.DEBUG) {
      console.log("describe", client.describe());
    }

    self.isInit = true;
    self.client = client;
    // Add Authentication - oauth if available, then username/pw
    self.setClientSecurity();

    return callback(null, {WSDL: self.WSDL});
  });
};


Marketo.prototype.describe = function (options, callback) {
  var self = this;

  this.client.describeMObject(options, function (err, data) {
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

Marketo.prototype.leadDescription = function (opts, callback) {
  this.describe({ObjectType: "LeadRecord"}, callback);
};