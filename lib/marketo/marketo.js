// external deps
var soap = require('soap');

// local libs
var helpers = require('./helpers');
var MarketoSecurity = require('./security');

function Marketo(opts) {
  this.DEBUG = opts.DEBUG === true;

  if (!opts.wsdl) throw new Error('Missing WSDL');
  helpers.requireURL(opts.wsdl)
  this.WSDL = helpers.wsdlFix(opts.wsdl);

  if (!opts.user_id) throw new Error('Missing user_id');
  this.user_id = opts.user_id;

  if (!opts.key) throw new Error("Missing key");
  this.key = opts.key;
}

module.exports = Marketo;

Marketo.prototype.soap = function () {
  if (!this.client) {
    return false;
  } else {
    return this.client;
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

  soap.createClient(this.WSDL, function (err, client) {
    if (err) {
      return callback(err);
    }

    // Make a Call to confirm the user is logged in.
    if (self.DEBUG) {
      console.log("describe", client.describe());
    }

    client.setSecurity(new MarketoSecurity(self.user_id, self.key));
    // make a REAL call to confirm the user_id and key are valid.
    client.describeMObject({objectName: "ActivityRecord"}, function (err, res) {
      if (err) {
        return helpers.handleError(err, callback);
      }
      self.isInit = true;
      self.client = client;
      return callback(null, {WSDL: self.WSDL, client: self.client});
    });
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
      if (self.DEBUG) {
        console.log("res", res);
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

Marketo.prototype.getMultipleOpportunities = function (options, callback) {
  if (!options) {
    options = {};
  }

  this.execute(function (err, res) {
    if (err) {
      return helpers.handleError(err, callback);
    }
    res.client.getMObjects(options, function(err, res, body){
      if (err) {
        return helpers.handleError(err, callback);
      }
      return callback(null, res.result);
    });
  });

};

Marketo.prototype.getMultipleLeads = function (options, callback) {

  var self = this;
  if (!options.batchSize) {
    options.batchSize = 1000;
  }
  if (!options.streamPosition) {
    options.streamPosition = "id:1:ts:1:os:0:rc:1";
  }

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
  if (!options) {
    options = {};
  }

  if (!options.batchSize) {
    options.batchSize = 1000;
  }

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