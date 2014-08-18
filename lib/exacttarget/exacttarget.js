// external deps
var soap = require('soap'),
  async = require('async');

// local libs
var helpers = require('./helpers');

var WSDLS = {
  s0: "TODO"
};

var URLS = [];
Object.keys(WSDLS).forEach(function (WSDL) {
  URLS.push(WSDLS[WSDL]);
});


function Marketo(opts) {
  this.version = "1.0.0";
  this.DEBUG = opts.DEBUG || false;
  // TODO: Possibly iterate over WSDL urls to find the right one.
  // Likely that not everyone will be on this endpoint.
  this.WSDL = opts.WSDL || WSDLS.s7;

  if (opts.token || opts.fueloauth) {
    this.token = opts.token || opts.fueloauth;
  } else {

    if (!opts.username) {
      throw new Error('Missing Username');
    }

    if (!opts.password) {
      throw new Error("Missing Password");
    }

    this.username = opts.username;
    this.password = opts.password;
  }

}

module.exports = Marketo;

Marketo.prototype.last = function (callback) {
  return callback(null, this.client.lastRequest);
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

    // Add Authentication - oauth if available, then username/pw
    if (self.token) {
      client.addSoapHeader({fueloauth: self.token,xmlns: "http://marketo.com"});
    } else {
      client.setSecurity(new soap.WSSecurity(self.username, self.password));
    }

    // Make a Call to confirm the user is logged in.
    client.GetSystemStatus({}, function (err, res) {
      if (err) {
        return callback(err, null);
      }
      if (!res.status === "OK") {
        return callback(res, null)
      }

      if (self.DEBUG) {
        console.log("describe", client.describe());
        var describe = client.describe().PartnerAPI.Soap;
        Object.keys(describe).forEach(function (method) {
          var pattern = describe[method];
          console.log("----- START", method, " - input/output parameters:");
          console.log(pattern);
          console.log("----- END:", method);
        });
      }

      self.isInit = true;
      self.client = client;
      return callback(null , {res: res, WSDL: self.WSDL});
    });
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