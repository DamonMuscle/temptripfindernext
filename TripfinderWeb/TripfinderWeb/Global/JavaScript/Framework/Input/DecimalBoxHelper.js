(function()
{
	createNamespace("TF").DecimalBoxHelper = DecimalBoxHelper;

	function DecimalBoxHelper()
	{
	}

	DecimalBoxHelper.precision6scale2 = function(event)
	{
		var keyCode = event.which || event.keyCode || 0;
		//this is to handle the limitation of input length.
		if ((keyCode != 46 || $(this).val().indexOf('.') != -1) && (keyCode < 48 || keyCode > 57) && keyCode != 37 && keyCode != 39)
		{
			event.preventDefault();
		}
		if (document.getSelection() && document.getSelection().type == "Range")
		{
			return;
		}
		var curValue = $(this).val(),
			curLength = curValue.length,
			curDotIndex = curValue.indexOf('.');
		if (curDotIndex == -1)
		{//if the input is integer, the max length is 6
			if (curLength >= 6)
			{
				event.preventDefault();
			}
		}
		else
		{//not integer
			if (curLength >= 7)
			{//length is already to 6 without dot
				event.preventDefault();
			}
			else
			{//length is less than 6
				if (curValue.substring(curDotIndex).length >= 3)
				{// decimal length equal 2
					if (this.selectionStart >= curDotIndex + 1)
					{
						//and input in decimal part
						event.preventDefault();
					}
				}
			}
		}

		if (event.type == "blur" && $(this).val() !== '')
		{//sometimes to replace the previous number to dot.
			$(this).val(parseFloat($(this).val()).toFixed(2));
		}
	}

	DecimalBoxHelper.precision20scale2 = function(event)
	{
		var keyCode = event.which || event.keyCode || 0;
		//this is to handle the limitation of input length.
		if ((keyCode != 46 || $(this).val().indexOf('.') != -1) && (keyCode < 48 || keyCode > 57) && keyCode != 37 && keyCode != 39)
		{
			event.preventDefault();
		}
		if (document.getSelection() && document.getSelection().type == "Range")
		{
			return;
		}

		var curValue = $(this).val(),
			curLength = curValue.length,
			curDotIndex = curValue.indexOf('.');
		if (curDotIndex == -1)
		{//if the input is integer, the max length is 20
			if (curLength >= 20)
			{
				event.preventDefault();
			}
		}
		else
		{//not integer
			if (curLength >= 21)
			{//length is already to 20 without dot
				event.preventDefault();
			}
			else
			{//length is less than 20
				if (curValue.substring(curDotIndex).length >= 3)
				{// decimal length equal 2
					if (this.selectionStart >= curDotIndex + 1)
					{
						//and input in decimal part
						event.preventDefault();
					}
				}
			}
		}

		if (event.type == "blur" && $(this).val() !== '')
		{//sometimes to replace the previous number to dot.
			$(this).val(parseFloat($(this).val()).toFixed(2));
		}
	}

})();