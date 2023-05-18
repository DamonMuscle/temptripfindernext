(function()
{
	createNamespace("TF.Grid").ManageLayoutViewMobileModel = ManageLayoutViewMobileModel;

	function ManageLayoutViewMobileModel(obGridLayoutExtendedDataModels, obGridFilterDataModels, obGridThematicDataModels, fnSaveAndEditGridLayout, fnApplyGridLayout, obSelectedGridLayoutName, manageLayoutModal)
	{
		this.obGridLayoutExtendedDataModels = obGridLayoutExtendedDataModels;
		this.obGridFilterDataModels = obGridFilterDataModels;
		this.obGridThematicDataModels = obGridThematicDataModels;
		this.fnSaveAndEditGridLayout = fnSaveAndEditGridLayout;
		this.fnApplyGridLayout = fnApplyGridLayout;
		this.manageLayoutModal = manageLayoutModal;
		this.obSelectedGridLayoutName = obSelectedGridLayoutName;
		this.obIsSafari = ko.observable(TF.isSafari);
		this.isTouching = false;
		PubSub.subscribe(topicCombine(pb.DATA_CHANGE, 'gridLayout'), this.saveAndEditGridLayoutDidFinish.bind(this));
	}

	ManageLayoutViewMobileModel.prototype.loaded = function(items)
	{
		var self = this;
		setTimeout(function()
		{
			$.each(items, function(index, item)
			{
				if (item instanceof HTMLElement && $(item).hasClass("mobile-modal-grid-select-option"))
				{
					new TF.TapHelper(item,
						{
							swipingLeft: function(evt)
							{
								self.isTouching = true;
								var $element = $(evt.target).closest(".mobile-modal-grid-select-option"),
									swipedItem;
								$.each($(item).parent().find(".mobile-modal-grid-select-option"), function(index, option)
								{
									if ($(option).css("marginLeft") === "-134px")
									{
										swipedItem = $(option);
										return false;
									}
								});
								if ($element.is(':animated') || $element.css("marginLeft") === "-134px" || (swipedItem && swipedItem.is(':animated')))
									return;
								if (swipedItem)
								{
									swipedItem.stop().animate(
										{
											marginLeft: "15px",
											marginRight: "0"
										}, 200);
								}
								$element.stop().animate(
									{
										marginLeft: "-134px",
										marginRight: "134px"
									}, 200);
							},
							swipingRight: function(evt)
							{
								self.isTouching = true;
								var $element = $(evt.target).closest(".mobile-modal-grid-select-option");
								if ($element.is(':animated') || $element.css("marginLeft") !== "-134px")
									return;
								$element.stop().animate(
									{
										marginLeft: "15px",
										marginRight: "0"
									}, 200);
							},
							touchOver: function(evt)
							{
								//make sure delete/edit event won't invoke after swiping the item.
								if (self.isTouching)
								{
									setTimeout(function()
									{
										self.isTouching = false;
									}, 200);
								}
							}
						});
				}
			});
		});
	};

	ManageLayoutViewMobileModel.prototype.selectLayout = function(layout, e)
	{
		var $element = $(e.target).closest(".mobile-modal-grid-select-option");
		if ($element.length > 0 && $element.css("marginLeft") === "-134px" && !$element.is(':animated'))
		{
			$element.stop().animate(
				{
					marginLeft: "15px",
					marginRight: "0"
				}, 200);
			return;
		}
		var gridLayoutExtendedDataModel = layout;
		this.fnApplyGridLayout(gridLayoutExtendedDataModel).then(function(ans)
		{
			if (ans !== false)
			{
				TF.menuHelper.hiddenMenu();
				this.manageLayoutModal.negativeClick();
			}
		}.bind(this));
	};

	ManageLayoutViewMobileModel.prototype.deleteGridLayout = function(gridLayoutExtendedDataModel, e)
	{
		e.stopPropagation();
		if (this.isTouching)
		{
			return;
		}

		if (gridLayout.autoExportExists())
		{
			const isSigular = !gridLayout.autoExports() || gridLayout.autoExports().length === 1;
			const exportsHolder = `data export${isSigular ? "" : "s"}`;
			tf.promiseBootbox.alert(`This layout is associated with the ${gridLayout.autoExportNames()} ${exportsHolder}. It cannot be deleted.`);
			return;
		}

		tf.promiseBootbox.confirm(
			{
				title: "Delete Confirmation",
				message: "Are you sure you want to delete this Layout? It will no longer be available to other users.",
				closeButton: false,
				buttons:
				{
					OK:
					{
						label: "Delete",
						className: "btn-delete-mobile"
					},
					Cancel:
					{
						label: "Cancel",
						className: "btn-cancel-mobile"
					}
				}
			})
			.then(function(result)
			{
				if (result)
				{
					var self = this;
					tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlayouts", gridLayoutExtendedDataModel.id()))
						.then(function(apiResponse)
						{
							if (apiResponse)
							{
								self.obGridLayoutExtendedDataModels.remove(gridLayoutExtendedDataModel);
							}
						});
				}
			}.bind(this));
	};

	ManageLayoutViewMobileModel.prototype.saveAndEditGridLayoutDidFinish = function(name, result)
	{
		if (result.applyOnSave)
		{
			TF.menuHelper.hiddenMenu();
			this.manageLayoutModal.negativeClick();
		}
	};

	ManageLayoutViewMobileModel.prototype.editGridLayout = function(gridLayoutExtendedDataModel, e)
	{
		e.stopPropagation();
		if (this.isTouching)
		{
			return;
		}
		$(e.target).closest(".mobile-modal-grid-select-option").stop().animate(
			{
				marginLeft: "15px",
				marginRight: "0"
			}, 200);
		this.fnSaveAndEditGridLayout("edit", gridLayoutExtendedDataModel);
	};

	ManageLayoutViewMobileModel.prototype.dispose = function()
	{
		PubSub.unsubscribe(topicCombine(pb.DATA_CHANGE, "gridLayout"));
	};
})();
