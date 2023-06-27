(function()
{
	createNamespace("TF.RoutingMap").LabelOptionsDialogViewModel = LabelOptionsDialogViewModel;

	function LabelOptionsDialogViewModel(panelType, routeState, defaultLabelOptionsData, currentZoomLevel, options, notSaving, useUserPerference)
	{
		var self = this;
		this.panelType = panelType;
		this.routeState = routeState;
		this.defaultLabelOptionsData = defaultLabelOptionsData;
		this.notSaving = notSaving;
		this.userPreferenceData = options ? options : TF.getStorage('labelOptions' + "." + self.panelType, routeState);
		this.useUserPerference = useUserPerference;
		this.LabelOptionsHelper = new TF.RoutingMap.LabelOptionsDialogHelper(panelType);
		this.obLabelAttributes = ko.observableArray([]);
		this.labelAreaHead = ko.observable('Label Each ' + this.LabelOptionsHelper.getHeaderName(panelType) + ' With');

		this.obCurrentZoomLevel = ko.observable(currentZoomLevel);
		this.obVisibleRange = ko.observableArray(this.getLabelVisibleRange());

		this.obRoutingPanel = ko.observable(panelType == "routing");
		this.separatorList = this.LabelOptionsHelper.separatorList;
		//drop down list
		this.obSelectedSeparator = ko.observable({
			text: 'Space',
			value: ' '
		});
		this.obSelectedSeparatorText = ko.observable('Space');

		this.fontList = this.LabelOptionsHelper.fontFamily;
		//drop down list
		this.obSelectedFont = ko.observable({
			text: 'Arial',
			value: 'Arial'
		});
		this.obSelectedFontText = ko.observable('Arial');

		this.positionList = this.LabelOptionsHelper.positionList;
		this.obSelectedPosition = ko.observable({
			text: 'center',
			value: 'center'
		});
		this.obSelectedPositionText = ko.observable('center');

		this.fontSizeList = this.LabelOptionsHelper.fontSizeList;
		//drop down list
		this.obSelectedFontSize = ko.observable({
			text: '12',
			value: '12px'
		});
		this.obSelectedFontSizeText = ko.observable('12');

		this.chosenAttributes = ko.computed(function()
		{
			var selectedCustomers = [];
			self.obLabelAttributes().map(function(item)
			{
				if (item.Check())
				{
					selectedCustomers.push(item);
				}
			});
			return selectedCustomers;
		});

		this.obShowWarningVisibleRange = ko.computed(function()
		{
			return self.obVisibleRange()[0] < self.defaultLabelOptionsData.warnMinZoomLevel;
		});

		this.bolderStyle = ko.observable(false);
		this.obliqueStyle = ko.observable(false);
		this.underLineStyle = ko.observable(false);
		this.obColor = ko.observable();
		this.obHalo = ko.observable(true);
		this.obHaloColor = ko.observable();
		this.original = null;//the original data 
		this.data = null;// data to be save

		this.obPreviewText = ko.observable('');
		this.disableMoveUp = ko.observable(false);
		this.disableMoveDown = ko.observable(true);
		this.currentSelectedField = ko.observable('');
		this.defaultColor = '#333333';

		this.obGeoType = ko.observable(this.getGeoType());

		this.obLabelAttributes.subscribe(this.attributesSelectedChange.bind(this));
		this.chosenAttributes.subscribe(this.attributesSelectedChange.bind(this));
		this.obSelectedSeparatorText.subscribe(this.attributesSelectedChange.bind(this));
		this.currentSelectedField.subscribe(this.currentSelectedChanged.bind(this));
	}

	LabelOptionsDialogViewModel.prototype.sliderRendered = function()
	{
		this.element.find("#cluster-transparency-slider").on("mousedown.closeColorPicker", e =>
		{
			this.closeColorPicker();
		});
	};

	LabelOptionsDialogViewModel.prototype.closeColorPicker = function()
	{
		let borderColorPicker = this.element.find(".borderColorPicker").data("kendoColorPicker"),
			haloColorPicker = this.element.find(".haloColorPicker").data("kendoColorPicker");
		borderColorPicker && borderColorPicker.close();
		haloColorPicker && haloColorPicker.close();
	}

	LabelOptionsDialogViewModel.prototype.getLabelVisibleRange = function()
	{
		let defaultVisibleRange = this.defaultLabelOptionsData.visibleRange;
		if (!this.userPreferenceData) return defaultVisibleRange;
		let userPreferenceVisibleRange = this.userPreferenceData.visibleRange;
		if (userPreferenceVisibleRange)
		{
			if (userPreferenceVisibleRange[0] < defaultVisibleRange[0] || userPreferenceVisibleRange[1] > defaultVisibleRange[1])
			{
				return defaultVisibleRange
			} else
			{
				return userPreferenceVisibleRange;
			}
		}
		return defaultVisibleRange;

	}
	LabelOptionsDialogViewModel.prototype.getGeoType = function()
	{
		switch (this.panelType)
		{
			case "street":
			case "Railroads":
				return "polyline";
			case "Parcel":
				return "point";
		}
		return "polygon";
	};

	LabelOptionsDialogViewModel.prototype.bolderClick = function(data, e)
	{
		if (this.bolderStyle())
		{
			this.bolderStyle(false);
		}
		else
		{
			this.bolderStyle(true);
		}
	}

	LabelOptionsDialogViewModel.prototype.obliqueClick = function(data, e)
	{
		if (this.obliqueStyle())
		{
			this.obliqueStyle(false);
		}
		else
		{
			this.obliqueStyle(true);
		}
	}

	LabelOptionsDialogViewModel.prototype.underLineClick = function(data, e)
	{
		if (this.underLineStyle())
		{
			this.underLineStyle(false);
		}
		else
		{
			this.underLineStyle(true);
		}
	}

	LabelOptionsDialogViewModel.prototype.attributesSelectedChange = function()
	{
		var self = this;
		var result;
		var separator = self.obSelectedSeparator().value;
		self.obLabelAttributes().map(function(item)
		{
			if (item.Check())
			{
				result ? (result += separator + item.ExampleValue) : (result = item.ExampleValue);
			}
		});
		self.obPreviewText(result);
	}

	LabelOptionsDialogViewModel.prototype.init = function(viewModel, el)
	{
		var self = this;
		self.element = $(el);
		var labelOptions = self.LabelOptionsHelper.getLabelOptionData();
		self.LabelOptionsHelper.setOptions(self.defaultLabelOptionsData, labelOptions);
		self.data = self.userPreferenceData ? self.userPreferenceData : labelOptions;

		if (self.data)
		{
			self.obColor(self.data.fontColor);
			self.obHaloColor(self.data.fontHaloColor);
			self.bolderStyle(self.data.fontBold);
			self.obliqueStyle(self.data.fontOblique);
			self.underLineStyle(self.data.fontUnderLine);
			self.obHalo(self.data.fontHalo);
			self.obSelectedSeparator(self.LabelOptionsHelper.getSeparatorWithValue(self.data.separator));
			self.obSelectedSeparatorText(self.obSelectedSeparator().text);
			self.obSelectedFont(self.LabelOptionsHelper.getFontFamilyWithValue(self.data.fontFamily));
			self.obSelectedFontText(self.obSelectedFont().text);
			self.obSelectedPosition(self.LabelOptionsHelper.getPositionWithValue(self.data.position || labelOptions.position));
			self.obSelectedPositionText(self.obSelectedPosition().text);
			self.obSelectedFontSize(self.LabelOptionsHelper.getFontSizeWithValue(self.data.fontSize));
			self.obSelectedFontSizeText(self.obSelectedFontSize().text);
			self.obVisibleRange(self.data.visibleRange);

			var fieldList = [];
			self.data.fields.map(function(field, index)
			{
				fieldList.push({
					Name: field.name,
					Check: ko.observable(field.check),
					ExampleValue: field.exampleValue,
					Selected: ko.observable(index == 0 ? true : false),
					FieldName: field.fieldName
				});
			});
			self.obLabelAttributes(fieldList);
		}
		else
		{
			self.obColor(self.defaultColor);
			self.obHaloColor(self.defaultColor);
			// self.data.fields = self.labelFields;
			var fieldList = [];
			self.data.fields.map(function(field, index)
			{
				fieldList.push({
					Name: field.name,
					Check: ko.observable(field.check),
					ExampleValue: field.exampleValue,
					Selected: ko.observable(index == 0 ? true : false),
					FieldName: field.fieldName
				});
			});
			self.obLabelAttributes(fieldList);
		}
		self.original = $.extend(true, {}, self.data);

		setTimeout(function()
		{
			$('.list-checked').off('click').on('click', function(e)
			{
				self.currentSelectedField(e.currentTarget.innerText.trim());
			});
		});
		if (self.obLabelAttributes().length > 0)
		{
			self.currentSelectedField(self.obLabelAttributes()[0].Name);
		}

	};

	LabelOptionsDialogViewModel.prototype.currentSelectedChanged = function()
	{
		var self = this;
		var index;
		this.obLabelAttributes().map(function(item, i)
		{
			if (item.Name == self.currentSelectedField())
			{
				index = i;
				item.Selected(true);
			}
			else
			{
				item.Selected(false);
			}
		});
		this.disableMoveUp(false);
		this.disableMoveDown(false);
		if (index == 0)
		{
			this.disableMoveUp(true);
		}
		if (index == this.obLabelAttributes().length - 1)
		{
			this.disableMoveDown(true);
		}
	}

	LabelOptionsDialogViewModel.prototype.toUpClick = function()
	{
		if (this.disableMoveUp())
		{
			return;
		}
		var self = this;
		var template;
		var index;
		this.obLabelAttributes().map(function(item, i)
		{
			if (item.Name == self.currentSelectedField())
			{
				template = item;
				index = i;
			}
		});
		this.obLabelAttributes.splice(index, 1);
		this.obLabelAttributes.splice(index - 1, 0, template);
		this.fieldPositionChanged(index - 1);
	};

	LabelOptionsDialogViewModel.prototype.toDownClick = function()
	{
		if (this.disableMoveDown())
		{
			return;
		}
		var self = this;
		var template;
		var index;
		this.obLabelAttributes().map(function(item, i)
		{
			if (item.Name == self.currentSelectedField())
			{
				template = item;
				index = i;
			}
		});
		this.obLabelAttributes.splice(index, 1);
		this.obLabelAttributes.splice(index + 1, 0, template);
		this.fieldPositionChanged(index + 1);
	};

	LabelOptionsDialogViewModel.prototype.fieldPositionChanged = function(index)
	{
		var self = this;
		this.disableMoveUp(false);
		this.disableMoveDown(false);
		if (index == 0)
		{
			this.disableMoveUp(true);
		}
		if (index == this.obLabelAttributes().length - 1)
		{
			this.disableMoveDown(true);
		}
		setTimeout(function()
		{
			$('.list-checked').off('click').on('click', function(e)
			{
				self.currentSelectedField(e.currentTarget.innerText.trim());
			});
		});
	}

	LabelOptionsDialogViewModel.prototype.cancel = function()
	{
		var self = this;
		var confirmPromise = Promise.resolve(true);
		self.updateData();
		var dataSame = this.LabelOptionsHelper.compareObject(this.original, this.data);
		if (!dataSame)
		{
			confirmPromise = tf.promiseBootbox.yesNo("There are unsaved changes.  Are you sure you want to cancel?", "Unsaved Changes")
		}
		return confirmPromise.then(function(result)
		{
			if (result === true)
			{
				// self.hide();
				return Promise.resolve(true);
			}
		});
	};

	LabelOptionsDialogViewModel.prototype.apply = function()
	{
		var self = this;
		self.updateData();
		if (self.useUserPerference && !self.notSaving)
		{
			tf.storageManager.save('labelOptions.' + this.panelType, self.data);
			tf.storageManager.save('labelOptions.' + this.panelType + '.' + this.routeState, self.data);
		}
		return new Promise(function(resolve, reject)
		{
			return resolve(self.data);
		})
	}

	LabelOptionsDialogViewModel.prototype.updateData = function()
	{
		var self = this;
		self.data.fontColor = self.obColor();
		self.data.fontHaloColor = self.obHaloColor();
		self.data.fontBold = self.bolderStyle();
		self.data.fontOblique = self.obliqueStyle();
		self.data.fontUnderLine = self.underLineStyle();
		self.data.fontHalo = self.obHalo();
		var fieldList = [];
		self.obLabelAttributes().map(function(field)
		{
			fieldList.push({
				name: field.Name,
				check: field.Check(),
				exampleValue: field.ExampleValue,
				fieldName: field.FieldName
			});
		});
		self.data.fields = fieldList;
		self.data.fontFamily = self.obSelectedFont().value;
		self.data.position = self.obSelectedPosition().value;
		self.data.separator = self.obSelectedSeparator().text;
		self.data.fontSize = self.obSelectedFontSize().text;
		self.data.visibleRange = self.obVisibleRange();
	}


})();