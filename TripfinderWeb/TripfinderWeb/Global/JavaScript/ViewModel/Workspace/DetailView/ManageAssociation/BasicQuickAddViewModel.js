(function () {
	(function () {
		createNamespace("TF.DetailView").BasicQuickAddViewModel = BasicQuickAddViewModel;

		function BasicQuickAddViewModel(options) {
			var self = this;
			self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
			self.quickAddViewModel = options.isUDFGroup ? new TF.DetailView.UDGridGridStackQuickAddWrapper(
				$.extend({}, options, {
					pageLevelViewModel: self.pageLevelViewModel
				})) : new TF.DetailView.GridStackQuickAddWrapper(
					$.extend({}, options, {
						pageLevelViewModel: self.pageLevelViewModel
					}));
		};

		BasicQuickAddViewModel.prototype.save = function () {
			var self = this;
			return self.quickAddViewModel.save()
				.then(function (result) {
					if (result) {
						if (result.success) {
							self.pageLevelViewModel.clearError();
							self.pageLevelViewModel.popupSuccessMessage("The record has been successfully created.");
							return result;
						}
						else {
							return false;
						}
					}
				});
		};

		BasicQuickAddViewModel.prototype.cancel = function () {
			const self = this;
			return self.quickAddViewModel.cancel()
		};


		/**
		 * Dispose
		 * 
		 * @return {void}
		 */
		BasicQuickAddViewModel.prototype.dispose = function () {
			var self = this;
			if (self.quickAddViewModel) {
				self.quickAddViewModel.dispose();
			}

			if (self.pageLevelViewModel) {
				self.pageLevelViewModel.dispose();
			}
		};
	})();

})();