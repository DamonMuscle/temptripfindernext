(function() {
  var namespace = createNamespace("TF.Helper");

  namespace.NewCopyNameHelper = NewCopyNameHelper;

  function NewCopyNameHelper() {

  }

  NewCopyNameHelper.generateNewCopyName = function(rawName, existedNames) {
    var result = rawName;
    var regexExtensionStr = " \\-\\ COPY(/(([1-9]){1,}/)){0,1}";
    var regexExtension = new RegExp(regexExtensionStr, "gi");
    var regexExtensionResult = regexExtension.exec(result);
    if (regexExtensionResult && regexExtensionResult.length > 0 && regexExtensionResult[0])
    {
      result = result.substring(0, regexExtensionResult.index);
    }

    var regexNewCopyName = NewCopyNameHelper.removeCopySuffix(result);
    var regexNewCopyNameStr = "^" + regexNewCopyName.replace("\\ ", " ") + " \\-\\ COPY(/(([1-9]){1,}/)){0,1}";

    var copyTimes = 0;

    existedNames.forEach(function(name) {
      var regex = new RegExp(regexNewCopyNameStr, "gi");
      var match;
      if (match = regex.exec(name))
      {
        if (match.input.substring(match.input.length - 1, match.input.length) === ')')
        {
          var copyRegex = /.*(?:\D|^)(\d+)/.exec(name);
          var copyNumber = copyRegex[copyRegex.length - 1];
          if (copyNumber && copyNumber >= copyTimes)
          {
            copyTimes = parseInt(copyNumber) + 1;
          }
        }
        else if (copyTimes <= 1)
        {
          copyTimes = 2;
        }
      }
    });

    result += copyTimes <= 1 ? " - COPY" : " - COPY(" + copyTimes + ")";
    return result;
  };

  NewCopyNameHelper.removeCopySuffix = function(str) {
    return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
  };

})();
