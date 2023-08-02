(function()
{
	createNamespace("TF.DetailView").DetailViewViewModel = DetailViewViewModel;

	/*****************************
	 * 
	 * we should make naming unified.
	 * 
	 * layoutTemplate: detail screen entity
	 * layoutId: detail screen id
	 * recordEntity: entity in grid rows
	 * recordId: the id of entity in grid rows
	 * 
	 * ***************************/

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function DetailViewViewModel(recordId, pageLevelViewModel, isReadOnly, options, gridType)
	{
		var self = this;
		if(typeof gridType === 'undefined')
		{
			gridType = "fieldtrip";
		}

		TF.DetailView.BaseCustomGridStackViewModel.call(self, recordId);

		self.saveBtnHidden = options && options.saveBtnHidden;
		self.gridType = gridType;
		self.pageType = "detailview";
		self.recordId = recordId;
		//vertical margin not support cannot set to 0, so set to 1, looks the same.
		self.$columnPopup = null;
		self.changeColorTimeout = [];
		self.pendingDataPointRefreshing = null;
		self.pendingLoadRecordEntityId = null;
		self.pendingLoadRecordEntityType = null;

		self.obIsReadOnly(isReadOnly);

		//Events
		self.onToggleDataPointPanelEvent = new TF.Events.Event();
		self.onClosePanelEvent = new TF.Events.Event();
		self.groupDataBlockEvent = new TF.Events.Event();
		self.onColumnChangedEvent = new TF.Events.Event();
		self.onCloseDetailEvent = new TF.Events.Event();
		self.onCloseEditMode = new TF.Events.Event();
		self.beforePrint = new TF.Events.Event();
		self.afterPrint = new TF.Events.Event();
		self.onResizePage = new TF.Events.Event();
		self.onInitComplete = new TF.Events.Event();
		self.selectItemClick = self.selectItemClick.bind(self);

		self.saveGroup = self.saveGroup.bind(self);
		self.cancelGroup = self.cancelGroup.bind(self);
		self.closeEditMode = self.closeEditMode.bind(self);

		//Data point panel init.
		self.dataPointGroupHelper = new TF.DetailView.DataPointGroupHelper(self);
		self.dataPointPanel = new TF.DetailView.DataPointPanel(self);

		self.obSliderFontRate = ko.observable(self.defaultSliderFontRate);
		self.obShowSlider = ko.observable(false);

		self.initData();
		//self.initEvents();

		self.pageLevelViewModel = pageLevelViewModel ? pageLevelViewModel : new TF.PageLevel.BasePageLevelViewModel();
		self.basicGridConfig = {
			fieldtrip: { title: "Name", subTitle: "DepartDateTime" },
			contact: { title: "Name", subTitle: "Title" },
			vehicle: { title: "VehicleName", subTitle: "MakeBody" },
			staff: { title: "StaffName", subTitle: "AllStaffTypes" },
			fieldtriplocation: { title: "Name", subTitle: "City"}
		};

		self.obShowSelectorMenu = ko.observable(true);
		self.obShowPrintButton = ko.observable(true);
		self.obShowOpenNewWindowButton = ko.observable(true);

		// this logic is for viewfinder: open layout in new tab, #VIEW-5160
		if (options)
		{
			self.noDefaultLayout = options.noDefaultLayout;

			if (options.mapToolOptions)
			{
				self.options = $.extend(self.options, options);
			}
		}

		self.isReadMode.subscribe(() =>
		{
			if (!self.isReadMode())
			{
				self.restoreMap();
			}
		});

		$(window).off("resize.right-doc");
		$(window).on("resize.right-doc", function()
		{
			setTimeout(function()
			{
				self.updateDetailViewPanelHeader();
			});
		});
	}

	DetailViewViewModel.prototype = Object.create(TF.DetailView.BaseCustomGridStackViewModel.prototype);
	DetailViewViewModel.prototype.constructor = DetailViewViewModel;

	Object.defineProperty(DetailViewViewModel.prototype, "stickyName", {
		get: function()
		{
			return "grid.detailscreenlayoutid." + this.gridType;
		}
	});

	DetailViewViewModel.prototype.restoreMap = function()
	{
		this.rootGridStack.getBlocks().forEach(i => i.restoreFullScreen && i.restoreFullScreen());
	};

	/**
	* Initialize.
	* @param {object} current view model
	* @param {dom} element
	* @returns {void} 
	*/
	DetailViewViewModel.prototype.init = function(model, element)
	{
		var self = this;
		self.$element = $(element);

		TF.DetailView.BaseCustomGridStackViewModel.prototype.init.call(self, { $scrollBody: self.$element });

		self.initValidation();
		self.initBrowserCompatibility();

		let prepareDefaultLayout = null;

		if (!self.noDefaultLayout)
		{
			prepareDefaultLayout = self.initDefaultLayout()
				.then(() =>
				{
					self.applyLayoutTemplate({ isReadMode: true, layoutId: self.getEffectiveDetailLayoutId() })
						.then(() =>
						{
							self.updateDetailViewTitle();
							self.showDetailViewById(self.recordId);
						});
				});
		}

		Promise.resolve(prepareDefaultLayout)
			.then(() =>
			{
				self.onInitComplete.notify();
			});
	};

	/**
	 * Initialization to get default detail view layout.
	 *
	 * @returns
	 */
	DetailViewViewModel.prototype.initDefaultLayout = function()
	{
		var self = this,
			dataTypeId = tf.dataTypeHelper.getId(self.gridType);
		//defaultLayoutName = self.detailViewHelper.getDefaultLayoutNameByType(self.gridType);

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"),
			{
				paramData:
				{
					//"name": defaultLayoutName,
					"dataTypeId": dataTypeId,
					"@fields": "Id,Name",
					"@sort": "Name"
				}
			})
			.then(function(response)
			{
				if (response && Array.isArray(response.Items) && response.Items[0])
				{
					var defaultItem = response.Items[0];

					self.defaultLayout.Id = defaultItem.Id;
					self.defaultLayout.Name = defaultItem.Name;
				}
			});
	};

	/**
	 * Initialization configurations for browser compatibility.
	 *
	 */
	DetailViewViewModel.prototype.initBrowserCompatibility = function()
	{
		var self = this;
		// browser compatibility
		if (window.navigator.userAgent.toLowerCase().indexOf("firefox") > -1)
		{
			self.$element.find(".dropdown-menu ul").css({ "padding-right": "22px" });
			self.$element.find(".dropdown-menu ul li").css({ "width": "calc(100% + 22px)" });
		}
	};

	/** 
	 * Initialize the necessary events.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.initEvents = function()
	{
		var self = this, $document = $(document);

		TF.DetailView.BaseCustomGridStackViewModel.prototype.initEvents.call(self);

		self.$element.on('mousedown.morebuttonmenu', function(e)
		{
			if (!self.$element) return;
			var $target = $(e.target),
				groupButtons = self.$element.find(".group-buttons");

			if (groupButtons.length > 0 && groupButtons.hasClass("open") && $target.closest(".group-buttons").length <= 0)
			{
				groupButtons.removeClass("open");
			}
		});

		self.$element.on("mousedown.contact-grid-rcm", ".k-grid-content table.k-selectable tr", function(e)
		{
			if (!self.isReadMode() || e.button !== 2) return;

			var $target = $(e.currentTarget),
				miniGridType = $target.closest(".custom-grid").attr("mini-grid-type"),
				$visualTarget = $("<div></div>").css({
					position: "absolute",
					left: e.clientX,
					top: e.clientY
				}).appendTo("body");

			var targetBlock;
			var getDataBlock = (array) =>
			{
				var targetBlock = array.reduce((acc, item) =>
				{
					if (acc) return acc;
					if (item instanceof TF.DetailView.DataBlockComponent.TabStripBlock)
					{
						return item.nestedGridStacks.reduce(function(a, gridStack)
						{
							if (a) return a;
							return getDataBlock(gridStack.dataBlocks);
						}, undefined);
					} else
					{
						if ($(e.currentTarget.closest(".grid-stack-item")).hasClass(item.uniqueClassName))
						{
							return item;
						}
					}

				}, undefined);
				return targetBlock;
			};
			switch (miniGridType)
			{
				case "contact":
					if (!self.obIsReadOnly())
					{
						var targetBlock = getDataBlock(self.rootGridStack.dataBlocks);
						tf.contextMenuManager.showMenu($visualTarget,
							new TF.ContextMenu.TemplateContextMenu("workspace/DetailView/MiniGridRightClickMenu",
								new TF.DetailView.MiniGridRightClickMenu(targetBlock, miniGridType, $target)));
					}
					break;
				case "UDGrid":
					targetBlock = null;
					let currentTarget = e.currentTarget;
					const dataBlocks = self.rootGridStack.dataBlocks;
					for (let index = 0; index < dataBlocks.length; index++)
					{
						const dataBlock = dataBlocks[index];
						if (_isTargetGridStackItem(currentTarget, dataBlock))
						{
							targetBlock = dataBlock;
						}
						else if (dataBlock instanceof TF.DetailView.DataBlockComponent.TabStripBlock)
						{
							targetBlock = _getUDGridFromTabStripBlock(currentTarget, dataBlock);
						}

						if (targetBlock != null)
						{
							break;
						}
					}
					tf.contextMenuManager.showMenu($visualTarget,
						new TF.ContextMenu.TemplateContextMenu("workspace/DetailView/UDGridRightClickMenu",
							new TF.DetailView.UDGridRightClickMenu(targetBlock, miniGridType)));
					break;
				default:
					break;
			}

			function _isTargetGridStackItem(currentTarget, dataBlock)
			{
				return $(currentTarget.closest(".grid-stack-item")).hasClass(dataBlock.uniqueClassName);
			}

			function _getUDGridFromTabStripBlock(currentTarget, dataBlock)
			{
				let targetBlock = null;
				if (!currentTarget || !dataBlock || !dataBlock.nestedGridStacks)
				{
					return targetBlock;
				}

				let nestedGridStacks = dataBlock.nestedGridStacks;
				for (let idx = 0; idx < nestedGridStacks.length; idx++)
				{
					const nestedGridStack = nestedGridStacks[idx];
					if (!nestedGridStack.dataBlocks)
					{
						continue;
					}

					let nestedDataBlocks = nestedGridStack.dataBlocks;
					for (let idy = 0; idy < nestedDataBlocks.length; idy++)
					{
						const nestedDataBlock = nestedDataBlocks[idy];
						if (_isTargetGridStackItem(currentTarget, nestedDataBlock))
						{
							targetBlock = nestedDataBlock;
							break;
						}
					}

					if (targetBlock != null)
					{
						break;
					}
				};

				return targetBlock;
			}
		});

		$document.on('contextmenu.rightClickMenu', '.grid-stack-item-content, .hori-line, .verti-line', function(e)
		{
			if (!self.isActive()) return;

			function isNestedItemInTab(dom)
			{
				return $(dom).closest(".grid-stack-item").parents(".tab-strip-stack-item").length > 0 ||
					$(dom).closest(".hori-line").parents(".tab-strip-stack-item").length > 0 ||
					$(dom).closest(".verti-line").parents(".tab-strip-stack-item").length > 0;
			}

			if (isNestedItemInTab(e.currentTarget) && self.isRootGridStackActive())
			{
				return;
			}

			if (isNestedItemInTab(e.currentTarget) && !self.isRootGridStackActive())
			{
				e.stopPropagation();
			}

			var $target = $(e.target);

			if (self.isReadMode && !self.isReadMode() && !$(this).parent().hasClass('beyond-overlay') && self.isGroupMode && !self.isGroupMode())
			{
				var needRCM = !$target.hasClass("uploadedPhoto") && !$target.hasClass("image-stack-item") && !$target.parent().hasClass("image-stack-item"),
					gridstack = self.getActiveGridStack(),
					dataBlocksMenu = new TF.DetailView.DataBlocksMenuViewModel({
						gridType: self.gridType,
						deleteDataBlockEvent: gridstack.deleteDataBlockEvent,
						groupDataBlockEvent: self.groupDataBlockEvent,
						changeDataPointEvent: gridstack.changeDataPointEvent,
						blocks: $.grep(self.dataPointPanel.obAllColumns(), function(item) { return item.title !== "Groups" }),
						target: e.currentTarget,
						toggleResizableEvent: gridstack.toggleResizableEvent,
						defaultColors: self.detailViewHelper.defaultColors,
						needRCM: needRCM,
						// Remove the "new Group from Block" item from RCM when right-clicked target is child of a Tab, ref to the dom dataBlocksContextMenu.cshtml
						isGroupChild: isNestedItemInTab(e.currentTarget),
						event: e
					}, self);

				var contextmenu = new TF.ContextMenu.TemplateContextMenu("workspace/detailview/datablockscontextmenu", dataBlocksMenu, function() { }),
					$virsualTarget = $("<div/>").css(
						{
							position: "absolute",
							left: window.screen.availWidth - e.clientX < 20 ? window.screen.availWidth - 20 : e.clientX,
							top: e.clientY
						}).appendTo("body");

				tf.contextMenuManager.showMenu($virsualTarget, contextmenu);
			}
		});

		// font-size slider
		$document.on('click.slider', '.detail-view-overlay', function(e)
		{
			if (!self.isActive()) return;

			if (self.obShowSlider())
			{
				self.obShowSlider(false);
				$(e.currentTarget).remove();
			}
		});

		$document.on('click.slider', '.slider-container .plus, .slider-container .minus', function(e)
		{
			if (!self.isActive()) return;

			if (!$(e.currentTarget).hasClass('disable'))
			{
				self.obSliderFontRate(self.obSliderFontRate() + ($(e.currentTarget).hasClass("plus") ? 0.25 : -0.25));
			}
		});

		$document.on("keypress.detailViewPanelSubTitle", ".name", function(e)
		{
			if (!self.isActive()) return;

			if (e.keyCode === $.ui.keyCode.ENTER)
			{
				$(e.target).trigger('blur');
			}
		});

		// Could be merged with the next mousedown event
		$document.on("mousedown.detailViewPanelSubTitle", function(e)
		{
			if (!self.isActive()) return;

			var $target = $(e.target);
			if ($target.closest(".sub-title-selector").length === 0 && self.$element.find(".sub-title-selector .dropdown-menu").css("display") !== "none")
			{
				self.$element.find(".sub-title-selector .dropdown-menu").hide();
			}
			if (self.$columnPopup && $target.closest(".iconbutton.layout").length === 0 && $target.closest(".column-selector").length === 0 && self.$columnPopup.css("display") !== "none")
			{
				self.$columnPopup.hide();
			}
		});

		$document.on("mousedown.detailViewPanelSave", function(e)
		{
			if (!self.isActive()) return;

			if ($(e.target).closest(".save-selector").length === 0 && self.$element.find(".save-selector .dropdown-menu").css("display") !== "none")
			{
				self.$element.find(".save-selector .dropdown-menu").hide();
			}
		});

		self.obSliderFontRate.subscribe(function(value)
		{
			if (!self.isActive()) return;

			self.$element.find('.slider-container label').removeClass('disable');
			if (value == 1)
			{
				self.$element.find('.slider-container .plus').addClass('disable');
			}
			else if (value == 0)
			{
				self.$element.find('.slider-container .minus').addClass('disable');
			}

			self.adjustBlockUnitHeight(value);
			self.adjustFontSize(value);
			self.detailViewHelper.updateSectionHeaderTextInputWidth(null, self.$element);
		});

		self.onCloseEditMode.subscribe(function(e, data)
		{
			self.obEditing(false);
			self.checkLayoutChangeAndClose(data && data.switchToLayoutId)
				.then(function(response)
				{
					if (response)
					{
						if (data && data.callback)
						{
							data.callback();
						}
						else if (self.isCreateGridNewRecord)
						{
							self.showDetailViewById();
						}
					}
				});
			self.pageLevelViewModel.clearError();
		});

		self.onResizePage.subscribe(() =>
		{
			self.updateDetailViewGridWidth();
		});

		self.obSelectName.subscribe(function(value)
		{
			tf.storageManager.save("current_detail_layout_name", value, true);
		});

		self.groupDataBlockEvent.subscribe(self.groupDataBlock.bind(self));
	};

	/**
	 * the applied detail layout id
	 */
	DetailViewViewModel.prototype.getEffectiveDetailLayoutId = function()
	{
		return tf.storageManager.get(this.stickyName) || this.defaultLayout.Id;
	}

	DetailViewViewModel.prototype.groupDataBlock = function(e, data)
	{
		var self = this, $block = $(data.target).parents(".grid-stack-item");
		if ($block.length > 0)
		{
			self.dataPointGroupHelper.startGroup($block);
			self.dataPointPanel.startGroup();
		}
	};

	DetailViewViewModel.prototype.saveGroup = function()
	{
		this.dataPointGroupHelper.saveGroup();
		this.dataPointPanel.stopGroup();
	};

	DetailViewViewModel.prototype.cancelGroup = function()
	{
		this.dataPointGroupHelper.stopGroup();
		this.dataPointPanel.stopGroup();
	};

	DetailViewViewModel.prototype.inputFocused = function()
	{
		var self = this;
		self.$element.find("[data-bv-validator=callback]").css("display", "none");
	};

	/**
	 * Update the length of name container.
	 * @param {Object} viewModel 
	 * @param {Event} e
	 * @return {void} 
	 */
	DetailViewViewModel.prototype.updateNameContainer = function(viewModel, e)
	{
		var self = this, $tempDiv, nameInput, name;
		if (!self.$element) { return; }

		nameInput = self.$element.find(".name");
		name = nameInput.val().split(" ").join("&nbsp;");
		if (!name)
		{
			self.$element.find(".name").width(self.INITINPUTWIDTH);
			return;
		}

		$tempDiv = $("<div>");
		$tempDiv.html(name).css({
			fontFamily: "SourceSansPro-Regular",
			fontSize: "21px",
			display: "inline"
		}).appendTo("body");

		self.$element.find(".name").css({
			"width": $tempDiv.width() + 1,
			"maxWidth": self.$element.closest(".detail-view-panel").outerWidth()
		});
		$tempDiv.remove();
	};

	/**
	 * Change the column count of the detail view.
	 * @param {Event} e
	 * @return {void}
	 */
	DetailViewViewModel.prototype.changeColumnsCount = function(e)
	{
		var self = this,
			targetWidth = self.$columnPopup.find(".column-container").index($(e.target).closest(".column-container")) + 1;

		if (self.rootGridStack.getCurrentWidth() == targetWidth)
		{
			self.$columnPopup.hide();
			return;
		}

		self.changeColorTimeout.forEach(function(timer)
		{
			clearTimeout(timer);
		});

		var barriers = self.rootGridStack.getBarriersByTargetWidth(targetWidth);

		if (barriers.length)
		{
			self.rootGridStack.resetBarrierStatus();

			barriers.forEach(function(barrier)
			{
				var content = barrier.find(">.grid-stack-item-content"),
					isLine = barrier.hasClass("verti-line") || barrier.hasClass("hori-line");

				barrier.addClass("decrease-column-count-barrier");

				if (!isLine)
				{
					content.removeClass("animation");
				}

				self.changeColorTimeout.push(setTimeout(function()
				{
					barrier.removeClass("decrease-column-count-barrier");
					if (!isLine)
					{
						content.addClass("animation");
						//animation just for border color changing.
						setTimeout(function()
						{
							content.removeClass("animation");
						}, 1000);
					}
				}, 5000));
			});

			self.pageLevelViewModel.obValidationErrorsSpecifed([{ message: "Remove block" + (barriers.length === 1 ? "" : "s") + " from the right column before decreasing the number of columns." }]);
			self.pageLevelViewModel.obErrorMessageDivIsShow(true);
		}
		else
		{
			self.entityDataModel.layout(self.serializeLayout({ width: targetWidth }));
			self.setStackBlocks();
			self.onColumnChangedEvent.notify(targetWidth);
		}
		self.$columnPopup.hide();
		if (TF.productName === "Viewfinder")
		{
			$(".page-level-message-container").hide();
			$(".detail-view  .page-level-message-container").show();
		}
	};

	/** 
	 * Initialize column popup.
	 *
	 */
	DetailViewViewModel.prototype.initChangeColumnNumberPopup = function()
	{
		var self = this;
		self.$columnPopup = $('<div class="column-selector">\
								<div class="up-arrow"></div>\
								<div class="columns-container">\
									<div class="column-container">\
										<div class="column-item">\
											<table><tr><td><div></div></td></tr></table>\
										</div>\
										<div class="column-title">1 Column</div>\
									</div>\
									<div class="column-container">\
										<div class="column-item">\
											<table><tr><td><div></div></td><td><div></div></td></tr></table>\
										</div>\
										<div class="column-title">2 Columns</div>\
									</div>\
									<div class="column-container">\
										<div class="column-item">\
											<table><tr><td><div></div></td><td><div></div></td><td><div></div></td></tr></table>\
										</div>\
										<div class="column-title">3 Columns</div>\
									</div>\
									<div class="column-container">\
										<div class="column-item">\
											<table><tr><td><div></div></td><td><div></div></td><td><div></div></td><td><div></div></td></tr></table>\
										</div>\
										<div class="column-title">4 Columns</div>\
									</div>\
								</div>\
							</div>');
		self.$columnPopup.find(".column-container").on("click.changeColumn", self.changeColumnsCount.bind(self));
		self.$columnPopup.hide();
		$("body").append(self.$columnPopup);
	};

	/**
	 * Show the column popup.
	 * @param {Object} model 
	 * @param {Event} e
	 * @return {void} 
	 */
	DetailViewViewModel.prototype.showColumnPopup = function(model, e)
	{
		var self = this, width, containers;
		if (!self.$columnPopup)
		{
			self.initChangeColumnNumberPopup();
		}
		else if (self.$columnPopup.is(":visible"))
		{
			self.$columnPopup.hide();
			return;
		}

		width = self.rootGridStack.getCurrentWidth();
		containers = self.$columnPopup.find(".column-container");
		containers.removeClass("active");
		containers.eq(width - 1).addClass("active");
		self.$columnPopup.show();
		self.$columnPopup.position({ my: 'right+55 top+22', at: 'bottom center', of: e.target });
	};

	/**
	 * Init all data on this panel.
	 * @returns {void} 
	 */
	DetailViewViewModel.prototype.initData = function()
	{
		var self = this;

		self.isSaveAsNew = false;

		self.obName = ko.observable("");
		self.obSelectName = ko.observable("Layout Name");
		self.obTitle = ko.observable("");
		self.obSubTitle = ko.observable("");
		self.obRecordPicture = ko.observable(null);
		self.obSubTitleLabel = ko.observable("");
		self.obDataPoints = ko.computed(function()
		{
			var dataPoints = [];
			self.dataPointPanel.obAllColumns().forEach(function(item)
			{
				if (item.title !== "Groups")
				{
					dataPoints = dataPoints.concat(item.columns());
				}
			});
			dataPoints = dataPoints.sort(function(a, b)
			{
				if (a.title.toUpperCase() === b.title.toUpperCase())
				{
					return 0;
				}
				return a.title.toUpperCase() > b.title.toUpperCase() ? 1 : -1;
			});

			return dataPoints;
		});
		self.obDataPointsForSubTitle = ko.computed(function()
		{
			var excludeList = ["grid", "file", "map", "calendar", "schedule", "recordpicture", 'address', 'locationaddress', 'treelist', 'multiplegrid'];

			return self.obDataPoints().filter(function(item)
			{
				if (!item.type) return false;//RW-6347
				return excludeList.indexOf(item.type.toLowerCase()) === -1;
			});
		});
	};

	/**
	 * Initialize detail view header buttons.
	 *
	 */
	DetailViewViewModel.prototype.initButtons = function()
	{
		var self = this,
			visible = !self.isCreateGridNewRecord;
		self.obShowPrintButton(visible);
		self.obShowOpenNewWindowButton(visible);
		self.obShowSelectorMenu(visible);
	};

	/**
	 * Validation initialization.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.initValidation = function(model, element)
	{
		var self = this,
			validatorFields = {},
			isValidating = false;

		validatorFields.name = {
			trigger: "blur",
			validators:
			{
				callback: {
					message: "Name already exists",
					callback: function(value, validator, $field)
					{
						if (!value)
						{
							return true;
						}

						return self.detailViewHelper.isLayoutTemplateNameUnique({
							name: value,
							dataTypeId: tf.dataTypeHelper.getId(self.gridType),
						}, self.isSaveAsNew ? self.detailViewHelper.NEW_LAYOUT_ID : (self.entityDataModel.id() || self.detailViewHelper.NEW_LAYOUT_ID));
					}
				}
			}
		};

		self.$element.bootstrapValidator(
			{
				excluded: [':hidden', ':not(:visible)'],
				live: 'enabled',
				message: 'This value is not valid',
				fields: validatorFields
			}).on('success.field.bv', function(e, data)
			{
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate(data.element).then(function()
					{
						isValidating = false;
					});
				}
			});

		if (self.pageLevelViewModel)
		{
			self.pageLevelViewModel.load(self.$element.data("bootstrapValidator"));
		}
	};

	/**
	 * Change data which will be display on this panel.
	 * @param {boolean} isReadMode check display read or edit view on this panel
	 * @param {number} layoutId selected detail screen id
	 * @param {boolean} isDeleted
	 * @param {boolean} isNew new a layout template
	 * @param {object} layoutTemplate layout template entity
	 * @returns {void} 
	 */
	DetailViewViewModel.prototype.applyLayoutTemplate = function(options)
	{
		var self = this,
			isReadMode = options.isReadMode,
			layoutId = options.layoutId,
			isDeleted = options.isDeleted,
			isNew = options.isNew,
			layoutTemplate = options.layoutTemplate;

		if (!isDeleted)
		{
			self.isReadMode(isReadMode);
			// in edit mode, grid need more space at bottom so that user can move block to bottom.
			self.grid.reserveSpaceAtBottom(!isReadMode);
		}

		var requestPromise = null;
		if (layoutTemplate)
		{
			requestPromise = layoutTemplate;
		}
		else if (!isNew && layoutId)
		{
			// user want to display record by a new layout template
			requestPromise = self.getLayoutById(layoutId).then(res => res.Items[0]);
		}

		this.thematicInfo = null;
		this.legendStatus = null;

		return Promise.resolve(requestPromise)
			.then(function(rec)
			{
				var recordId = rec ? rec.Id : null;
				if (rec && TF.isMobileDevice)
				{
					var layout = JSON.parse(rec.Layout);
					var newLayoutWidth = TF.isPhoneDevice ? 1 : 2;
					layout = TF.DetailView.DetailViewHelper.changeLayoutWidth(layout, newLayoutWidth);
					rec.Layout = JSON.stringify(layout);
				}

				self.doApply(rec, isDeleted);
				tf.storageManager.save(self.stickyName, recordId);
			})
			.catch(function(error)
			{
				tf.storageManager.save(self.stickyName, null);
				console.log(error);
			});
	};

	DetailViewViewModel.prototype.getLayoutById = function(layoutId)
	{
		var self = this;

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"), {
			paramData: { "@filter": `eq(DataTypeId,${tf.dataTypeHelper.getId(self.gridType)})` }
		}).then(function(response)
		{
			if (response && response.Items)
			{
				var matched = response.Items.find(x => x.Id == layoutId);
				if (matched)
				{
					response.Items = response.Items.filter(x => x.Id != layoutId);
					response.Items.unshift(matched);
				}
				else
				{
					response.Items.sort(function(a, b)
					{
						return a.Name > b.Name ? 1 : -1;
					});
				}
			}

			return response;
		});
	};

	DetailViewViewModel.prototype.doApply = function(layoutTemplate, isDeleted)
	{
		var self = this, gridType = self.gridType;

		if (layoutTemplate)
		{
			layoutTemplate = self.detailViewHelper.formatLayoutTemplate(layoutTemplate);
		}

		if (layoutTemplate && !layoutTemplate.SubTitle && tf.dataTypeHelper.getId(gridType) === layoutTemplate.dataTypeId)
		{
			layoutTemplate.SubTitle = self.basicGridConfig[gridType].subTitle;
		}

		self.entityDataModel = new TF.DataModel.DetailScreenLayoutDataModel(layoutTemplate);

		//self.obSubTitle(layoutTemplate && layoutTemplate.SubTitle || self.basicGridConfig[gridType].subTitle)
		self.obSubTitle(self.detailViewHelper.tryConvertUDFSubTitle(layoutTemplate && layoutTemplate.SubTitle || self.basicGridConfig[gridType].subTitle));
		if (!layoutTemplate)
		{
			self.entityDataModel.subTitle(self.basicGridConfig[gridType].subTitle);
		}

		if (!self.isReadMode() && !isDeleted)
		{
			var defaultPictureSrc = self.detailViewHelper.getDefaultRecordPicture(self.gridType);
			self.obName(self.entityDataModel.name());
			self.obRecordPicture(defaultPictureSrc ? ("url(" + defaultPictureSrc + ")") : "");
		}

		self.obSelectName(layoutTemplate ? self.entityDataModel.name() : "Layout Name");
		self.layoutTemplateBeforeEditing = self.entityDataModel.toData();
	};

	/**
	 * Show information in detail view panel in read mode by Id.
	 * @param {number} recordId The entity's Id
	 * @returns {Promise}
	 */
	DetailViewViewModel.prototype.showDetailViewById = function(recordId, gridType, layoutId, isReadOnly, options)
	{
		var self = this,
			promiseTask = null,
			gridType = gridType || self.gridType;

		if (typeof isReadOnly === "boolean")
		{
			self.obIsReadOnly(isReadOnly);
		}

		if (options)
		{
			self.options = options;
		}

		// If recordId not specified, start create new mode.
		if (!recordId)
		{
			self.startCreateNewMode();
			promiseTask = Promise.all([self.updateGridType(gridType), self.userDefinedFieldHelper.get(gridType, true)])
				.then(function(values)
				{
					self._userDefinedFields = values[1];

					self.recordEntity = null;
					self.openDetailViewInNewTab();
				});
		}
		else
		{
			if (layoutId === undefined)
			{
				self.startReadMode();
			}

			self.recordId = recordId;
			self.stopCreateNewMode();
			promiseTask = Promise.all([
				self.updateGridType(gridType),
				self.userDefinedFieldHelper.get(gridType),
			]).then(function(values)
			{
				return self.getRecordEntity(gridType, recordId).then(function(recordEntity)
				{
					if (!recordEntity) { return; }

					self.recordEntity = recordEntity;
					self._userDefinedFields = values[1];
					var recordPic = recordEntity.RecordPicture;
					self.obRecordPicture(recordPic && recordPic !== 'None' ? 'url(data:' + recordPic.MimeType + ';base64,' + recordPic.FileContent : "");
					self.updateDetailViewTitle(recordEntity);
					self.openDetailViewInNewTab();

					return self.loadCalendarData(recordId, recordEntity);
				});
			});
		}

		return promiseTask.then(function()
		{
			// Update UDF required state
			tf.helpers.detailViewHelper.updateUDFRequiredFields(self.gridType);

			self.setStackBlocks(self.options);
			self.onColumnChangedEvent.notify(self.rootGridStack.getCurrentWidth());

			self.refreshEditStatus();

			self.highlightRequiredFieldByAsterisk();
		});
	};

	/**
	 * Start read mode in detail view.
	 *
	 */
	DetailViewViewModel.prototype.startReadMode = function()
	{
		var self = this;
		if (!self.isReadMode())
		{
			self.isReadMode(true);
			self.closeEditMode();
		}
	};

	DetailViewViewModel.prototype.startCreateNewMode = function()
	{
		var self = this;
		TF.DetailView.BaseCustomGridStackViewModel.prototype.startCreateNewMode.call(self);

		self.initButtons();
		self.obTitle('New ' +  tf.applicationTerm.getApplicationTermSingularByName(tf.dataTypeHelper.getFormalDataTypeName(self.gridType)));
		self.obSubTitleLabel('');
		self.obRecordPicture(null);
		self.startReadMode();
	};

	DetailViewViewModel.prototype.stopCreateNewMode = function()
	{
		TF.DetailView.BaseCustomGridStackViewModel.prototype.stopCreateNewMode.call(this);

		this.initButtons();
	};

	DetailViewViewModel.prototype.openDetailViewInNewTab = function()
	{
		if (window.opener && window.name.indexOf("new-detailWindow") >= 0)
		{
			this.hideExtraElement();
		}
	};

	/**
	 * Get the record entity by type and id.
	 * @param {String} gridType
	 * @param {Number} recordId
	 */
	DetailViewViewModel.prototype.getRecordEntity = function(gridType, recordId)
	{
		var self = this;
		// if data requesting for this record is pending, don't send another request for the same one.
		if (self.pendingLoadRecordEntityId === recordId && self.pendingLoadRecordEntityType === gridType)
		{
			return Promise.resolve(null);
		}

		self.pendingLoadRecordEntityId = recordId;
		self.pendingLoadRecordEntityType = gridType;
		return TF.DetailView.BaseCustomGridStackViewModel.prototype.getRecordEntity.call(self, gridType, recordId)
			.then(function(response)
			{
				self.pendingLoadRecordEntityId = null;
				self.pendingLoadRecordEntityType = null;

				return response;
			});
	};

	/**
	 * Update the grid type.
	 * @param {String} gridType
	 * @return {Promise}
	 */
	DetailViewViewModel.prototype.updateGridType = function(gridType)
	{
		var self = this;
		if (self.gridType !== gridType)
		{
			self.gridType = gridType;
			self.pendingDataPointRefreshing = self.dataPointPanel.refreshData().then(function()
			{
				var savedTemplateId = self.getEffectiveDetailLayoutId();
				return self.applyLayoutTemplate({ isReadMode: true, layoutId: savedTemplateId }).then(function()
				{
					self.pendingDataPointRefreshing = null;
				});
			});
		}

		return self.pendingDataPointRefreshing ? self.pendingDataPointRefreshing : Promise.resolve();
	};

	/**
	 * hide extra element for new Window.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.hideExtraElement = function()
	{
		$("body").css("min-width", "585px");
		$(".doc .left-doc").hide();
		$(".right-doc").css({ width: "100%" });
		$(".detail-view-panel.right-panel").css({ display: "block", width: "100%" });
		$(".buttons .iconbutton.new-window").addClass("hide");
		$(".buttons .iconbutton.close-detail").addClass("hide");
		$(".buttons .iconbutton.print").css("margin-left", "20px");
		$(".group-buttons .iconbutton.new-window").parents("li").hide();
		$(".group-buttons .iconbutton.close-detail").parents("li").hide();
		$(".resize-handler.ui-draggable").addClass("hide");
		$(".detail-header.width-enough").find($(".resize-handler.ui-draggable")).addClass("hide");
		$(".doc-selector").hide();
		// Viewfinder
		$(".page-container").css("width", "100%");
		$(".selector-menu").css("margin-left", "36px");
		$(".sliderbar-button-wrap.ui-draggable").addClass("hide");
		$(".detail-header.width-enough").find($(".sliderbar-button-wrap.ui-draggable")).addClass("hide");
		this.updateDetailViewPanelHeader();
	};

	/**
	 * Update detail view title as default.
	 *
	 */
	DetailViewViewModel.prototype.updateDetailViewTitleWithDataPoint = function()
	{
		this.updateDetailViewTitle(this.getDefaultRecordForEditMode());
	};

	/**
	 * Get default record entity for edit mode.
	 *
	 * @returns
	 */
	DetailViewViewModel.prototype.getDefaultRecordForEditMode = function()
	{
		var record = {},
			dataPoints = dataPointsJSON[this.gridType];

		_.flatMap(dataPoints).forEach(function(dataPoint)
		{
			if (!dataPoint.UDFId)
			{
				record[dataPoint.field] = dataPoint.defaultValue;
			}
		});

		record.UserDefinedFields = dataPoints["User Defined"];

		return record;
	};

	/**
	 * Update the detail view's title and subTitle.
	 * @param {Object} entity 
	 */
	DetailViewViewModel.prototype.updateDetailViewTitle = function(entity)
	{
		var self = this, subTitleLabel = "", titleLabel = "", subTitleDataPoint,
			gridType = self.gridType,
			layoutTemplate = self.entityDataModel.toData(),
			gridConfig = self.basicGridConfig[gridType] || {},
			// subTitleFieldName = layoutTemplate.SubTitle || gridConfig.subTitle;
			subTitleFieldName = self.detailViewHelper.tryConvertUDFSubTitle(layoutTemplate.SubTitle || gridConfig.subTitle);
		// only read mode has entity.
		if (entity)
		{
			titleLabel = tf.dataTypeHelper.getEntityName(gridType, entity);

			if (subTitleFieldName)
			{
				if (subTitleFieldName === "(none)")
				{
					subTitleDataPoint = null;
					subTitleLabel = "";
				}
				else
				{
					subTitleDataPoint = self.detailViewHelper.getDataPointByIdentifierAndGrid(subTitleFieldName, self.gridType);
					if (subTitleDataPoint)
					{
						var subtitleValue = entity[subTitleFieldName];
						if (subTitleDataPoint.UDFId)
						{
							entity.UserDefinedFields.forEach(function(udf)
							{
								if (udf.field === subTitleFieldName)
								{
									subtitleValue = udf.defaultValue;
									return false;
								}
								// else if (udf.DisplayName === subTitleFieldName)
								else if (udf.Id === subTitleFieldName)
								{
									subtitleValue = udf.RecordValue;
									return false;
								}
							});
							subTitleLabel = self.detailViewHelper.formatDataContent(subtitleValue, subTitleDataPoint.type, subTitleDataPoint.format, subTitleDataPoint);
						} else
						{
							subTitleLabel = self.detailViewHelper.formatDataContent(subtitleValue, subTitleDataPoint.type, subTitleDataPoint.format);
						}
					}
				}
			}
		}

		self.obTitle(titleLabel);
		self.obSubTitle(subTitleFieldName);
		self.obSubTitleLabel(subTitleLabel);

		self.updateDetailViewPanelHeader();
	};

	/**
	 * Get the default subtitle value with specified field name.
	 * @param {String} fieldName 
	 * @return {String}
	 */
	DetailViewViewModel.prototype.getSubtitleDefaultValueByFieldName = function(fieldName)
	{
		var self = this,
			dataPoint = self.detailViewHelper.getDataPointByIdentifierAndGrid(fieldName, self.gridType);

		return self.detailViewHelper.formatDataContent(dataPoint.defaultValue, dataPoint.type, dataPoint.format);
	};

	/**
	 * Check if the layout include all required data fields.
	 *
	 * @param {boolean} requireSendingRequest
	 * @returns
	 */
	DetailViewViewModel.prototype.getActiveLayoutData = function(requireSendingRequest)
	{
		let self = this,
			dataType = self.gridType,
			getLayout = requireSendingRequest
				? self.detailViewHelper.fetchActiveLayoutData(dataType)
				: self._getLayoutObjInCache(null);

		return Promise.resolve(getLayout);
	};

	/**
	 * After browser resize.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.resizeDetailView = function()
	{
		var self = this;
		if (!self.$element)
		{
			return;
		}
		if (window.innerWidth < document.body.scrollWidth)
		{
			var SCROLL_HEIGHT = window.innerHeight - document.body.offsetHeight;
			self.$element.find(".container-fluid").css("height", "calc(100vh - " + ((self.isReadMode() ? 56 : 112) + SCROLL_HEIGHT + (self.isGroupMode() ? 56 : 0)) + "px)");
			self.$element.find(".sub-title-selector ul").css("max-height", "calc(100vh - " + (93 + SCROLL_HEIGHT) + "px)");
		}
		else
		{
			self.$element.find(".container-fluid").css("height", "");
			self.$element.find(".sub-title-selector ul").css("max-height", "");
		}

		self.$element.find('.detail-view-panel').trigger('detail-view-panel-resize');
		self.updateDetailViewGridWidth();
	};

	/**
	 * Add blocks by data source.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.addStackBlocks = function(layout, isTab)
	{
		var self = this,
			rate = layout.sliderFontRate || self.defaultSliderFontRate;

		TF.DetailView.BaseCustomGridStackViewModel.prototype.addStackBlocks.call(self, layout, isTab);

		self.obSliderFontRate(rate);
		self.adjustFontSize(rate);
	};

	DetailViewViewModel.prototype.existChangeWarning = function(layoutId)
	{
		var self = this,
			gridName = self._getGridName(),
			gridLabel = tf.applicationTerm.getApplicationTermSingularByName(gridName),
			layoutName = self.obName(),
			confirmMsg = String.format("Do you want to close {0} edit mode ({1}) without saving?", gridLabel, layoutName);

		return self.showConfirmation(confirmMsg)
			.then(function(result)
			{
				if (result)
				{
					if (layoutId === undefined)
					{
						self.dataPointPanel.closeClick();
					}

					return self.applyLayoutTemplate({ isReadMode: true, layoutId: layoutId || self.getEffectiveDetailLayoutId() }).then(function()
					{
						return self.showDetailViewById(self.recordId, null, layoutId);
					}).then(function()
					{
						return result;
					});
				}

				return Promise.resolve(result);
			});
	}

	DetailViewViewModel.prototype.showConfirmation = function(message)
	{
		return tf.promiseBootbox.yesNo({
			message: message,
			title: "Confirmation Message"
		});
	};

	/**
	 * Open the manage layouts modal.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.openManageLayouts = function(model, e)
	{
		var self = this,
			manageModal = new TF.DetailView.ManageDetailScreenLayoutModalViewModel(self.gridType, self.entityDataModel.id(), true);

		tf.modalManager.showModal(manageModal)
			.then(result =>
			{
				if (result && result.data)
				{
					var data = result.data;
					if (result.isOpenTemp)
					{
						self.exitEditing()
							.then(result =>
							{
								if (!result) return;

								self.dataPointPanel.updateDataPoints().then(() => self.handleModifyItemEvent(data));
							});
					}
					else
					{
						self.onCloseEditMode.notify({
							switchToLayoutId: data.id,
							callback: function()
							{
								if (!data.isDeleted)
								{
									tf.storageManager.save(self.stickyName, data.selectId);
								}
								else
								{
									tf.storageManager.delete(self.stickyName);
								}

								self.dataPointPanel.closeClick();
								self.applyLayoutTemplate({ isReadMode: true, layoutId: data.selectId })
									.then(() =>
									{
										self.showDetailViewById(self.recordId);
									});
							}
						});
					}
				}
			});
	};

	/**
	 * Before save function.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.preSave = function(model, e)
	{
		const self = this;

		if (self.entityDataModel.id())
		{
			$(e.currentTarget).next(".dropdown-menu").show();
		}
		else
		{
			self.save();
		}
	};

	DetailViewViewModel.prototype.saveDetail = function()
	{
		var self = this,
			DataTypeId = self.entityDataModel.dataTypeId(),
			entityId = self.entityDataModel.id(),
			requestData = {
				ID: 0,
				Name: (self.entityDataModel.name() || "").trim(),
				SubTitle: self.entityDataModel.subTitle(),
				Layout: self.entityDataModel.layout(),
				DataTypeId: DataTypeId
			}

		if (!self.isSaveAsNew && entityId)
		{
			requestData.ID = Number(entityId);
		}

		return requestData.ID ? tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens", requestData.ID),
			{
				data: requestData
			}) : tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"),
				{
					data: [requestData]
				});
	}

	/**
	 * Save detail screen entity.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.save = function(model, e)
	{
		var self = this,
			menu = e ? $(e.currentTarget).parents('.type-selector').find(".dropdown-menu") : null;

		if (menu) { menu.hide(); }

		self.updateLayoutTemplate();

		const layoutName = self.obName();
		let prepare = layoutName
			? self.pageLevelViewModel.saveValidate()
			: tf.modalManager.showModal(new TF.Modal.SaveTemplateNameModalViewModel(self.entityDataModel))
				.then(name =>
				{
					if (name)
					{
						self.entityDataModel.name(name);
						self.updateNameContainer();
					}

					return Boolean(name);
				});

		return Promise.resolve(prepare)
			.then((res) =>
			{
				if (!res) return;

				let validateLayout = true;

				const layoutData = self._getLayoutObjInCache();
				const dataType = self.gridType;
				const missingFields = tf.helpers.detailViewHelper.validateRequiredFields(layoutData, dataType);

				if (missingFields.length > 0)
				{
					validateLayout = tf.promiseBootbox.yesNo("This details view does not contain all required fields and cannot be used to add new records.  Are you sure you want to save?", "Save Layout");
				}

				return Promise.resolve(validateLayout)
					.then(shouldProceed =>
					{
						if (!shouldProceed) return;

						return self.saveDetail()
							.then(apiResponse =>
							{
								if (apiResponse && apiResponse.Items && apiResponse.Items[0])
								{
									var dataItem = apiResponse.Items[0];

									self.dataPointPanel.closeClick();

									if (!self.recordId)
									{
										const layoutData = JSON.parse(dataItem.Layout);
										const errMsg = tf.helpers.detailViewHelper.checkLayoutEligibilityToCreateNew(layoutData, dataType);

										if (errMsg)
										{
											self.onCloseDetailEvent.notify({ forceClose: true });
											return;
										}
									}

									return self.applyLayoutTemplate({ isReadMode: true, layoutId: dataItem.Id, layoutTemplate: dataItem })
										.then(() =>
										{
											self.updateDetailViewTitle();
											self.showDetailViewById(self.recordId);
											tf.storageManager.save(self.stickyName, dataItem.Id);
										});
								}
							}).catch(error =>
							{
								throw new Error('error occurred.');
							});

					});

			})
			.then(() =>
			{
				self.isSaveAsNew = false
			});
	};

	/**
	 * Save detail screen to a new entity.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.saveAsNew = function(model, e)
	{
		var self = this;
		self.isSaveAsNew = true;
		self.save(model, e);
	};

	/**
	 * 
	 * @param {number} targetLayoutId
	 * @returns {Promise}
	 */
	DetailViewViewModel.prototype.checkLayoutChangeAndClose = function(targetLayoutId)
	{
		const self = this;
		self.updateLayoutTemplate();

		const currentEntity = self.entityDataModel.toData();

		if (currentEntity.Name !== "" &&
			self.isLayoutTemplateChanged(self.layoutTemplateBeforeEditing, currentEntity))
		{
			return self.existChangeWarning(targetLayoutId)
				.then(result =>
				{
					if (result)
					{
						self.obName('');
						self.dataPointPanel.closeClick();
					}
					return result;
				});
		}
		else
		{
			self.dataPointPanel.closeClick();

			const activeLayoutId = self.getEffectiveDetailLayoutId();

			if (activeLayoutId)
			{
				return self.applyLayoutTemplate({ isReadMode: true, layoutId: activeLayoutId })
					.then(() =>
					{
						return self.showDetailViewById(self.recordId);
					})
					.then(() =>
					{
						return true;
					});
			}
		}

		return Promise.resolve(true);
	}

	/**
	 * Update detail screen template.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.updateLayoutTemplate = function(layout)
	{
		var self = this;
		self.entityDataModel.name(self.obName());
		self.entityDataModel.subTitle(self.obSubTitle());
		self.entityDataModel.layout(layout ? layout : self.serializeLayout());
		self.entityDataModel.dataTypeId(tf.dataTypeHelper.getId(self.gridType));
	};

	/**
	 * serialize the layout to JSON. 
	 * 
	 * when save detail view template and drag data point to detail view panel, this function will be invoked.
	 * 
	 * When user drag a data point to detail view edit mode panel 
	 * if a data point group dragged, $el.attr("type") === "group"
	 * if a data point which contained in a group dragged, $el.attr("isgroupitem")
	 * 
	 * @returns {JSON}
	 */
	DetailViewViewModel.prototype.serializeLayout = function(options)
	{
		var self = this;
		var data = TF.DetailView.BaseCustomGridStackViewModel.prototype.serializeLayout.call(this, options);
		data.sliderFontRate = this.obSliderFontRate();
		data.version = this.dataPointsJSONVersion || dataPointsJSONVersion;
		return JSON.stringify(data);
	}

	/**
	 * Open the subtitle menu.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.subtitleMenuClick = function(model, e)
	{
		var self = this, menu = $(e.currentTarget).find(".dropdown-menu");

		if (self.searchTextFocused)
		{
			clearTimeout(self.clearFocusTimeout);
			self.setSearchInputCursor();
		}

		menu.show();
	};

	/**
	 * Select a subtitle on the subtitle menu.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.selectItemClick = function(model, e)
	{
		var self = this,
			menu = $(e.currentTarget).parents('.type-selector').find(".dropdown-menu"),
			selectedField = model.UDFId == null ? model.field : model.UDFId;

		if (!!selectedField)
		{
			self.obSubTitle(selectedField);
			self.obSubTitleLabel(self.getSubtitleDefaultValueByFieldName(selectedField));
		}
		else
		{
			// select nothing.
			self.obSubTitle("(none)");
			self.obSubTitleLabel("");
		}
		menu.hide();
		e.stopPropagation();
	};

	DetailViewViewModel.prototype.closeTemplateMenu = function(model, e)
	{
		function validIsNotDetailScreenContextMenuClicked(e) 
		{
			if (!e)
			{
				return !e;
			}

			if (navigator.userAgent.indexOf('Firefox') >= 0) 
			{
				return $(e.relatedTarget).closest(".detail-screen-contextmenu").length <= 0;
			}

			return $(e.toElement).closest(".detail-screen-contextmenu").length <= 0;
		}

		if (validIsNotDetailScreenContextMenuClicked(e) &&
			(tf.contextMenuManager.contextMenu && tf.contextMenuManager.contextMenu.$menuContainer &&
				tf.contextMenuManager.contextMenu.$menuContainer.length && tf.contextMenuManager.contextMenu.$menuContainer.find('>div.detail-screen-contextmenu').length))
		{
			tf.contextMenuManager.dispose();
		}

		this.$element.find("li.expand-templates").off("mouseleave");
		this.$element.find("li.expand-templates").off("mouseenter");
		this.$element.find("li.expand-templates").on("mouseenter", function(e)
		{
			this.templateMenuClick(this, e);
		}.bind(this));
	};

	/**
	 * The event of details screen layout icon click.
	 * @param {object} viewModel The viewModel of this modal.
	 * @param {event} e The click event.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.templateMenuClick = function(viewModel, e)
	{
		var self = this, target = $(e.currentTarget),
			isFromMoreButton = target.closest(".selector-menu").length <= 0,
			options = { gridType: self.gridType };

		if (isFromMoreButton &&
			tf.contextMenuManager &&
			tf.contextMenuManager.isVisibleMenu(".detail-screen-contextmenu"))
		{
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		if (isFromMoreButton)
		{
			if (TF.isMobileDevice)
			{
				options.top = 0;
			}
			else
			{
				options.movingDistance = 0;
				options.top = 0 - target.outerHeight();
			}
			self.$element.find("li.expand-templates").off("mouseenter");
		}
		else
		{
			options.movingDistance = target.outerWidth();
			options.top = -24;
		}

		options.dispose = () =>
		{
			var selector = "#" + detailViewContextMenuOverlayId;
			if ($(selector).length)
			{
				hideGroupButtonsMenu(self.$element);
			}
		};

		options.afterRender = () => 
		{
			if (isFromMoreButton && TF.isMobileDevice)
			{
				appendContextMenuOverlayOnPhoneDevice(target, function()
				{
					self.closeTemplateMenu(self, e);
				});
			}
		};

		var layoutMenu = new TF.DetailView.LayoutMenuViewModel(options, self);
		layoutMenu.loadingFinishEvent.subscribe(() =>
		{
			var contextmenu = new TF.ContextMenu.TemplateContextMenu(
				"workspace/detailview/detailscreenlayoutcontextmenu",
				layoutMenu
			);

			layoutMenu.modifyItemEvent.subscribe((e, data) =>
			{
				self.exitEditing()
					.then(result =>
					{
						if (!result) return;

						self.dataPointPanel.updateDataPoints().then(() => self.handleModifyItemEvent(data));
					});
			});

			layoutMenu.selectItemEvent.subscribe((e, id) =>
			{
				self.exitEditing()
					.then(result =>
					{
						self.closeTemplateMenu(self, e);
						if (result)
						{
							self.restoreMap();
							self.applyLayoutTemplate({ isReadMode: true, layoutId: id, })
								.then(() =>
								{
									self.showDetailViewById(self.recordId);
								});
						}
					});
			});

			// tf.pageManager.showContextMenu(e.currentTarget);
			tf.contextMenuManager.showMenu(e.currentTarget, contextmenu);

			if (isFromMoreButton)
			{
				self.$element.find("li.expand-templates").on("mouseleave", function(e)
				{
					self.closeTemplateMenu(self, e);
				});
			}
		});
		//RW-11733 sync the layout name after another user change it
		layoutMenu.syncItemDataEvent.subscribe((e, data) =>
		{
			self.obSelectName(data.Name);
			self.entityDataModel.name(data.Name);
			self.layoutTemplateBeforeEditing.Name = data.Name;
		});
	};

	DetailViewViewModel.prototype.handleModifyItemEvent = function(data)
	{
		let self = this;

		data = data || {};

		self.applyLayoutTemplate({ isReadMode: false, layoutId: data.id, isDeleted: data.isDeleted, isNew: data.isNew })
			.then(() =>
			{
				self.updateDetailViewTitleWithDataPoint();
				self.setStackBlocks();
				self.updateNameContainer();
				if (!data.isDeleted)
				{
					//self.onToggleDataPointPanelEvent.notify(self.dataPointPanel);
					self.toggleDataPointPanel(self.dataPointPanel);
					var timeInterval = setInterval(() =>
					{
						if ($(self.grid.opts.removable).length > 0)
						{
							clearInterval(timeInterval);
							self.rootGridStack.setRemovingBound();
						}
					}, 50);
				}
				self.dataPointPanel.updateDataPoints(self._getLayoutObjInCache().items);
			});
	};

	function hideGroupButtonsMenu(selfElement)
	{
		var $openedGroupButtons = selfElement.find('.group-buttons.open');
		if ($openedGroupButtons.length)
		{
			$openedGroupButtons.removeClass('open');
		}
		removeContextMenuOverlay();
	}

	var detailViewContextMenuOverlayId = "detail-view-context-menu-overlay";
	function appendContextMenuOverlayOnPhoneDevice($target, func)
	{
		if (!TF.isMobileDevice || !$target || !$target.length)
		{
			return;
		}

		if (TF.isPhoneDevice)
		{
			$target.addClass("detail-view-layout-menu-opened-on-phone");
		}

		var $moreButton = $target.closest(".group-buttons.open");
		if ($moreButton && $moreButton.length)
		{
			$target = $moreButton;
		}


		var selector = "#" + detailViewContextMenuOverlayId;
		if ($(selector).length)
		{
			$(selector).remove();
		}

		var $contextMenuOverlay = $("<div id='" + detailViewContextMenuOverlayId + "'></div>");
		$contextMenuOverlay.on("touchstart", func);
		$target.parent().append($contextMenuOverlay);
	}

	function removeContextMenuOverlay()
	{
		var selector = "#" + detailViewContextMenuOverlayId;
		if ($(selector).length)
		{
			$(selector).remove();

			if (TF.isPhoneDevice)
			{
				var $layoutMenuItem = $(".detail-view-layout-menu-opened-on-phone");
				if ($layoutMenuItem && $layoutMenuItem.length)
				{
					$layoutMenuItem.removeClass("detail-view-layout-menu-opened-on-phone");
				}
			}
		}

	}

	/**
	 * @param {*} model
	 * @param {*} e
	 */
	DetailViewViewModel.prototype.showSlider = function(model, e)
	{
		var self = this;
		self.obShowSlider(true);
		self.$element.find('.slider-container').position({ my: 'right+70 top+30', at: 'bottom center', of: e.target });
		if ($('.detail-view-overlay').length === 0)
		{
			var $overlay = $("<div></div>", { class: "detail-view-overlay" });
			$overlay.append($("<div></div>", { class: "detail-view-background" }));
			$('body').append($overlay);
		}
	}

	/**
	 * Update the grid width.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.updateDetailViewGridWidth = function()
	{
		if (this.fitContainerTimer != null)
		{
			clearTimeout(this.fitContainerTimer);
		}

		this.fitContainerTimer = setTimeout(function()
		{
			this.rootGridStack.dataBlocks.forEach((dataBlock) =>
			{
				if (dataBlock.lightKendoGrid)
				{
					dataBlock.lightKendoGrid.fitContainer();
				}

				if (dataBlock.nestedGridStacks)
				{
					dataBlock.nestedGridStacks.forEach(function(gridstack, i)
					{
						gridstack.dataBlocks.forEach(function(dataBlock)
						{
							if (dataBlock.lightKendoGrid)
							{
								dataBlock.lightKendoGrid.fitContainer();
							}
						});
					});
				}

			});
			this.fitContainerTimer = null;
		}.bind(this), 50);
	}

	/**
	 * Update the header display.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.updateDetailViewPanelHeader = function()
	{
		// check: this function will be called twice when open a record detail view.
		var self = this;
		var $element = self.$element;
		if (!$element || $element.css("display") === "none" || !self.isReadMode())
		{
			return;
		}
		self.closeTemplateMenu(self, null);
		var isWidthEnough,
			$header = $element.find(".detail-header"),
			$title = $header.find(".head-text:not(.hide)"),
			$picture = $header.find(".head-picture:not(.hide)"),
			$buttons = $header.find(".buttons"),
			$selectorMenu = $header.find(".selector-menu");

		$header.find('.group-buttons').removeClass('open');
		$header.addClass("width-enough");
		$buttons.css("width", "auto");
		$buttons.css("maxWidth", "none");
		$title.css("width", "auto");

		var $selectorMenuSelectType = $selectorMenu.find(".select-type");
		$selectorMenuSelectType.css("overflow", "initial");

		var marginWidth = 32;
		var buffer = 1;
		var headerWidth = $header.outerWidth(),
			pictureWidth = $picture.length > 0 ? $picture.outerWidth() : 0,
			titleWidth = $title.outerWidth(),
			buttonsWidth = $buttons.outerWidth();

		isWidthEnough = headerWidth > (pictureWidth + titleWidth + buttonsWidth + buffer + marginWidth);
		$selectorMenuSelectType.css("overflow", "");
		$title.css("width", "");
		$buttons.css("width", "");
		$buttons.css('maxWidth', isWidthEnough ? buttonsWidth + buffer : "none");

		$header.toggleClass("width-enough", !TF.isPhoneDevice && isWidthEnough);
	};

	/**
	 * The event handler when "more" button is clicked.
	 * @param {Object} data
	 * @param {Event} e
	 * @return {void}
	 */
	DetailViewViewModel.prototype.onHeaderMoreButtonClick = function(data, e)
	{
		removeContextMenuOverlay();
		$(e.target).closest(".group-buttons").toggleClass("open");
	};

	/**
	 * The new Window function.
	 * @param {Object} data
	 * @param {Event} e
	 * @return {void}
	 */
	DetailViewViewModel.prototype.newWindowClick = function(data, e)
	{
		if (e.button === 0)
		{
			window.open(`#/?id=${data.recordId}&gridtype=${this.gridType}`, "new-detailWindow_" + $.now());
		}
	};

	DetailViewViewModel.prototype.refreshClick = function()
	{
		var self = this;

		self.exitEditing("You have unsaved changes. Do you still want to refresh?").then(function(response)
		{
			if (response)
			{
				self.refresh();
			}
		});
	};

	DetailViewViewModel.prototype.refresh = function()
	{
		var self = this;
		const layoutId = self.getEffectiveDetailLayoutId();
		self.applyLayoutTemplate({ isReadMode: self.isReadMode(), layoutId: layoutId})
			.then(function()
			{
				self.skipValidation = !self.recordId;
				self.updateDetailViewTitle();
				self.showDetailViewById(self.recordId, self.gridType, layoutId);
			});

		self.closeFieldEditor();
	}

	DetailViewViewModel.prototype.saveEntityClick = function()
	{
		var self = this;

		return self.saveCurrentEntity().then(function(result)
		{
			if (result)
			{
				if (result.success)
				{
					self.pageLevelViewModel.clearError();
					self.pageLevelViewModel.popupSuccessMessage("The record has been successfully " + (result.isCreateGridNewRecord ? "created" : "updated") + ".");
				}
				else if (Array.isArray(result.messages))
				{
					self.pageLevelViewModel.clearError();
					result.messages.map(function(msg)
					{
						self.pageLevelViewModel.popupErrorMessage(self._normalizeErrorMessage(msg));
					});
				}
			}
			return result;
		});
	};

	DetailViewViewModel.prototype._normalizeErrorMessage = function(message)
	{
		var allowMessages = ["Routing trip is editing this student, you can't modify this student."];
		var normalMessage = message.replace("API Error: ", "");
		if (allowMessages.indexOf(normalMessage) >= 0)
		{
			return normalMessage;
		}
		return message;
	};

	/**
	 * The close detail function.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.closeDetailClick = function(data, e)
	{
		var self = this;
		self.pageLevelViewModel.clearError();
		self.onCloseDetailEvent.notify();
	};

	/**
	 * The close edit detail model function.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.closeEditMode = function()
	{
		const self = this;
		const activeLayoutId = self.getEffectiveDetailLayoutId();

		if (activeLayoutId && self.recordId)
		{
			self.onCloseEditMode.notify();
		}
		else
		{
			self.onCloseDetailEvent.notify();
		}
	};


	/**	 6-19:edit
	* The close edit detail model function.
	* @return {void}
	*/
	DetailViewViewModel.prototype.closeEditMode1 = function()
	{
		var self = this;
		self.checkLayoutChange();
	};

	DetailViewViewModel.prototype.onBeforePrint = function(printWidth)
	{
		this.beforePrint.notify(printWidth);
	};

	DetailViewViewModel.prototype.onAfterPrint = function()
	{
		this.afterPrint.notify();
	};

	/**
	 * The print function.
	 * @param {Object} data	
	 * @param {Event} e
	 * @return {void}
	 */
	DetailViewViewModel.prototype.printClick = function(data, e)
	{
		var self = this, printSettingsModal = new TF.Modal.PrintSettingsModalViewModel();

		self.exitEditing().then(function(result)
		{
			if (result)
			{
				tf.modalManager.showModal(printSettingsModal).then(function(result)
				{
					if (!result) return;

					var printHelper = new TF.DetailView.PrintHelper();

					self.onBeforePrint(printSettingsModal.model.getPageWidth());

					printHelper.print($(e.target).closest('.detail-view-panel'), printSettingsModal.model.obSelectedOrientation()).then(function()
					{
						self.onAfterPrint();
					});
				});
			}
		});
	};

	/**
	 * Exit edit mode.
	 *
	 * @param {String} message
	 * @returns
	 */
	DetailViewViewModel.prototype.exitEditing = function(message, silent)
	{
		var self = this,
			gridName = self._getGridName(),
			gridLabel = tf.applicationTerm.getApplicationTermSingularByName(gridName);

		if (!self.obEditing())
		{
			return Promise.resolve(true);
		}
		//Close error toast if exist.
		self.pageLevelViewModel.clearError();

		if (self.isCreateGridNewRecord)
		{
			if (silent)
			{
				self.resetUploaderStatus();
				self.refreshEditStatus();

				self.stopCreateNewMode();

				return Promise.resolve(true);
			}

			message = message || "Do you want to exit without saving?";
			return self.showConfirmation(message)
				.then(function(result)
				{
					if (result)
					{
						self.resetUploaderStatus();
						self.refreshEditStatus();

						self.stopCreateNewMode();
					}

					return result;
				});
		}
		else
		{
			if (silent)
			{
				self.refreshEditStatus();
				self.obEditing(false);
				return Promise.resolve(true);
			}
			return self.showConfirmation(message || ("Do you want to close " + gridLabel + " detail view without saving?"))
				.then(function(result)
				{
					if (result)
					{
						self.resetUploaderStatus();
						self.refreshEditStatus();

						self.obEditing(false);
					}

					return result;
				});
		}
	};

	/**
	 * Get current grid name.
	 *
	 * @returns
	 */
	DetailViewViewModel.prototype._getGridName = function()
	{
		return tf.dataTypeHelper.getFormalDataTypeName(this.gridType);
	};

	/**
	 * Determine if layout template changed
	 * @param {Object} entity1 
	 * @param {Object} entity2 
	 */
	DetailViewViewModel.prototype.isLayoutTemplateChanged = function(entity1, entity2)
	{
		return !(entity1.Name === entity2.Name
			&& entity1.SubTitle === entity2.SubTitle
			&& this.deepCompareLayout(entity1.Layout, entity2.Layout))
	}

	/**
	 * Compare two layouts in deep level.
	 *
	 * @param {Object} previous
	 * @param {Object} current
	 * @returns
	 */
	DetailViewViewModel.prototype.deepCompareLayout = function(previous, current)
	{
		previous = JSON.parse(previous);
		current = JSON.parse(current);
		if (previous.sliderFontRate !== current.sliderFontRate && !(previous.sliderFontRate == undefined && current.sliderFontRate == 0.5))
		{
			return false;
		}

		if (previous.width !== current.width) return false;

		if (previous.items.length !== current.items.length) return false;

		previous.items.sort(function(a, b) { return a.y - b.y != 0 ? a.y - b.y : (a.x - b.x); });
		current.items.sort(function(a, b) { return a.y - b.y != 0 ? a.y - b.y : (a.x - b.x); });

		for (var i = 0; i < previous.items.length; i++)
		{
			if (!_.isEqual(this.detailViewHelper.compressDataBlockDescriptor(previous.items[i]), current.items[i]))
			{
				console.log(previous.items[i].field || previous.items[i].UDFId || previous.items[i].type + " may be changed.");
				return false;
			}
		}

		return true;
	}

	/**
	* Toggle the Data Point Panel display status.
	* @param {Object} data The data object.
	* @return {void} 
	*/
	DetailViewViewModel.prototype.toggleDataPointPanel = function(data)
	{
		var self = this;
		if (self.dataPointPanel)
		{
			self.dataPointPanel.onCloseDataPointPanelEvent.notify();

			self.dataPointPanel.dispose();
			self.dataPointPanel = null;
		}
		self.dataPointPanel = data;
		self.dataPointPanel.onCloseDataPointPanelEvent.subscribe(function()
		{
			tf.pageManager.resizablePage.clearLeftOtherContent();
		});
		tf.pageManager.resizablePage.setLeftPage("workspace/detailview/DataPointPanel", self.dataPointPanel);
		self.grid.setRemovingBound();
	};

	/**
		* The dispose function.
		* @returns {void}
		*/
	DetailViewViewModel.prototype.dispose = function()
	{
		var self = this, $document = $(document);

		TF.DetailView.BaseCustomGridStackViewModel.prototype.dispose.call(self);

		$document.off('mousedown.morebuttonmenu');
		$document.off(".detailViewPanelSubTitle");
		$document.off("mousedown.detailViewPanelSave");
		$document.off(".rightClickMenu");
		$document.off(".slider");


		self.onToggleDataPointPanelEvent.unsubscribeAll();
		self.onClosePanelEvent.unsubscribeAll();
		self.groupDataBlockEvent.unsubscribeAll();
		self.onColumnChangedEvent.unsubscribeAll();
		self.onCloseDetailEvent.unsubscribeAll();
		self.onCloseEditMode.unsubscribeAll();
		self.beforePrint.unsubscribeAll();
		self.afterPrint.unsubscribeAll();
		self.onResizePage.unsubscribeAll();
		self.onInitComplete.unsubscribeAll();

		self.dataPointPanel.dispose();
		self.dataPointGroupHelper.dispose();

		if (self.$columnPopup)
		{
			self.$columnPopup.find(".column-container").off(".changeColumn");
			self.$columnPopup.remove();
		}
	};
}());