(function()
{
	createNamespace("TF").DateBoxHelper = DateBoxHelper;

	function DateBoxHelper(datePicker, dateBox, isStartOrEnd)
	{
		this.datePicker = datePicker;
		datePicker.element.on("keypress", this.keypress.bind(this));
		datePicker.element.on("blur", this.dateChange.bind(this));
		this.trigger = null;
		this.dateBox = dateBox;
		this.isStartOrEnd = isStartOrEnd
	}

	DateBoxHelper.prototype.dateChange = function(e,isAll)
	{
		var strValue = this.datePicker.element.val();
		var dateTime = moment(this.convertToDateFormat(strValue));
		if (dateTime.isValid())
		{
			if (this.dateBox)
			{
				var dateTimeStr = toISOStringWithoutTimeZone(dateTime)

				if(this.isStartOrEnd )
				{
					var rawValue =  this.dateBox.value()
					if(isAll  == "All")
					{
						rawValue.StartDate = dateTimeStr
						rawValue.EndDate = dateTimeStr
					}
					else if(this.isStartOrEnd  == "StartDate")
					{
						rawValue.StartDate = dateTimeStr
					}
					else if(this.isStartOrEnd  == "EndDate")
					{
						rawValue.EndDate = dateTimeStr
					}
					this.dateBox.value(rawValue)
				}
				else
				{
					this.dateBox.value(dateTimeStr);
				}
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
		else
		{
			if (this.dateBox)
			{
				if(this.isStartOrEnd )
				{
					var rawValue =  this.dateBox.value()
					if(isAll == "All")
					{
						rawValue.StartDate = ''
						rawValue.EndDate = '01/01/1900'
					}
					else if(this.isStartOrEnd  == "StartDate")
					{
						rawValue.StartDate = ''
					}
					else if(this.isStartOrEnd  == "EndDate")
					{
						rawValue.EndDate = ''
					}
					this.dateBox.value(rawValue)
				}
				else
				{
					this.dateBox.value('');
				}
			}
			return;
		}
	};

	DateBoxHelper.prototype.keypress = function(e)
	{
		var key = e.which || e.keyCode || 0;
		if ((key < 45 || key > 57) && TF.Input.BaseBox.notSpecialKey(e))
		{
			e.preventDefault();
			return;
		}
		if (key == 13)
		{
			this.dateChange(e);
		}
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
