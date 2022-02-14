/* Home button: click Home button to reset geometry to make home location in center of map */
!function ()
{
	createNamespace("TF.Form.Map").HomeTool = HomeTool;

	function HomeTool(routingMapTool)
	{
		var self = this;
		self.routingMapTool = routingMapTool;
		self.map = self.routingMapTool.routingMapDocumentViewModel._map;
		self.homeCoordinates = self.routingMapTool.routingMapDocumentViewModel.homeCoordinates;

		HomeTool.prototype.jumpToHome = function ()
		{
			const self = this;
			self.map.mapView.scale = 8000;
			self.map.mapView.goTo(self.homeCoordinates);
		}
	}
}()

/* My location button: click My location, map will jump to current location and make it in center */
!function ()
{

}()

/* Location marker */
!function ()
{
	createNamespace("TF.Form.Map").LocationMarkerTool = LocationMarkerTool;
	function LocationMarkerTool(routingMapTool)
	{
		var self = this;
		self.routingMapTool = routingMapTool;
		self.map = self.routingMapTool.routingMapDocumentViewModel._map;
		self.routeState = self.routingMapTool.routingMapDocumentViewModel.routeState;
		self.layer = self.map.findLayerById("locationMarker");
		self.symbolHelper = new TF.Map.Symbol();
	}

	LocationMarkerTool.prototype.drawMarker = function (locationMarker)
	{
		var self = this;
		//Clears all the graphics on layers since it may impact other graphic(pin/rectangle/polygon/circle) 
		self.layer.removeAll();
		switch (locationMarker)
		{
			case "Pin":
				if (self.sketchVM)
				{
					self.sketchVM.cancel();
				}
				if (!self.pinActive)
				{
					self.pinActive = true;
					self.cursorToPin();
					self.bindPinClickEvent();
					self.bindPinEscEvent();
				}
				break;
			case "Circle":
			case "Rectangle":
			case "Polygon":
			case "Draw":
				self.drawShape(locationMarker);
				break;
		}

		locationMarkerSelected(this.routingMapTool.$container, locationMarker);
	}

	LocationMarkerTool.prototype.cursorToPin = function ()
	{
		TF.Helper.MapHelper.setMapCursor(this.map, "pin");
		this.map.mapView.pining = true;
	};

	LocationMarkerTool.prototype.bindPinClickEvent = function ()
	{
		var self = this;
		self.mapClickEvent && self.mapClickEvent.remove();
		self.mapClickEvent = self.map.mapView.on("click", (event) =>
		{
			//Clears all the graphics on \s since it may impact other graphic(pin/rectangle/polygon/circle) 
			self.layer.removeAll();

			let pinIconOption = self.routingMapTool.routingMapDocumentViewModel.pinIconOption;
			let pinOption = {
				Symbol: pinIconOption.symbolNumber,
				Color: pinIconOption.symbolColor,
				Size: pinIconOption.symbolSize || 32,
				BorderColor: pinIconOption.borderColor || pinIconOption.symbolColor,
				BorderWidth: pinIconOption.borderSize || "1",
				IsWithBorder: pinIconOption.borderishow
			}

			self.pinGraphic = new tf.map.ArcGIS.Graphic({
				geometry: event.mapPoint,
				symbol: self.getSVGMarkSymbol(pinOption)
			});
			self.layer.add(self.pinGraphic);
			self.routingMapTool.routingMapDocumentViewModel.shapeDrawn && self.routingMapTool.routingMapDocumentViewModel.shapeDrawn();
			self.stopPin();
			self.enableTrashBtn();
		});
	};

	LocationMarkerTool.prototype.bindPinEscEvent = function ()
	{
		var self = this;
		tf.documentEvent.bind("keydown.pin", self.routeState, function (e)
		{
			if (e.key == "Escape")
			{
				self.stopPin();
			}
		});
	};

	LocationMarkerTool.prototype.getSVGMarkSymbol = function (setting)
	{
		var self = this, symbolNumber = setting.Symbol ? setting.Symbol : setting.symbol, pathString = self.getOriginSVGSymbolString(symbolNumber);
		if (symbolNumber === "-1")
		{
			return self.symbolHelper.pathSymbol(pathString, "transparent", "0", false);
		}
		else
		{
			return self.symbolHelper.pathSymbol(pathString, setting.Color ? setting.Color : setting.color, setting.Size ? setting.Size : setting.size,
				setting.IsWithBorder ? setting.IsWithBorder : setting.borderishow, setting.BorderColor ? setting.BorderColor : setting.bordercolor, setting.BorderWidth ? setting.BorderWidth : setting.bordersize);
		}
	};

	LocationMarkerTool.prototype.getOriginSVGSymbolString = function (symbolnumber)
	{
		let pathString = "", i = thematicSymbolPath.length - 1;
		if (symbolnumber === "-1")
		{
			pathString = thematicSymbolPath[0].pathString;
		}
		else
		{
			for (; i >= 0; i--)
			{
				if (thematicSymbolPath[i].id === Number(symbolnumber))
				{
					pathString = thematicSymbolPath[i].pathString;
				}
			}

		}
		return pathString;
	};

	LocationMarkerTool.prototype.cursorToDefault = function ()
	{
		TF.Helper.MapHelper.setMapCursor(this.map, "default");
		this.map.mapView.pining = false;
	};

	LocationMarkerTool.prototype.stopPin = function ()
	{
		this.cursorToDefault();
		tf.documentEvent.unbind("keydown.pin", this.routeState);
		this.mapClickEvent && this.mapClickEvent.remove();
		this.mapClickEvent = null;
		this.pinActive = false;

		locationMarkerUnSelected(this.routingMapTool.$container);
	};

	LocationMarkerTool.prototype.drawShape = function (type)
	{
		let self = this;
		if (!self.sketchVM)
		{
			intializeShapeDraw.bind(this)(type);
		}
		switch (type)
		{
			case "Circle":
				self.sketchVM.create("circle");
				break;
			case "Rectangle":
				self.sketchVM.create("rectangle");
				break;
			case "Polygon":
				self.sketchVM.create("polygon", { mode: "click" });
				break;
			case "Draw":
				self.sketchVM.create("polygon", { mode: "freehand" });
				break;
		}
	}

	LocationMarkerTool.prototype.enableTrashBtn = function ()
	{
		var self = this;
		if (self.routingMapTool.$mapToolBar)
		{
			self.routingMapTool.$mapToolBar.find('.trash').removeClass('disable');
		}
	}

	LocationMarkerTool.prototype.disableTrashBtn = function ()
	{
		var self = this;
		if (self.routingMapTool.$mapToolBar)
		{
			self.routingMapTool.$mapToolBar.find('.trash').addClass('disable');
		}
	}

	function CircleRadiusPanel($mapContainer)
	{
		const self = this;
		self.obStartLatLong = ko.observable(null);
		self.obEndLatLong = ko.observable(null);
		self.lengthUnitList =
			[
				{ "type": "meters", "text": "Meters" },
				{ "type": "feet", "text": "Feet" },
				// { "type": "yards", "text": "Yards" },
				// { "type": "kilometers", "text": "Kilometers" },
				// { "type": "miles", "text": "Miles" },
				// { "type": "nautical-miles", "text": "Nautical Miles" }
			];
		self.defaultLengthUnit = { "type": "meters", "text": "Meters" };
		self.obUnit = ko.observable("meters");
		self.shown = false;
		self.$circleRadiusPanel = $(`<div class="map-draw-circle-radius">
		<span>Radius:</span><span class="close">&times;</span>
		<div>
		<p class="radius-value"></p>
		<div class="radius-unit"><span data-bind="text: obSelectedUnit().text"></span><span class="down-arrow icon"></span></div>
		<div class="measurement-unit"></div>
		</div>`);
		$mapContainer.append(self.$circleRadiusPanel);
		self.$closeButton = self.$circleRadiusPanel.find(".close");
		self.$closeButton.click(function ()
		{
			self.close();
		});
		self.$radiusValue = self.$circleRadiusPanel.find("p.radius-value");
		self.$radiusUnit = self.$circleRadiusPanel.find("div.radius-unit");
		self.$radiusUnit.click(function (ev)
		{
			if (!self.$unitMenu)
			{
				var $el = self.createUnitMenu(self.lengthUnitList),
					$unitContainer = self.$circleRadiusPanel.find(".measurement-unit");
				self.$unitContainer = $unitContainer;
				self.$unitContainer.append($el);
				self.$unitMenu = $el;
				self.$radiusUnit.addClass("menu-opened");
			}
			self.$unitContainer.show();

			$(document.body).on("click.hideDistanceMenu", function (event)
			{
				if (self.$unitContainer.is(":visible") && event.target !== ev.target)
				{
					self.closeMeasurementUnitMenu();
					$(document.body).off("click.hideDistanceMenu");
				}
			})
		});
		self.obDistance = ko.computed(function ()
		{
			if (self.obStartLatLong() === null || self.obEndLatLong() === null)
			{
				return 0;
			}
			return tf.map.ArcGIS.geodesicUtils.geodesicDistance(
				new tf.map.ArcGIS.Point({ x: self.obStartLatLong()[0], y: self.obStartLatLong()[1] }),
				new tf.map.ArcGIS.Point({ x: self.obEndLatLong()[0], y: self.obEndLatLong()[1] }),
				self.obUnit()).distance;
		});
		self.obSelectedUnit = ko.observable(self.defaultLengthUnit);
		self.obSelectedUnit.subscribe(function (selectedUnit)
		{
			self.obUnit(selectedUnit.type);
		});
		self.obDistance.subscribe(function (distance)
		{
			self.$radiusValue.text(Math.round(distance) + "");
		});
		ko.applyBindings(self, self.$circleRadiusPanel[0]);
	}

	CircleRadiusPanel.prototype.reset = function ()
	{
		let self = this;
		self.obSelectedUnit(self.defaultLengthUnit);
	}

	CircleRadiusPanel.prototype.open = function ()
	{
		let self = this;
		if (!self.shown)
		{
			self.reset();
			self.shown = true;
			self.$circleRadiusPanel.show();
		}
	}

	CircleRadiusPanel.prototype.close = function ()
	{
		let self = this;
		self.$circleRadiusPanel.hide();
		self.shown = false;
	}

	CircleRadiusPanel.prototype.createUnitMenu = function (unitList)
	{
		let self = this, $li,
			$menu = $("<div></div>", { "class": "measurement-unit-menu" }),
			$ul = $("<ul></ul>", { "class": "unit-menu-list" });

		unitList.forEach(function (unit)
		{
			$li = $(`<li><span class='unit-menu-label'>${unit.text}</span></li>`);
			$li.on("click", self.onMeasurementUnitSelection.bind(self, unit));
			$ul.append($li);
		});

		$menu.append($ul);

		return $menu;
	}

	CircleRadiusPanel.prototype.onMeasurementUnitSelection = function (unit, evt)
	{
		var self = this;
		self.switchUnit(unit);
		self.closeMeasurementUnitMenu();
	};

	CircleRadiusPanel.prototype.closeMeasurementUnitMenu = function ()
	{
		var self = this;
		if (self.$unitMenu)
		{
			self.$unitMenu.remove();
			self.$unitMenu = null;
		}
	};

	CircleRadiusPanel.prototype.switchUnit = function (unit)
	{
		var self = this;
		if (self.obSelectedUnit().type !== unit.type)
		{
			self.obSelectedUnit(unit);
		}
	};

	CircleRadiusPanel.prototype.setStartLatLong = function (x, y)
	{
		const self = this;
		self.obStartLatLong(tf.map.ArcGIS.webMercatorUtils.xyToLngLat(x, y));
	}

	CircleRadiusPanel.prototype.setEndLatLong = function (x, y)
	{
		const self = this;
		self.obEndLatLong(tf.map.ArcGIS.webMercatorUtils.xyToLngLat(x, y));
	}

	function intializeShapeDraw()
	{
		const self = this;
		self.sketchVM = new tf.map.ArcGIS.SketchViewModel({
			view: self.map.mapView,
			layer: self.layer,
			updateOnGraphicClick: false,
			defaultUpdateOptions: { // set the default options for the update operations
				toggleToolOnClick: false // only reshape operation will be enabled
			},
			polygonSymbol: { //shape style
				type: "simple-fill",
				color: [18, 89, 208, 0.3],
				outline: {
					color: [18, 89, 208, 0.6],
					width: 1,
				}
			}
		});
		self.sketchVM && (self.sketchVM.vertexSymbol.size = 0);

		self.onCreateHandler = self.sketchVM.on("create", function (e)
		{
			if (e.state == "start")
			{
				if (e.tool == "circle")
				{
					if (!self.circleRadiusPanel)
					{
						self.circleRadiusPanel = new CircleRadiusPanel(self.routingMapTool.$container);
						self.routingMapTool.circleRadiusPanel = self.circleRadiusPanel;
					}
					self.circleRadiusPanel.setStartLatLong(...e.toolEventInfo.added);
				}
				else
				{
					if (self.circleRadiusPanel)
					{
						self.circleRadiusPanel.close();
					}
				}
			}
			else if (e.state == "active" && e.tool == "circle" && e.toolEventInfo.type == "cursor-update")
			{
				self.circleRadiusPanel.setEndLatLong(...e.toolEventInfo.coordinates);
				self.circleRadiusPanel.open();
			}
			else if (e.state == "complete")
			{
				self.routingMapTool.routingMapDocumentViewModel.shapeDrawn && self.routingMapTool.routingMapDocumentViewModel.shapeDrawn();
				//pouplate shape geometry as map question answer 
				self.enableTrashBtn();

				locationMarkerUnSelected(self.routingMapTool.$container)
			}
			else if (e.state == "cancel")
			{
				/*prevent cancel from SketchTool if required */
				locationMarkerUnSelected(self.routingMapTool.$container);
			}
		});
	}

	LocationMarkerTool.prototype.dispose = function ()
	{
		this.stopPin();
		this.routingMapTool = null;
		this.map = null;
		this.layer = null;
	};

	function locationMarkerSelected($mapContainer, locationMarker)
	{
		if (!$mapContainer || !$mapContainer.length || !locationMarker)
		{
			return;
		}

		locationMarkerUnSelected($mapContainer);

		let iconSelector = '';
		switch (locationMarker.toLocaleLowerCase())
		{
			case 'stoppin':
			case 'pin':
				iconSelector = '.toolbar-item-pin';
				break;
			case 'polygon':
				iconSelector = '.toolbar-item-polygon';
				break;
			case 'rectangle':
				iconSelector = '.toolbar-item-rectangle';
				break;
			case 'draw':
				iconSelector = '.toolbar-item-draw';
				break;
			case 'circle':
				iconSelector = '.toolbar-item-circle';
				break;
			default:
				break;
		}

		if (iconSelector)
		{
			$mapContainer.find(iconSelector).addClass('toolbar-item-selected');
		}
	}

	function locationMarkerUnSelected($mapContainer)
	{
		if (!$mapContainer || !$mapContainer.length)
		{
			return;
		}
		$mapContainer.find('.map-tool-bar-item').removeClass('toolbar-item-selected');
	}
}()


/* Trush: delete shape*/
!function ()
{
	createNamespace("TF.Form.Map").DeleteShapeTool = DeleteShapeTool;
	function DeleteShapeTool(routingMapTool)
	{
		var self = this;
		self.routingMapTool = routingMapTool;
		self.map = self.routingMapTool.routingMapDocumentViewModel._map;
		self.layer = self.map.findLayerById("locationMarker");

		DeleteShapeTool.prototype.removeShape = function ()
		{
			this.layer.removeAll();
			self.routingMapTool.routingMapDocumentViewModel.shapeDrawn && self.routingMapTool.routingMapDocumentViewModel.shapeDrawn();

			if (self.routingMapTool.$mapToolBar)
			{
				self.routingMapTool.$mapToolBar.find('.trash').addClass('disable');
			}
		}
	}
}()

/* My location:  draw icon on map to show current location*/
!function ()
{
	createNamespace("TF.Form.Map").MyLocationTool = MyLocationTool;
	function MyLocationTool(routingMapTool)
	{
		const self = this;
		self.routingMapTool = routingMapTool;
		self.map = self.routingMapTool.routingMapDocumentViewModel._map;
	}

	MyLocationTool.prototype.drawMyLocation = function ()
	{
		const self = this;
		TF.getLocation()
			.then(coord =>
			{
				if (coord.longitude && coord.latitude)
				{
					return coord;
				}
				else
				{
					return Promise.reject();
				}
			})
			.then(coord =>
			{
				var layer = self.map.findLayerById("myLocation");
				if (!layer)
				{
					layer = new tf.map.ArcGIS.GraphicsLayer({ id: "myLocation" });
					self.map.add(layer);
				}

				layer.removeAll(); // clear exsiting shape
				var svg = `<svg xmlns="http://www.w3.org/2000/svg" height="{0}px" viewBox="0 0 24 24" width="{1}px" fill="{2}"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M17.27 6.73l-4.24 10.13-1.32-3.42-.32-.83-.82-.32-3.43-1.33 10.13-4.23M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/></svg>`;
				let myLocationPoint = new tf.map.ArcGIS.Point({ x: coord.longitude, y: coord.latitude });
				let fillColor = '#000000';
				const darkBasemaps = ['satellite', 'dark-gray-vector', 'hybrid', 'dark-gray', 'national-geographic'];
				if (darkBasemaps.indexOf(self.map.basemap) != -1)
				{
					fillColor = '#007dea';
				}
				const coordGeometry = tf.map.ArcGIS.webMercatorUtils.geographicToWebMercator(myLocationPoint);
				let myLocationGraphic = new tf.map.ArcGIS.Graphic({
					geometry: coordGeometry,
					symbol: new tf.map.ArcGIS.PictureMarkerSymbol({
						url: `data:image/svg+xml;charset=UTF-8;base64,${btoa(String.format(svg, 32, 32, fillColor))}`,
						width: "32px",
						height: "32px",
					})
				});
				layer.add(myLocationGraphic);
				self.map.mapView.goTo(coordGeometry);
			});
	}
}()
