(function()
{
	createNamespace("TF.Modal").SelectMapModalViewModel = SelectMapModalViewModel;

	function SelectMapModalViewModel(base)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);
		self.title(null);

		if (TF.isMobileDevice)
		{
			self.sizeCss = "modal-fullscreen";
		} else
		{
			self.sizeCss = "modal-dialog-select-map";
		}
		self._base = base;
		self.modalClass = 'mobile-modal-grid-modal';
		self.contentTemplate("modal/SelectMapMobile");
		self.selectMapViewModel = new TF.Modal.SelectMapMobileViewModel(base);
		self.data(self.selectMapViewModel);
	}

	SelectMapModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	SelectMapModalViewModel.prototype.constructor = SelectMapModalViewModel;

	SelectMapModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		self.selectMapViewModel.cancel().then(function(result)
		{
			if (result)
			{
				self.positiveClick();
			}
			else if (result === false)
			{
				self.negativeClose(false);
			}

			self._base && self._base.$offMapTool.css({
				'display': 'block'
			});

			if (self._base)
			{
				var $mapToolLabel = self._base.$offMapTool.find('.map-tool-label-fix');
				if ($mapToolLabel && $mapToolLabel.length)
				{
					$mapToolLabel.css('display', 'block');
				}
			}
		}.bind(this));
	};

	SelectMapModalViewModel.prototype.dispose = function()
	{
		var self = this;

		if (self._base && self._base.$offMapTool && self._base.$offMapTool.length)
		{
			TF.Map.ExpandMapTool.moveMobileFullScreenBaseMapAhead(self._base.$offMapTool);
		}

		self.selectMapViewModel.dispose();
	};
})();
