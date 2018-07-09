(function()
{
	createNamespace("TF.Control").PrintSettingsViewModel = PrintSettingsViewModel;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function PrintSettingsViewModel()
	{
		var self = this;
		self.obSelectedPaperSize = ko.observable('Letter');
		self.obSelectedOrientation = ko.observable('Portrait');
		self.obPaperSizes = ko.observable(['Letter', 'Legal', 'A4']);
		self.obOrientations = ko.observable(['Portrait', 'Landscape']);
	};

	PrintSettingsViewModel.prototype.getPageWidth = function()
	{
		var self = this, isLandscape = self.obSelectedOrientation() === 'Landscape',
			getInchesByMm = function(mm)
			{
				return mm / 25.4;
			}, getPixelByInches = function(inches)
			{
				return inches * 96;
			};

		// size should minus margin 1in.
		switch (self.obSelectedPaperSize())
		{
			case 'Letter':
				// 8.5 x 11 inches
				return getPixelByInches(isLandscape ? 11 - 1 : 8.5 - 1);
			case 'Legal':
				// 8.5 x 14 inches
				return getPixelByInches(isLandscape ? 14 - 1 : 8.5 - 1);
			case 'A4':
				// 210 x 297 mm
				return getPixelByInches(isLandscape ? getInchesByMm(297) - 1 : getInchesByMm(210) - 1);
		}
	};

})();