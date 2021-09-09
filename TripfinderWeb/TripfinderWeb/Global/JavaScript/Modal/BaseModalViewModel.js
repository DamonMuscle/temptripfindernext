(function () {
	createNamespace("TF.Modal").BaseModalViewModel = BaseModalViewModel;

	function BaseModalViewModel() {
		var self = this;
		self.positiveClick = self.positiveClick.bind(self);
		self.positiveClose = self.positiveClose.bind(self);
		self.closeClick = self.closeClick.bind(self);

		self.resolve = null;
		self.reject = null;
		self._promise = new Promise(function (resolve, reject) { self.resolve = resolve; self.reject = reject; });
		self.data = ko.observable();
		self.sizeCss = '';
		self.modalClass = '';
		self.title = ko.observable('');
		self.description = ko.observable('');
		self.contentTemplate = ko.observable('');
		self.buttonTemplate = ko.observable('');
		self.obCloseable = ko.observable(false);
		self.obCloseButtonVisible = ko.observable(true);
		self.obPositiveButtonLabel = ko.observable("Save");
		self.obSaveAndNewButtonLabel = ko.observable("Save & New");
		self.obNegativeButtonLabel = ko.observable("Cancel");
		self.obOtherButtonLabel = ko.observable("Other");
		self.obOtherButtonClass = ko.observable("btn-link");
		self.obOtherButtonVisible = ko.observable(true);
		self.obOtherButtonDisable = ko.observable(false);
		self.containerLoaded = ko.observable(false);
		self.obDisableControl = ko.observable(false);
		self.obPositiveControl = ko.observable(false);
		self.obSaveAndNewControl = ko.observable(false);
		self.obPageElement = ko.observable();
		self.obCustomizeCss = ko.observable("");
		self.modalWidth = ko.observable("");
		self.obBackdrop = ko.observable("");
		self.obEnableEsc = ko.observable(true);
		self.obEnableEnter = ko.observable(true);

		self.obArrowButtonVisible = ko.observable(false);
		self.newDataList = [];

		self.OutSizeClickEnable = false;
		self.obResizable = ko.observable(false);
		self.obPositiveUnderlineClass = ko.observable("");
		self.obNegativeUnderlineClass = ko.observable("");
		self.obSaveAndNewUnderlineClass = ko.observable("");
		self.obOtherUnderlineClass = ko.observable("");

		//Add the guid in every modal, this guid is used for shortCutKey, different modal bind different shortCutKey.
		//If user focus in modal A, user can use modal A shortCutKey, user change focus in modal b, user can use modal b shortCutKey and can not use modal A shortCutKey.
		//Hash Map key name use the modal name before, because the js code is compressed in buildagent and all modal names are 'a', so the hash map key name use the guid from now on.
		self.shortCutKeyHashMapKeyName = Math.random().toString(36).substring(7);
		self.inheritChildrenShortCutKey = false;//If this modal was removed, the system would be used the children short cut key.
		self.notDelayTrigger = false;//If the hot keys need to be delay triggered.
		self.focusInFirstElement = true;//The first input don't focus in after modal was opened.
		self.successCallback = arguments[0];
		self.failCallback = arguments[1];
		self.cancelPrompt = false;
		self.cancelPromptMessage = "Do you want to cancel?";
		self.cancelPromptTitle = "Unsaved Changes";
	}

	BaseModalViewModel.prototype.otherClick = function (viewModel, e) {

	};

	BaseModalViewModel.prototype.positiveClick = function (viewModel, e) {
		this.positiveClose();
	};

	BaseModalViewModel.prototype.positiveClose = function (returnData) {
		const resolve = this.resolve;
		this.hide();// hide modal dialog will lead to viewmodel dispose

		resolve(returnData ? returnData : this.data());
	};

	BaseModalViewModel.prototype.negativeClick = function (viewModel, e) {
		this.negativeClose();
	};

	BaseModalViewModel.prototype.negativeClose = function (returnData) {
		var promise = this.cancelPrompt ? tf.promiseBootbox.yesNo(
			{
				message: this.cancelPromptMessage,
				closeButton: true
			}, this.cancelPromptTitle) : Promise.resolve(true);

		promise.then(function (value) {
			if (value) {
				const resolve = this.resolve;
				this.hide();// hide modal dialog will lead to viewmodel dispose

				resolve(returnData ? returnData : false);
			}
		}.bind(this));
	};

	BaseModalViewModel.prototype.saveAndNewClick = function (returnData) {

	};

	BaseModalViewModel.prototype.closeClick = function (viewModel, e) {
		e.stopPropagation();
		this.negativeClick(viewModel, e);
	};

	BaseModalViewModel.prototype.prevClick = function (viewModel, e) {
		e.stopPropagation();
	}

	BaseModalViewModel.prototype.nextClick = function (viewModel, e) {
		e.stopPropagation();
	};

	BaseModalViewModel.prototype.hide = function () {
		tf.modalManager.hideModal(this);
	};

	BaseModalViewModel.prototype.getPromise = function () {
		return this._promise;
	};

	BaseModalViewModel.prototype.dispose = function () {
		var data = this.data();
		if (data && data != this && typeof data.dispose === "function") {
			data.dispose();
		}
	};

	BaseModalViewModel.prototype.afterRender = function () {
		var data = this.data();
		if (data && data.afterRender) {
			data.afterRender();
		}
	};

	BaseModalViewModel.prototype.processTabKey = function (ev, element) {
		if (ev.key !== 'Tab') {
			return;
		}

		var previous = ev.shiftKey,
			target = ev.target,
			focusables = $(element).find(":focusable"),
			found, goto, first;
		for (var i = previous ? focusables.length - 1 : 0; previous ? i > -1 : i < focusables.length; previous ? i-- : i++) {
			var focusable = $(focusables[i]);
			if (focusable.closest('.disabled-element').length) {
				continue;
			}

			if (!first) {
				first = focusable;
			}

			if (found) {
				goto = focusable;
				break;
			}

			if (target == focusable[0]) {
				found = true;
			}
		}

		if (!found) {
			return;
		}

		if (!goto) {
			goto = first;
		}

		if (goto) {
			goto.focus();
			ev.preventDefault();
		}
	};

	BaseModalViewModel.prototype.initModal = function (viewModel, element) {
		if (this.controlTabKey) {
			$(element).on("keydown", ev => this.processTabKey(ev, element));
		}
	};

	BaseModalViewModel.prototype.unresolve = function () {
		var self = this;
		self.resolve = null;
		self.reject = null;
		self._promise = new Promise(function (resolve, reject) { self.resolve = resolve; self.reject = reject; });
	};
})();
