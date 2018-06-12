(function()
{
	var namespace = createNamespace("TF.Helper");

	namespace.DropDownMenuHelper = DropDownMenuHelper;

	function DropDownMenuHelper()
	{

	}

	DropDownMenuHelper.prototype.constructor = DropDownMenuHelper;


	DropDownMenuHelper.setSelectValue = function(data, field, itemName, format)
	{
		return function()
		{
			var observableField = data.obEntityDataModel()[field];
			if (data[itemName] && observableField() != format(data[itemName]()))
			{
				observableField(format(data[itemName]()));
			}
		}
	};

	DropDownMenuHelper.setSelectText = function(data, source, field, textName, valueformat, textformat)
	{
		var item = $.grep(source, function(d)
		{
			return valueformat(d) == this.obEntityDataModel()[field]();
		}.bind(data))[0];
		if (item)
			data[textName](textformat(item));
	}

	DropDownMenuHelper.setSelectTextComputer = function(data, sourceName, field, valueFormat, Textformat)
	{
		return function()
		{
			var item = Enumerable.From(data[sourceName]()).Where(function(c)
			{
				return valueFormat(c) === this.obEntityDataModel()[field]()
			}.bind(data)).ToArray()[0];
			return item ? Textformat(item) : "";
		}
	};
})()