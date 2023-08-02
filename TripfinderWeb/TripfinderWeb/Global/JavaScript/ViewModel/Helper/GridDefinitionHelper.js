(function()
{
	createNamespace("TF.Helper").GridDefinitionHelper = GridDefinitionHelper;

	function GridDefinitionHelper()
	{

	};

	GridDefinitionHelper.prototype.updateGridDefinitionDisplayNameFromTerm = function(column)
	{
		if (!column.DisplayName)
		{
			column.DisplayName = column.FieldName;
		}

		var temp = column.DisplayName;

		for (var i = 0; i < tf.APPLICATIONTERMDEFAULTVALUES.length; i++)
		{
			var key = tf.APPLICATIONTERMDEFAULTVALUES[i];

			if (tf.applicationTerm[key.Term])
			{
				if (temp.indexOf(key.Singular) > -1)
				{
					temp = temp.replace(new RegExp('\\b' + key.Singular + '\\b', 'ig'), tf.applicationTerm[key.Term].Singular);
				}
				if (temp.indexOf(key.Plural) > -1)
				{
					temp = temp.replace(new RegExp('\\b' + key.Plural + '\\b', 'ig'), tf.applicationTerm[key.Term].Plural);
				}
				if (temp.indexOf(key.Abbreviation) > -1)
				{
					temp = temp.replace(new RegExp('\\b' + key.Abbreviation + '\\b', 'ig'), tf.applicationTerm[key.Term].Abbreviation);
				}
			}
		}

		column.DisplayName = temp;
	};

	GridDefinitionHelper.prototype.updateGridDefinitionWidth = function(column)
	{
		//if (column.type === "time" || column.type === "date")
		//{
		//	column.Width = "170px";
		//}
		var displayName = column.DisplayName ? column.DisplayName : column.FieldName;
		if (displayName.length + 1 > 20)
		{
			column.Width = (displayName.length * 7 + 7 + 10) + 'px';
		}
		return column;
	};
})();