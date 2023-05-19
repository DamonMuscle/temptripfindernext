(function()
{
	createNamespace("TF").URLHelper = URLHelper;

	function URLHelper()
	{
		var self = this;
		self.MAX_URL_LENGTH = 2000;
		self.REPLACE_LENGTH = {
			"COMMA": 2,    // %2C
			"AT_SIGN": 2,  // %40
			"AND": 2       // %26
		};
		self.TEMPLATE_REPLACE_STRING = "{template}";
	};

	URLHelper.prototype.constructor = URLHelper;

	/**
	 * Split required values into groups to avoid exceed request maximum length (414 ERROR: Request-URL Too Long)
	 * 
	 * @param  {String} template request url template
	 * @param  {Array} values request id list
	 * @returns {Array} split id list
	 */
	URLHelper.prototype.splitExceedRequest = function(template, values)
	{
		if (!(values instanceof Array) ||
			values.length === 0)
		{
			return [];
		}

		var self = this,
			commaCount = template.split(",").length,
			atSignCount = template.split("@").length,
			andCount = template.split("&").length,
			commaLength = commaCount * self.REPLACE_LENGTH.COMMA,
			atSignLength = atSignCount * self.REPLACE_LENGTH.AT_SIGN,
			andLength = andCount * self.REPLACE_LENGTH.AND,
			valueMaxLength = self.MAX_URL_LENGTH - template.length - commaLength - atSignLength - andLength,
			valueCount = values.length,
			includeValues = values.join(","),
			splitIdList = [],
			subValueList = [];

		if ((includeValues.length + valueCount * self.REPLACE_LENGTH.COMMA) < valueMaxLength)
		{
			return [includeValues];
		}

		// split
		for (var i = 0, count = values.length; i < count; i++)
		{
			var value = values[i];
			subValueList.push(value);

			var subCount = subValueList.length,
				subValueString = subValueList.join(',');

			if ((subValueString.length + subCount * self.REPLACE_LENGTH.COMMA) >= valueMaxLength)
			{
				subValueList.pop();
				subValueString = subValueList.join(',');
				splitIdList.push(subValueString);

				subValueList = [];
				subValueList.push(value);
			}
		}

		if (subValueList.length > 0)
		{
			subValueString = subValueList.join(',');
			splitIdList.push(subValueString);
		}

		return splitIdList;
	};

	//split array to chunks with specified size
	URLHelper.prototype.chunk = function(arr, size)
	{
		if (!Array.isArray(arr))
		{
			return [];
		}
		var chuns = [];
		for (var i = 0; i < arr.length; i += size)
			chuns.push(arr.slice(i, i + size));
		return chuns;
	}

	URLHelper.downloadFileGenerator = function(data, optoins, fileName)
	{
		let windowUrl = window.URL || window.webkitURL;
		let blob = new Blob(data, optoins);
		let objectURL = windowUrl.createObjectURL(blob);

		let anchor = $(document.createElement('a'));
		anchor.prop('href', objectURL);
		anchor.prop('download', fileName);
		anchor.get(0).click();
		windowUrl.revokeObjectURL(objectURL);
	}

	URLHelper.generateQRCode = function(content, fileName)
	{
		const $qrEle = $("<div></div>");
		const qrWidth = 800;
		const dateTimeFormat = "YYMMDD_HHmmss";
		fileName = fileName ? `QR_${fileName}.jpg` : `QR_${moment().format(dateTimeFormat)}.jpg`;
		$qrEle.kendoQRCode({
			value: content,
			size: qrWidth,
			background: "#FFFFFF",
			color: "#000000"
		});

		kendo.drawing.drawDOM($qrEle).then(function(group)
		{
			kendo.drawing.exportImage(group).done(function(data)
			{
				kendo.saveAs({
					dataURI: data,
					fileName: fileName
				});
			});
		});
	}

	URLHelper.generateQRImage = function (element, content)
	{
		const qrWidth = 184;

		element.kendoQRCode({
			value: content,
			size: qrWidth,
			background: "#FFFFFF",
			color: "#000000"
		});
	}

	URLHelper.parseUrlParam = (url) =>
	{
		var parmResult = {};
		var start = url.indexOf("?") !== -1 ? url.indexOf("?") + 1 : url.length;
		var end = url.length;
		url = url.substring(start, end);
		const parmArray = url.split("&");

		for (var i = 0; i < parmArray.length; i++)
		{
			const parts = parmArray[i].split("=");
			parmResult[parts[0]] = parts[1];
		}

		return parmResult;
	};
})();