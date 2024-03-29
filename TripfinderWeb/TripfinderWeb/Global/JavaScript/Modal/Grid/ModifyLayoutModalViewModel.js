﻿(function()
{
	createNamespace("TF.Modal.Grid").ModifyLayoutModalViewModel = ModifyLayoutModalViewModel;

	function ModifyLayoutModalViewModel(options)
	{
		const { isNew } = options;

		TF.Modal.BaseModalViewModel.call(this);
		this.optionType = isNew;
		this.description("Changes to this layout can be saved (visible columns, display order, and sorting).  Additionally, the name may be changed and the associated filter may be changed or removed.");
		if (isNew === "new")
		{
			this.title('Save As New Layout');
			this.description("Save the visible columns, display order, and sort order as a new layout.  The applied filter may be included in this new layout.");
		}
		else if (isNew === "edit")
		{
			this.title('Edit Layout');
		}
		else
		{
			this.title('Save Layout');
		}

		if (TF.isPhoneDevice)
		{
			this.title(null);
			this.sizeCss = "modal-fullscreen";
			this.modalClass = 'mobile-modal-grid-modal';
			this.contentTemplate('workspace/grid/SaveLayoutMobile');
			$("#pageMenu .show-menu-button").css('z-index', '1');
		}
		else
		{
			this.sizeCss = "modal-dialog-sm";
			this.modalClass = 'savelayout-modal';
			this.contentTemplate('workspace/grid/savelayout');
			this.buttonTemplate('modal/positivenegative');
			this.obPositiveButtonLabel = ko.observable("Save");
		}

		this.modifyLayoutViewModel = new TF.Grid.ModifyLayoutViewModel(options);
		this.data(this.modifyLayoutViewModel);
	}

	ModifyLayoutModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ModifyLayoutModalViewModel.prototype.constructor = ModifyLayoutModalViewModel;

	ModifyLayoutModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.modifyLayoutViewModel.apply().then(function(result)
		{
			if (result)
			{
				PubSub.publish(topicCombine(pb.DATA_CHANGE, "gridLayout"), result);
				this.positiveClose(result);
			}
		}.bind(this));
	};

	ModifyLayoutModalViewModel.prototype.negativeClick = function()
	{
		if (this.optionType !== "edit")
		{
			return this.negativeClose(false);
		}
		this.modifyLayoutViewModel.cancel().then(function(result)
		{
			if (result)
			{
				this.positiveClick();
			}
			else if (result === false)
			{
				this.negativeClose(false);
			}
		}.bind(this));
	};

	ModifyLayoutModalViewModel.prototype.dispose = function()
	{
		this.modifyLayoutViewModel.dispose();
	};
})();
