(function()
{
	createNamespace("TF.RoutingMap").LabelOptionsDialogHelper = LabelOptionsDialogHelper;

	function LabelOptionsDialogHelper(panelType)
	{
		this.separatorList = this.getSeparatorList();
		this.fontFamily = this.getFontFamily(panelType);
		this.fontSizeList = this.getFontSizeList();
		this.positionList = this.getPositionList();
	}

	LabelOptionsDialogHelper.prototype.getFontSizeList = function()
	{
		var result = [
			{
				text: '1',
				value: '1px'
			},
			{
				text: '2',
				value: '2px'
			},
			{
				text: '3',
				value: '3px'
			},
			{
				text: '4',
				value: '4px'
			},
			{
				text: '5',
				value: '5px'
			},
			{
				text: '6',
				value: '6px'
			},
			{
				text: '7',
				value: '7px'
			},
			{
				text: '8',
				value: '8px'
			},
			{
				text: '9',
				value: '9px'
			},
			{
				text: '10',
				value: '10px'
			},
			{
				text: '11',
				value: '11px'
			},
			{
				text: '12',
				value: '12px'
			},
			{
				text: '13',
				value: '13px'
			},
			{
				text: '14',
				value: '14px'
			},
			{
				text: '15',
				value: '15px'
			},
			{
				text: '16',
				value: '16px'
			},
			{
				text: '17',
				value: '17px'
			},
			{
				text: '18',
				value: '18px'
			},
			{
				text: '19',
				value: '19px'
			},
			{
				text: '20',
				value: '20px'
			}
			// {
			// 	text: '21',
			// 	value: '21px'
			// },
			// {
			// 	text: '22',
			// 	value: '22px'
			// },
			// {
			// 	text: '23',
			// 	value: '23px'
			// },
			// {
			// 	text: '24',
			// 	value: '24px'
			// },
			// {
			// 	text: '25',
			// 	value: '25px'
			// },
			// {
			// 	text: '26',
			// 	value: '26px'
			// },
			// {
			// 	text: '27',
			// 	value: '27px'
			// },
			// {
			// 	text: '28',
			// 	value: '28px'
			// },
			// {
			// 	text: '29',
			// 	value: '29px'
			// },
			// {
			// 	text: '30',
			// 	value: '30px'
			// }
		];
		return result;
	}

	LabelOptionsDialogHelper.prototype.getSeparatorList = function()
	{
		var result = [{
			text: 'Space',
			value: ' '
		},
		{
			text: 'New Line',
			value: '<br>'
		},
		{
			text: 'Dash',
			value: '-'
		},
		{
			text: 'Slash',
			value: '/'
		}];
		return result;
	}

	LabelOptionsDialogHelper.prototype.getSeparatorWithValue = function(value)
	{
		switch (value)
		{
			case 'Space':
				return {
					text: 'Space',
					value: ' '
				};
			case 'New Line':
				return {
					text: 'New Line',
					value: '<br>'
				};
			case 'Dash':
				return {
					text: 'Dash',
					value: '-'
				};
			case 'Slash':
				return {
					text: 'Slash',
					value: '/'
				};
			default:
				return {
					text: 'Space',
					value: ' '
				};
		}
	}

	LabelOptionsDialogHelper.prototype.getFontFamilyWithValue = function(value)
	{
		return {
			text: value,
			value: value
		};
	}

	LabelOptionsDialogHelper.prototype.getFontSizeWithValue = function(value)
	{
		return {
			text: value,
			value: value + 'px'
		};
	}

	LabelOptionsDialogHelper.prototype.getFontFamily = function(panelType)
	{
		var result = [];
		if (panelType == "routing")
		{
			result = [
				{
					text: 'sans-serif',
					value: 'sans-serif'
				},
				{
					text: 'serif',
					value: 'serif'
				},
				{
					text: 'cursive',
					value: 'cursive'
				},
				{
					text: 'Arial',
					value: 'Arial'
				}];
		} else
		{
			result = [
				{
					text: 'Sans-serif',
					value: 'Sans-serif'
				},
				{
					text: 'Serif',
					value: 'Serif'
				},
				{
					text: 'Arial',
					value: 'Arial'
				}];
		}
		return result;
	}

	LabelOptionsDialogHelper.prototype.getPositionList = function()
	{
		return [
			{ value: "center", text: "center" },
			{ value: "right", text: "left" },
			{ value: "left", text: "right" },
			{ value: "bottom", text: "top" },
			{ value: "top", text: "bottom" },
			{ value: "bottom-right", text: "top-left" },
			{ value: "bottom-left", text: "top-right" },
			{ value: "top-right", text: "bottom-left" },
			{ value: "top-left", text: "bottom-right" },
		]
	}

	LabelOptionsDialogHelper.prototype.getPositionWithValue = function(value)
	{
		return this.getPositionList().filter(function(p)
		{
			return p.value == value;
		})[0];
	}

	LabelOptionsDialogHelper.prototype.getLabelOptionData = function()
	{
		return {
			fields: [],
			separator: 'Space',
			fontSize: '12',
			position: 'center',
			fontColor: '#333333',
			fontFamily: 'Arial',
			fontBold: false,
			fontOblique: false,
			fontUnderLine: false,
			fontHalo: true,
			fontHaloColor: '#333333',
			visibleRange: [TF.Helper.MapHelper.MAP_MIN_ZOOM_LEVEL, TF.Helper.MapHelper.MAP_MAX_ZOOM_LEVEL]
		};
	}

	LabelOptionsDialogHelper.prototype.setOptions = function(options, data)
	{
		for (var key in options)
		{
			if (!!options[key] && !!data[key])
			{
				data[key] = options[key];
			}
		}
	}

	LabelOptionsDialogHelper.prototype.compareObject = function(dataA, dataB)
	{
		if (JSON.stringify(dataA) != JSON.stringify(dataB))
		{
			return false;
		}
		return true;
	}

	LabelOptionsDialogHelper.prototype.getCurrentUserPreference = function(panelType, routeState)
	{
		return tf.storageManager.get('labelOptions' + "." + panelType + "." + routeState);
	}

	LabelOptionsDialogHelper.prototype.getHeaderName = function(panelType)
	{
		switch (panelType)
		{
			case 'AddressPoint':
				return 'Address Point';
			case 'MunicipalBoundary':
				return 'Municipal Boundary';
			case 'MyLandmark':
				return 'Landmark';
			case 'MyRailroad':
				return 'Railroad';
			case 'PopulationRegion':
				return 'Population Region';
			case 'postalcode':
			case 'ZipCode':
				return 'Postal Code';
			case 'SchoolBoundary':
				return 'School Boundary';
			case 'TravelRegion':
				return 'Travel Region';
			case 'MyStreet':
				return 'Street';
			case 'routing':
				return 'Stop';
			default:
				return panelType;
		}
	}

})();