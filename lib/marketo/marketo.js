// external deps
var soap = require('soap');

// local libs
var helpers = require('./helpers');
var MarketoSecurity = require('./security');

function Marketo(opts) {
  this.DEBUG = opts.DEBUG || false;

  this.WSDL = opts.wsdl;
  if (!this.WSDL) throw new Error('Missing WSDL');

  this.user_id = opts.user_id;
  if (!this.user_id) throw new Error('Missing user_id');

  this.key = opts.key;
  if (!this.key) throw new Error("Missing key");
}

module.exports = Marketo;

Marketo.prototype.soap = function (callback) {
  if (!this.client) {
    return callback("No Client, please #login", null);
  } else {
    return callback(null, this.client);
  }
};

Marketo.prototype.last = function () {
  if (!this.client) {
    return "No Client, please #login";
  } else {
    return this.client.lastRequest;
  }
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

    client.setSecurity(new MarketoSecurity(self.user_id, self.key));

    self.isInit = true;
    self.client = client;
    return callback(null, {WSDL: self.WSDL, client: self.client});
  });
};

Marketo.prototype.execute = function (callback) {
  if (this.isInit && this.client) {
    return callback(null, {client: this.client});
  } else {
    this.login({}, callback);
  }
};

Marketo.prototype.describe = function (options, callback) {
  var self = this;

  this.execute(function (err, res) {
    if (err) {
      return callback(err);
    }

    res.client.describeMObject(options, function (err, res, body) {
      /**
       * would like to write:
       * res.client.describeMObject(options, callback)
       * but the res and body are returned in an array?
       **/
      if (err) {
        return callback(err, null);
      }
      return callback(null, res.result);
    });
  });
};

Marketo.prototype.describeActivityRecord = function (opts, callback) {
  return this.describe({objectName: "ActivityRecord"}, callback);
};
Marketo.prototype.describeLeadRecord = function (opts, callback) {
  return this.describe({objectName: "LeadRecord"}, callback);
};
Marketo.prototype.describeOpportunity = function (opts, callback) {
  return this.describe({objectName: "Opportunity"}, callback);
};
Marketo.prototype.describeOpportunityPersonRole = function (opts, callback) {
  return this.describe({objectName: "OpportunityPersonRole"}, callback);
};

Marketo.prototype.getMultipleLeads = function (options, callback) {
  var self = this;

  this.execute(function (err, res) {
    if (err) {
      return callback(err);
    }
    res.client.getMultipleLeads(options, function (err, res, body) {
      if (err) {
        return callback(err);
      }
      return callback(null, res.result);
    });
  });
};

/**
 * getLeadChanges - http://developers.marketo.com/documentation/soap/getleadchanges/
 *
 * This API is just like getLeadActivity except that it operates on multiple leads at once.
 * The operation checks for new leads created, lead field updates and other activities.
 *
 * @param options
 * @param callback
 */
Marketo.prototype.getLeadChanges = function (options, callback) {
  var self = this;

  this.execute(function (err, res) {
    if (err) {
      return callback(err);
    }
    res.client.getLeadChanges(options, function (err, res, body) {
      if (err) {
        return callback(err);
      }
      return callback(null, res.result);
    });
  });
};
// Alias because getLeadChanges is a stupid object name.
Marketo.prototype.getMultipleActivities = Marketo.prototype.getLeadChanges;