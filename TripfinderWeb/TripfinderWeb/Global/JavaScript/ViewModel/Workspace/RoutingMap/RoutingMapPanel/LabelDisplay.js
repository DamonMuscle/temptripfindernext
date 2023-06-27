(function()
{
	createNamespace("TF.RoutingMap").LabelDisplay = LabelDisplay;

	/**
	* This class is helper to display labels on map
	*/
	function LabelDisplay(routeState, title, map, panelType, layerId, labelFields, sourceModify, geometryType, vectorTileLayer, displaySetting, useUserPerference, customOptions)
	{
		var self = this;
		self.vectorTileLayer = vectorTileLayer;
		self.map = map;
		self.panelType = panelType;
		self.layerId = layerId;
		self.labelLayerId = panelType + "LabelLayer";
		self.routeState = routeState;
		self.title = title;
		self.labelFields = labelFields;
		self.sourceModify = sourceModify;
		self.geometryType = geometryType;
		self.displaySetting = displaySetting;
		self.useUserPerference = isNullObj(useUserPerference) ? true : useUserPerference;
		self.customOptions = customOptions;
	}
	LabelDisplay.prototype.getLabelOptions = function()
	{
		var self = this;
		var labelOptions = self._getLabelOption();

		//var textFields = "{_name}",
		var textColor = labelOptions.fontColor,
			textFont = [self.getTextFontString(labelOptions)],
			textPosition = labelOptions.position,
			textSize = parseInt(labelOptions.fontSize),
			haloColor = labelOptions.fontHalo ? labelOptions.fontHaloColor : null,
			haloSize = labelOptions.fontHalo ? 2 : 0;
		return {
			fields: labelOptions.fields,
			textColor: textColor,
			textPosition: textPosition,
			textFont: textFont,
			textSize: textSize,
			haloColor: haloColor,
			haloSize: haloSize,
			visibleRange: labelOptions.visibleRange
		};
	}

	LabelDisplay.prototype.getTextFontString = function(labelOptions)
	{
		var text = labelOptions.fontFamily;
		if (text.toLowerCase().indexOf("sans-serif") >= 0) text = "Noto Sans";
		else if (text.toLowerCase().indexOf("sans") >= 0 || text.toLowerCase().indexOf("serif") >= 0) text = "Noto " + text;
		if (labelOptions.fontBold || labelOptions.fontOblique)
		{
			if (labelOptions.fontBold) text += " Bold";
			if (labelOptions.fontOblique) text += " Italic";
		} else
		{
			text += " Regular";
		}
		return text;
	}

	LabelDisplay.prototype.setLabel = function(isLayerVisible, isLabelVisible, transparency, isInit)
	{
		var self = this;
		if (!self.vectorTileLayer || !self.vectorTileLayer.currentStyleInfo) return;
		var labelOptions = self.getLabelOptions();
		var opacity = 1 - (1 - 0.1) * 0.01 * transparency;
		self._getLabelLayers().forEach(function(layer)
		{
			var layout = self.vectorTileLayer.getLayoutProperties(layer.id);
			var paint = self.vectorTileLayer.getPaintProperties(layer.id);
			if (layer["id"].indexOf("/label") != -1)
			{
				var checkedFields = labelOptions.fields.filter(function(f) { return f.check }).map(function(f) { return f.name });
				var layerId = layer['id'].split("/")[2];
				if (layerId == "Zip") layerId = "Postal Code";
				if (checkedFields.indexOf(layerId) != -1)
				{
					layout["visibility"] = isLayerVisible && isLabelVisible ? "visible" : "none";
				}
				else
				{
					layout["visibility"] = "none";
				}
				if (self.panelType == "Parcel" && checkedFields.length == self.displaySetting.getLabelFields().length)
				{
					if (layer["id"].split("/")[2] == "Default")
					{
						layout["visibility"] = isLayerVisible && isLabelVisible ? "visible" : "none";
					} else
					{
						layout["visibility"] = "none";
					}
				}


				// if (self.map.mapView.zoom < labelOptions.visibleRange[0] || self.map.mapView.zoom > labelOptions.visibleRange[1])
				// {
				// 	layout["visibility"] = "none";
				// }
			} else
			{
				layout["visibility"] = isLayerVisible ? "visible" : "none";
			}

			layout["text-font"] = [labelOptions.textFont];
			layout["text-size"] = self.displaySetting.adjustFontSize(labelOptions.textSize);
			layout["text-anchor"] = labelOptions.textPosition;
			paint["text-opacity"] = opacity;
			paint["text-color"] = labelOptions.textColor;
			paint["text-halo-color"] = labelOptions.haloColor;
			paint["text-halo-width"] = labelOptions.haloSize;
			layer.minzoom = labelOptions.visibleRange[0];
			layer.maxzoom = labelOptions.visibleRange[1];
			self.vectorTileLayer.setLayoutProperties(layer.id, layout);
			self.vectorTileLayer.setPaintProperties(layer.id, paint);
		});

	};


	LabelDisplay.prototype._getFields = function(labelOptions)
	{
		var self = this
		labelOptions.fields.forEach(function(field, index)
		{
			if (field.check)
			{
				//self.displaySetting.
			}
		});
	}

	LabelDisplay.prototype.show = function()
	{
		var self = this;
		self.removeGraphicLabelFeatureLayer();

		var labelLayer = self._getLabelFeatureLayer();
		var labelOptions = self._getLabelOption();
		// set label opacity
		var color = new tf.map.ArcGIS.Color(labelOptions.fontColor);
		color.a = self.map.findLayerById(self.layerId).opacity;
		var fontHaloColor = labelOptions.fontHalo ? new tf.map.ArcGIS.Color(labelOptions.fontHaloColor) : null;
		if (fontHaloColor) fontHaloColor.a = self.map.findLayerById(self.layerId).opacity;
		labelLayer.labelsVisible = false;
		setTimeout(() =>
		{
			labelLayer.labelsVisible = true;
			labelLayer.labelingInfo = [{
				labelExpressionInfo: {
					expression: self._buildExpression(labelOptions)
				},
				labelPlacement: getPlaceMent(labelOptions.position),
				minScale: TF.Helper.MapHelper.zoomToScale(self.map, labelOptions.visibleRange[0]),
				maxScale: TF.Helper.MapHelper.zoomToScale(self.map, labelOptions.visibleRange[1]) - 1,
				symbol: {
					type: "text",
					haloColor: fontHaloColor,
					haloSize: labelOptions.fontHalo ? 2 : 0,
					horizontalAlignment: "center",
					color: color,
					font: {
						size: labelOptions.fontSize,
						family: labelOptions.fontFamily,
						weight: labelOptions.fontBold ? "bold" : "normal",
						style: labelOptions.fontOblique ? "italic" : "normal",
						decoration: labelOptions.fontUnderLine ? "underline" : "none"
					}
				}
			}];
		}, 100);

		function getPlaceMent(position)
		{
			switch (position)
			{
				case "center":
					return "center-center";
				case "right":
					return "center-left";
				case "left":
					return "center-right";
				case "bottom":
					return "above-center";
				case "top":
					return "below-center";
				case "top-left":
					return "below-right";
				case "top-right":
					return "below-left";
				case "bottom-left":
					return "above-right";
				case "bottom-right":
					return "above-left";
				default:
					return "center-center";
			}
		}
	};

	LabelDisplay.prototype.hide = function()
	{
		var self = this;
		var labelLayer = self._getLabelFeatureLayer();
		labelLayer.labelsVisible = false;
		// if the source layer is a graphic layer, delete this fake label feature layer
		this.removeGraphicLabelFeatureLayer();
	};

	LabelDisplay.prototype.removeGraphicLabelFeatureLayer = function()
	{
		var labelLayer = this.map.findLayerById(this.labelLayerId);
		var layer = this.map.findLayerById(this.layerId);
		if (layer && labelLayer && !(layer.type == "feature"))
		{
			this.map.remove(labelLayer);
			if (this.sketchViewModelUpdateEvent) this.sketchViewModelUpdateEvent.remove();
		}
	};

	/**
	* change label font opacity
	*/
	LabelDisplay.prototype.changeOpacity = function(opacity)
	{
		var labelLayer = this._getLabelFeatureLayer();
		if (labelLayer.labelingInfo && labelLayer.labelingInfo.length > 0)
		{
			labelLayer.labelingInfo[0].symbol.color.a = opacity;
			if (labelLayer.labelingInfo[0].symbol.haloColor) labelLayer.labelingInfo[0].symbol.haloColor.a = opacity;
			labelLayer.labelingInfo = labelLayer.labelingInfo;
		}
	};

	LabelDisplay.prototype.changeVisibleRange = function(minScale, maxScale)
	{
		var self = this;
		// // var self = this, labelLayers = [];
		// if (!self.vectorTileLayer || !self.vectorTileLayer.currentStyleInfo) return [];
		// self.vectorTileLayer.currentStyleInfo.style.layers.forEach(function(layer)
		// {
		// 	if (layer['source-layer'].indexOf("/label") != -1)
		// 	{
		// 		layer.minzoom = minScale;
		// 		layer.maxzoom = maxScale;
		// 	}
		// });

		//self.displaySetting.loadStyle();
	};

	/**
	* show option model and return new option
	*/
	LabelDisplay.prototype.showOptionsDialog = function()
	{
		const options = this.useUserPerference ? this.options : $.extend(true, {}, this.getCustomLabelOption());
		return tf.modalManager.showModal(new TF.RoutingMap.LabelOptionsDialogModalViewModel(this.panelType, this.routeState, this.getDefaultLabelOptions(), this.map.mapView.zoom, this.title, options, this.notSaving, this.useUserPerference))
			.then(function(options)
			{
				return options;
			});
	};

	/**
	* get label summary text to display in input box
	*/
	LabelDisplay.prototype.getAttributeDisplay = function()
	{
		var attributes = this._getLabelOption().fields.filter(function(item)
		{
			return item.check;
		}).map(function(c)
		{
			return c.name;
		});
		return attributes.join(',');
	};

	LabelDisplay.prototype.getDefaultLabelOptions = function()
	{
		var color = '#333333';
		var setting = {
			fields: this.labelFields,
			separator: 'Space',
			position: 'center',
			fontSize: '12',
			fontColor: color,
			fontFamily: 'Arial',
			fontBold: false,
			fontOblique: false,
			fontUnderLine: false,
			fontHalo: false,
			fontHaloColor: color,
			visibleRange: [TF.Helper.MapHelper.MAP_MIN_ZOOM_LEVEL, TF.Helper.MapHelper.MAP_MAX_ZOOM_LEVEL],
			isFold: false,
			warnMinZoomLevel: 0,
		};
		if (["Railroads", "street", "Parcel"].indexOf(this.panelType) >= 0)
		{
			setting.position = "top";
		}
		if (this.panelType == "street")
		{
			setting.visibleRange = [TF.Helper.MapHelper.STREET_MIN_ZOOM_LEVEL, TF.Helper.MapHelper.MAP_MAX_ZOOM_LEVEL];
			setting.warnMinZoomLevel = TF.Helper.MapHelper.STREET_MIN_ZOOM_LEVEL;
		}
		if (this.customOptions)
		{
			Object.assign(setting, this.customOptions);
		}
		return setting;
	};

	LabelDisplay.prototype._getLabelFeatureLayer = function()
	{
		var sourceLayer = this.map.findLayerById(this.layerId);
		// if the source layer is feature, use this feature layer to display labels
		if (sourceLayer && sourceLayer.type == "feature")
		{
			return sourceLayer;
		}
		else
		{
			// else have to create a invisible feature layer to display labels
			return this._createLabelFeatureLayer();
		}
	};

	LabelDisplay.prototype._createLabelFeatureLayer = function()
	{
		var self = this;
		var labelLayer = self.map.findLayerById(self.labelLayerId);
		var sourceLayer = this.map.findLayerById(this.layerId);
		if (!labelLayer)
		{
			// init fields
			var fields = [
				{
					name: "oid",
					type: "oid"
				}];
			self._getFields().forEach(function(field)
			{
				fields.push({
					name: field.fieldName,
					type: "string"
				});
			});

			var graphics = self._getGraphics();
			// init geometry type
			var geometryType = self.geometryType || "polygon";
			if (graphics.length > 0)
			{
				geometryType = graphics[0].geometry.type;
			}

			// create feature layer
			labelLayer = new tf.map.ArcGIS.FeatureLayer({
				id: self.labelLayerId,
				geometryType: geometryType,
				objectIdField: "oid",
				fields: fields,
				source: graphics,
				minScale: sourceLayer ? sourceLayer.minScale : 0,
				maxScale: sourceLayer ? sourceLayer.maxScale - 1 : 0,
				renderer: {
					type: "simple",
					symbol: {
						type: "simple-marker",
						color: [0, 0, 0, 0],
						outline: null
					}
				}
			});
			self.map.add(labelLayer);
			self._bindSourceGraphicChangeEvent(labelLayer);
		}

		return labelLayer;
	};

	LabelDisplay.prototype._getLabelOption = function()
	{
		var self = this;

		// if have sticky options,use it
		var options = self.useUserPerference ? TF.getStorage('labelOptions.' + self.panelType, self.routeState) : self.getCustomLabelOption();
		options = $.extend(self.getDefaultLabelOptions(), options);
		options.fields = options.fields.filter(function(field)
		{
			return field.check;
		});
		return $.extend(self.getDefaultLabelOptions(), options);
	};

	LabelDisplay.prototype.getCustomLabelOption = function()
	{
		var self = this;

		if (self.displaySetting?.obSetting?.obLabelSetting)
		{
			return self.displaySetting.obSetting.obLabelSetting() || self.getDefaultLabelOptions();
		}

		return self.getDefaultLabelOptions();
	};

	LabelDisplay.prototype._getLabelLayers = function()
	{
		var self = this, labelLayers = [];
		if (!self.vectorTileLayer || !self.vectorTileLayer.currentStyleInfo) return [];
		self.vectorTileLayer.currentStyleInfo.style.layers.forEach(function(layer)
		{
			if (layer['id'].indexOf("/label") != -1)
			{
				labelLayers.push(layer);
			}
		});
		return labelLayers;
	}

	LabelDisplay.prototype._bindSourceGraphicChangeEvent = function(labelLayer)
	{
		var self = this;
		// when graphic changed, change the label
		self.map.findLayerById(self.layerId).graphics.on("change", function()
		{
			self._refreshGraphicsLazyRun();
		});

		// use sketch view model update event to watch update graphic event
		self.sketchViewModelUpdateEvent = self.map.SketchViewModel.on("update", function(e)
		{
			if (e.graphics.length > 0 && e.graphics[0].layer && e.graphics[0].layer.id == self.layerId)
			{
				// when start to update graphic, delete label 
				if (e.state == "start")
				{
					var query = new tf.map.ArcGIS.Query();
					query.outFields = ["oid", "id"];
					labelLayer.queryFeatures(query).then(function(featureSet)
					{
						var changeIds = e.graphics.map(function(graphic)
						{
							return graphic.attributes.dataModel.id.toString();
						});
						var deleteGraphic = featureSet.features.filter(function(graphic)
						{
							return changeIds.indexOf(graphic.attributes.id) >= 0;
						});
						if (deleteGraphic.length > 0)
						{
							labelLayer.applyEdits({ deleteFeatures: deleteGraphic });
						}
					});
				}
				if (e.state == "complete")
				{
					self._refreshGraphicsLazyRun();
				}
			}
		});
	};

	LabelDisplay.prototype._refreshGraphicsLazyRun = function()
	{
		var self = this;
		clearTimeout(self.graphicChangeTimeout);
		self.graphicChangeTimeout = setTimeout(function()
		{
			self._refreshGraphics();
		}, 25);
	};

	/**
	* when graphic layer changes data source, like move, delete or add, need to refresh the invisible feature layer
	*/
	LabelDisplay.prototype._refreshGraphics = function()
	{
		var self = this;
		var labelLayer = self.map.findLayerById(self.labelLayerId);
		if (labelLayer)
		{
			labelLayer.queryFeatures().then(function(featureSet)
			{
				if (featureSet.features.length > 0)
				{
					return labelLayer.applyEdits({ deleteFeatures: featureSet.features });
				}
			}).then(function()
			{
				var graphics = self._getGraphics();
				if (graphics && graphics.length)
				{
					labelLayer.applyEdits({ addFeatures: graphics });
				}
			});
		}
	};

	/**
	* get fake label feature layer source
	*/
	LabelDisplay.prototype._getGraphics = function()
	{
		var self = this;
		var labelFields = self._getFields();
		var graphicLayer = self.map.findLayerById(self.layerId);
		var source = graphicLayer.graphics.items;
		if (self.sourceModify)
		{
			source = self.sourceModify(source);
		}
		var graphics = source.map(function(graphic)
		{
			var attributes = {};
			var item = graphic.attributes.dataModel;

			labelFields.forEach(function(field)
			{
				attributes[field.fieldName] = ((field.getText ? field.getText(item) : item[field.fieldName]) || "").toString();
			});
			return new tf.map.ArcGIS.Graphic({
				geometry: graphic.geometry.clone(),
				attributes: attributes
			});
		});

		return graphics;
	};

	LabelDisplay.prototype._getFields = function()
	{
		return this.labelFields.concat([{
			name: "id",
			check: false,
			fieldName: 'id'
		}]);
	};

	LabelDisplay.prototype._buildExpression = function(labelOptions)
	{
		var expression = "";
		var separator = "' '";
		var fields = [];
		switch (labelOptions.separator)
		{
			case "Dash":
				separator = "'-'";
				break;
			case "Slash":
				separator = "'/'";
				break;
		}
		labelOptions.fields.forEach(function(field, index)
		{
			if (field.check)
			{
				var fieldExpress = "$feature." + field.fieldName;
				fields.push(fieldExpress);
				if (index > 0)
				{
					expression += "+" + separator + "+";
				}
				expression += fieldExpress;
			}
		});
		if (labelOptions.separator == "New Line")
		{
			return "return Concatenate([" + fields.join(",") + "], TextFormatting.NewLine)";
		}
		return "return " + expression;
	};

})();