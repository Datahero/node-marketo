var URL = require('url');
var parseString = require('xml2js').parseString;


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
exports.handleError = function handleError(errorBody, callback) {
  var message = errorBody.message;

  /**
   * Errors from marketo have strings embedded before the xml response...
   * they look like this:
   "Invalid response: 500
   Body: <?xml version="1.0" encoding="UTF-8"?>
   <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
     <SOAP-ENV:Body>
       <SOAP-ENV:Fault>
         <faultcode>SOAP-ENV:Client</faultcode>
         <faultstring>20014 - Authentication failed</faultstring>
         <detail>
           <ns1:serviceException xmlns:ns1="http://www.marketo.com/mktows/">
             <name>mktServiceException</name>
             <message>Authentication failed (20014)</message>
             <code>20014</code>
           </ns1:serviceException>
         </detail>
       </SOAP-ENV:Fault>
     </SOAP-ENV:Body>
   </SOAP-ENV:Envelope>"
   */
  var errorWithoutMessage = message.split('\n').slice(1).join('');
  var errorXMLString = errorWithoutMessage.replace('Body: ', "");

  parseString(errorXMLString, function(err, result){
    var returnError;

    if (err) {
      returnError = new Error("Could Not Parse the Marketo Error: " +errorBody)
    } else {

      var fault = result["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0]['SOAP-ENV:Fault'][0].faultstring[0].split(" - ");
      var code = fault[0];
      var message = fault[1];
      var detail = fault.detail;
      returnError = new Error(message);
      returnError.code = code;
      returnError.details = detail;
    }

    // Must Callback with an Error.
    return callback(returnError, null);
  });
};
