(function()
{
	createNamespace('TF.Control').CopyDataViewModel = CopyDataViewModel;

	function CopyDataViewModel(data, finishFunc)
	{
		this.copyData = data;
		this.finishFunc = finishFunc;
		this.useTextArea = TF.isMobileDevice;
	}

	CopyDataViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	CopyDataViewModel.prototype.constructor = CopyDataViewModel;

	CopyDataViewModel.prototype.init = function(model, element)
	{
		setTimeout(function()
		{
			if (this.useTextArea)
			{
				var $areaClipBoard = $("<textarea id='copytextarea'/>");
				$areaClipBoard.val(this.copyData).appendTo($(element));
			}
			this.finishFunc();
		}.bind(this), 500);
	};

	CopyDataViewModel.prototype.apply = function()
	{
		var self = this, defferd = $.Deferred();
		if (self.useTextArea)
		{
			var element = document.getElementById("copytextarea");
			element.focus();
			element.setSelectionRange(0, element.value.length);
			document.execCommand("copy");
			element.blur();
			window.getSelection().removeAllRanges();
			defferd.resolve();
		}
		else
		{
			if (window.clipboardData)
			{
				window.clipboardData.setData("text", self.copyData);
				document.execCommand("copy");
				defferd.resolve();
			}
			else
			{
				$(document).on('copy.gridcopy', function(event)
				{
					event.preventDefault();
					event.originalEvent.clipboardData.setData("text/plain", this.copyData);
				}.bind(this));
				document.execCommand("copy");
				defferd.resolve();
			}
		}
		return defferd;
	};


	CopyDataViewModel.prototype.dispose = function()
	{
		$(document).off(".gridcopy");
	};
})();
