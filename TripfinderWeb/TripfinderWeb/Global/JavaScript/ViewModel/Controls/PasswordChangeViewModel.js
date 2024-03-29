﻿(function()
{
	createNamespace("TF.Control").PasswordChangeViewModel = PasswordChangeViewModel;

	PasswordChangeViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	PasswordChangeViewModel.prototype.constructor = PasswordChangeViewModel;

	function PasswordChangeViewModel()
	{
		var self = this;
		self.obCurrentPassword = ko.observable();
		self.obCurrentPasswordWarning = ko.observable();
		self.obNewPassword = ko.observable();
		self.obNewPasswordWarning = ko.observable();
		self.obConfirmNewPassword = ko.observable();
		self.obConfirmNewPasswordWarning = ko.observable();
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	PasswordChangeViewModel.prototype.apply = function()
	{
		var ans;
		ans = true;
		return Promise.resolve(ans);
	};

	PasswordChangeViewModel.prototype.init = function(model, element)
	{
	};


	PasswordChangeViewModel.prototype.cleanErrorMessage = function()
	{
		var self = this;
		self.obCurrentPasswordWarning(false);
		self.obNewPasswordWarning(false);
		self.obConfirmNewPasswordWarning(false);
	}

	/**
	 * Dispose.
	 */
	PasswordChangeViewModel.prototype.dispose = function()
	{
		var self = this;
		setTimeout(function()
		{
			self.pageLevelViewModel.dispose();
		}, 4000);
	};
})();
