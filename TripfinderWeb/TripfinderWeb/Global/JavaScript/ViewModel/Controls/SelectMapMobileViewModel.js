(function()
{
	createNamespace("TF.Modal").SelectMapMobileViewModel = SelectMapMobileViewModel;

	SelectMapMobileViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	SelectMapMobileViewModel.prototype.constructor = SelectMapMobileViewModel;

	function SelectMapMobileViewModel(base)
	{
		var self = this;
		self.base = base;
		self.headingBackgroundColor = ko.observable("black");
		self.headingFontColor = ko.observable("white");
		self.$baseMapGallery = 'mobileBasemapGallery';
	}

	SelectMapMobileViewModel.prototype.initialize = function(viewModel, el)
	{
		var self = this;
		self.createBaseMapGallery();
	};

	SelectMapMobileViewModel.prototype.createBaseMapGallery = function()
	{
		var self = this;
		if (!_.isEmpty(self.base.baseMapTools))
		{
			$('#' + self.$baseMapGallery).append(self.base.baseMapTools);
		} else
		{
			self.base.initBaseMapTool && self.base.initBaseMapTool(self.$baseMapGallery);
		}
	};

	SelectMapMobileViewModel.prototype.cancel = function()
	{
		return Promise.resolve(false);
	};

	SelectMapMobileViewModel.prototype.dispose = function()
	{
	};
})();
