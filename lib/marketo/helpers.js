/**
 * Recursively encode an object as application/x-www-form-urlencoded.
 *
 * @param value Value to encode
 * @param key Key to encode (not required for top-level objects)
 * @return Encoded object
 */
exports.serialize = function serialize(value, key) {

  var output;

  if (!key && key !== 0)
    key = '';

  if (Array.isArray(value)) {
    output = [];
    value.forEach(function (val, index) {
      if (key !== '') index = key + '[' + index + ']';
      output.push(serialize(val, index));
    }, this);
    return output.join('&');
  } else if (typeof(value) == 'object') {
    output = [];
    for (var name in value) {
      if (value[name] && value.hasOwnProperty(name)) {
        output.push(serialize(value[name], key !== '' ? key + '[' + name + ']' : name));
      }
    }
    return output.join('&');
  } else {
    return key + '=' + encodeURIComponent(value);
  }

};


exports.requireURL = function (questionable_url) {
  if (!new RegExp(/^https:\/\//).test(questionable_url)) {
    throw new Error("requires an https marketo WSDL endpoint");
  }

  if (!new RegExp(/mktoapi\.com\/soap\/mktows/)) {
    throw new Error("url ["+questionable_url+"] must be a marketo endpoint");
  }
};

exports.wsdlFix = function (questionableWSDL) {
  if (new RegExp(/\?WSDL$/).test(questionableWSDL)) {
    return questionableWSDL;
  } else {
    return questionableWSDL + "?WSDL";
  }
};


exports.isAnError = function (statusCode) {
  return parseInt(statusCode / 100, 10) !== 2 ? true : false;
};

/**
 * Creates an Error with information received from marketo. In addition to an
 * error message it also includes an error code.
 * Users of this client should easily be able to map marketo errors to their own actions
 *
 * @param message The node-soap error
 * @param callback
 */
exports.handleError = function handleError(error, callback) {
  // marketo errors look like:
  //  "root": {
  //    "Envelope": {
  //      "Body": {
  //        "Fault": {
  //          "faultcode": "SOAP-ENV:Client",
  //          "faultstring": "20014 - Authentication failed",
  //          "detail": {
  //            "serviceException": {
  //              "name": "mktServiceException",
  //              "message": "Authentication failed (20014)",
  //              "code": "20014"
  //            }
  //          }
  //        }
  //      }
  //    }
  //  },
  //  "response": {
  //    "statusCode": 500,
  //    "body": ... string of xml ...,
  //    ...
  //    "request": {
  //      ...
  //    }
  //  },
  //  "body": ... string of xml ...
  var message,
      jsError;

  // create a error message with all the information
  message = [
    extractProperty(error, ['root', 'Envelope', 'Body', 'Fault', 'detail', 'serviceException', 'name']),
    extractProperty(error, ['root', 'Envelope', 'Body', 'Fault', 'detail', 'serviceException', 'message']),
    extractProperty(error, ['root', 'Envelope', 'Body', 'Fault', 'detail', 'serviceException', 'code']),
    extractProperty(error, ['root', 'Envelope', 'Body', 'Fault', 'faultcode']),
    extractProperty(error, ['root', 'Envelope', 'Body', 'Fault', 'faultstring'])
  ].join('; ');

  jsError = new Error(message);
  jsError.code = extractProperty(error, ['root', 'Envelope', 'Body', 'Fault', 'detail', 'serviceException', 'code']);
  jsError.info = extractProperty(error, ['root', 'Envelope', 'Body', 'Fault', 'detail', 'serviceException', 'message']);

  callback(jsError);
};

function extractProperty(object, path) {
  var current = object;
  for (var i = 0; i < path.length; i++) {
    if (path[i] in current) {
      current = current[path[i]];
    } else {
      return undefined;
    }
  }
  return current;
}
