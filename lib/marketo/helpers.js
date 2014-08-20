/**
 * getSecurity
 * @param access
 * @param secret
 * @returns {string}
 */

var crypto = require('crypto');

exports.marketoSecurity = function getSecurity(access, secret) {
  var timestamp = currentW3CTimeStamp();
  var signature = crypto
    .createHmac('sha1', secret)
    .update(timestamp + access)
    .digest('hex');
  return {
    "ns1:AuthenticationHeader": {
      "mktowsUserId": access,
      "requestSignature": signature,
      "requestTimestamp": timestamp
    }
  };
}

/**
 * currentW3CTimeStamp
 * creates a properly formatted date string so we do not require dependency.
 * @returns {string}
 */
function currentW3CTimeStamp() {
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


exports.isAnError = function (statusCode) {
  return parseInt(statusCode / 100, 10) !== 2 ? true : false;
};

/**
 * Creates an Error with information received from marketo. In addition to an
 * error message it also includes an error code.
 *
 *
 * @param message The error message
 * @param code The error code
 * @return Instance of {@link Error}
 */
exports.handlError = function handleError(errorBody, code) {
  var error,
    requestId,
    message,
    status;

  status = errorBody.status;
  message = errorBody.message;
  requestId = errorBody.requestId;

  error = new Error(message || '');

  if (message) {
    error.message = message;
  }

  if (code) {
    error.code = code;
    error.statusCode = code;
  }

  if (requestId) {
    error.requestId = requestId;
    error.request_id = requestId;
  }
  return error;
};
