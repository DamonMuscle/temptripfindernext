
(function()
{
	createNamespace("TF.Map").TooltipViewModel = TooltipViewModel;

	function TooltipViewModel(xPixel, yPixel, bkColor, bdColor, ftColor, pointDescriptions)
	{
		this._xPixel = ko.observable(xPixel);
		this._yPixel = ko.observable(yPixel);
		this._bkColor = ko.observable(bkColor);
		this._bdColor = ko.observable(bdColor);
		this._ftColor = ko.observable(ftColor);
		this._pointDescriptions = ko.observableArray(pointDescriptions);

		this._tooltipId = 'map-point-tooltip';
		this._tooltipIdQuery = '#' + this._tooltipId;
	}

	TooltipViewModel.prototype._refreshViewModel = function(xPixel, yPixel, bkColor, bdColor, ftColor, pointDescriptions)
	{
		this._xPixel(xPixel);
		this._yPixel(yPixel);
		this._bkColor(bkColor);
		this._bdColor(bdColor);
		this._ftColor(ftColor);
		this._pointDescriptions(pointDescriptions);
	}

	TooltipViewModel.prototype.render = function()
	{
		if ($(this._tooltipIdQuery).length === 0)
		{
			var $tooltipHtml = $("<div class='diretion-drop-destination-tooltip' id='" + this._tooltipId + "' data-bind=\"style: { position: 'absolute', padding: '7px', left: _xPixel()+'px', top: _yPixel()+'px', "
				+ "backgroundColor: _bkColor(), borderStyle: 'solid', borderColor: _bdColor(), color: _ftColor(), "
				+ "borderWidth: '1px', zIndex: '150' }\"><p data-bind='text: _pointDescriptions()[0]'>"
				+ "</p><p data-bind='text: _pointDescriptions()[1]'></p></div>");
			$("body").append($tooltipHtml);
			ko.applyBindings(this, $tooltipHtml[0]);

			//update the parameter whether the tooltip is shown
			if (arguments.length > 0)
			{
				arguments[0].shown = true;
			}
		}
	}

	TooltipViewModel.prototype.refreshShowTooltip = function(xPixel, yPixel, bkColor, bdColor, ftColor, pointDescriptions)
	{
		var $tooltip = $(this._tooltipIdQuery);
		if ($tooltip.length > 0)
		{
			this._refreshViewModel(xPixel, yPixel, bkColor, bdColor, ftColor, pointDescriptions);

			//show tooltip
			$tooltip.show();

			//update the parameter whether the tooltip is shown
			if (arguments.length > 6)
			{
				arguments[6].shown = true;
			}
		}
	}

	TooltipViewModel.prototype.hideTooltip = function()
	{
		var $tooltip = $(this._tooltipIdQuery);
		if ($tooltip.length > 0)
		{
			$tooltip.hide();

			//update the parameter whether the tooltip is shown
			if (arguments.length > 0)
			{
				arguments[0].shown = false;
			}
		}
	}

	TooltipViewModel.prototype.destroyTooltip = function()
	{
		var $tooltip = $(this._tooltipIdQuery);
		if ($tooltip.length > 0)
		{
			$tooltip.remove();

			//update the parameter whether the tooltip is shown and generated
			if (arguments.length > 0)	
			{
				arguments[0].shown = false;
				arguments[1].generated = false;
			}
		}


	}
})()