(function()
{
	createNamespace("TF").DateBoxHelper = DateBoxHelper;

	function DateBoxHelper(datePicker, dateBox)
	{
		this.datePicker = datePicker;
		datePicker.element.on("keypress", this.keypress.bind(this));
		datePicker.element.on("keyup", this.keyup.bind(this));
		datePicker.element.on("blur", this.dateChange.bind(this));
		this.trigger = null;
		this.dateBox = dateBox;
	}

	DateBoxHelper.prototype.dateChange = function(e)
	{
		var strValue = this.datePicker.element.val();
		if (strValue == "")
		{
			if (this.dateBox)
			{
				this.dateBox.value('');
			}
			return;
		}
		var dateTime = moment(this.convertToDateFormat(strValue));
		if (dateTime.isValid())
		{
			if (this.dateBox)
			{
				this.dateBox.value(toISOStringWithoutTimeZone(dateTime));
			}
			else
			{
				this.datePicker._change(toISOStringWithoutTimeZone(dateTime));
			}

			if (this.trigger)
			{
				this.trigger();
			}
		}
	};

	DateBoxHelper.prototype.keypress = function(e)
	{
		var key = e.which || e.keyCode || 0;
		if ((key < 45 || key > 57)&&TF.Input.BaseBox.notSpecialKey(e))
		{
			e.preventDefault();
			return;
		}
		if (key == 13)
		{
			this.dateChange(e);
		}
	};

	DateBoxHelper.prototype.keyup = function(viewModel, e)
	{ //this might cause some corsor issues, so ignore it
		// var selectionstart = this.datePicker.element[0].selectionStart;
		// this.datePicker.element.val(this.datePicker.element.val().replace(/[^\d|//|\-|\.]/ig, ""));
		// this.datePicker.element[0].selectionStart = selectionstart;
		// this.datePicker.element[0].selectionEnd = selectionstart;
	};

	DateBoxHelper.prototype.convertToDateFormat = function(strValue)
	{
		if (strValue.indexOf(".") > 0)
		{
			if (strValue.trim().split(".").length == 3)
			{
				strValue = strValue.replace(/\./g, "-");
			}
			else
			{
				return strValue;
			}
		}
		if (strValue.indexOf("-") > 0)
		{
			var strArr = strValue.trim().split("-");
			if (strArr.length == 3)
			{
				if (strArr[0].length == 4)
				{
					return strArr[1] + "/" + strArr[2] + "/" + strArr[0];
				}
				return strArr[1] + "/" + strArr[0] + "/" + strArr[2];
			}
			return strValue;
		}
		return strValue;
	};

})();
