(function()
{
	createNamespace("TF.Modal").BaseModalViewModel = BaseModalViewModel;

	function BaseModalViewModel()
	{
		this.positiveClick = this.positiveClick.bind(this);
		this.positiveClose = this.positiveClose.bind(this);
		this.closeClick = this.closeClick.bind(this);

		this.resolve = null;
		this.reject = null;
		var self = this;
		this._promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject; });
		this.data = ko.observable();
		this.sizeCss = '';
		this.modalClass = '';
		this.title = ko.observable('');
		this.description = ko.observable('');
		this.contentTemplate = ko.observable('');
		this.buttonTemplate = ko.observable('');
		this.obCloseable = ko.observable(false);
		this.obCloseButtonVisible = ko.observable(true);
		this.obPositiveButtonLabel = ko.observable("Save");
		this.obSaveAndNewButtonLabel = ko.observable("Save & New");
		this.obNegativeButtonLabel = ko.observable("Cancel");
		this.obOtherButtonLabel = ko.observable("Other");
		this.containerLoaded = ko.observable(false);
		this.obDisableControl = ko.observable(false);
		this.obPositiveControl = ko.observable(false);
		this.obSaveAndNewControl = ko.observable(false);
		this.obPageElement = ko.observable();
		this.obCustomizeCss = ko.observable("");
		this.modalWidth = ko.observable("");

		this.obArrowButtonVisible = ko.observable(false);
		this.newDataList = [];

		this.OutSizeClickEnable = false;

		this.obPositiveUnderlineClass = ko.observable("");
		this.obNegativeUnderlineClass = ko.observable("");
		this.obSaveAndNewUnderlineClass = ko.observable("");
		this.obOtherUnderlineClass = ko.observable("");

		//Add the guid in every modal, this guid is used for shortCutKey, different modal bind different shortCutKey.
		//If user focus in modal A, user can use modal A shortCutKey, user change focus in modal b, user can use modal b shortCutKey and can not use modal A shortCutKey.
		//Hash Map key name use the modal name before, because the js code is compressed in buildagent and all modal names are 'a', so the hash map key name use the guid from now on.
		this.shortCutKeyHashMapKeyName = Math.random().toString(36).substring(7);
		self.inheritChildrenShortCutKey = true;//If this modal was removed, the system would be used the children short cut key.
		self.notDelayTrigger = false;//If the hot keys need to be delay triggered.
		self.focusInFirstElement = true;//The first input don't focus in after modal was opened.
	};

	BaseModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.positiveClose();
	};

	BaseModalViewModel.prototype.positiveClose = function(returnData)
	{
		this.hide();
		this.resolve(returnData ? returnData : this.data());
	};

	BaseModalViewModel.prototype.negativeClick = function(viewModel, e)
	{
		this.negativeClose();
	};

	BaseModalViewModel.prototype.negativeClose = function(returnData)
	{
		this.hide();
		this.resolve(returnData ? returnData : false);
	};

	BaseModalViewModel.prototype.saveAndNewClick = function(returnData)
	{

	};

	BaseModalViewModel.prototype.closeClick = function(viewModel, e)
	{
		this.negativeClick(viewModel, e);
	};

	BaseModalViewModel.prototype.prevClick = function(viewModel, e)
	{
		e.stopPropagation();
	}

	BaseModalViewModel.prototype.nextClick = function(viewModel, e)
	{
		e.stopPropagation();
	};

	BaseModalViewModel.prototype.hide = function()
	{
		tf.modalManager.hideModal(this);
	};

	BaseModalViewModel.prototype.getPromise = function()
	{
		return this._promise;
	};

	BaseModalViewModel.prototype.dispose = function()
	{

	};
})();
