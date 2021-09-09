/* Home button: click Home button to reset geometry to make home location in center of map */
!function()
{
	createNamespace("TF.Form.Map").HomeTool = HomeTool;

	function HomeTool(routingMapTool)
	{
		var self = this;
		self.routingMapTool = routingMapTool;
		self.map = self.routingMapTool.routingMapDocumentViewModel._map;
		self.homeCoordinates = self.routingMapTool.routingMapDocumentViewModel.homeCoordinates;

		HomeTool.prototype.jumpToHome = function() 
		{
			let self = this;
			self.map.mapView.scale = 8000;
			self.map.mapView.goTo(self.homeCoordinates);
		}
	}
}()

/* Location marker */
!function()
{
	createNamespace("TF.Form.Map").LocationMarkerTool = LocationMarkerTool;
	function LocationMarkerTool(routingMapTool)
	{
		var self = this;
		self.routingMapTool = routingMapTool;
		self.map = self.routingMapTool.routingMapDocumentViewModel._map;
		self._mapView = self.map.mapView;
		self.routeState = self.routingMapTool.routingMapDocumentViewModel.routeState;
		self.layer = self.map.findLayerById("locationMarker");
		self.symbolHelper = new TF.Map.Symbol();	
		self.isDrawing = false;
		self.currentLocationMaker = null;
		self.selectedGraphic = null;
		self.tmpGraphic = null;
		self.isOrientationChange = false;
		self.rawScreenPoints = [];
		if (TF.isMobileDevice)
		{
			self.bindMapEvents(); // for mobile drawing marker
		}
	}

	LocationMarkerTool.prototype.bindMapEvents = function()
	{
		let self = this;
		self.selectedGraphic = null;
		self.tmpGraphic = null;
		self.rawScreenPoints = [];

		self._mapView.on('drag', e =>
		{
			if (!self.isDrawing)
			{
				return;
			}
			if (e.action === 'start')
			{
				// for save the screen point first time
				self.updateSelectedGraphic();
			}
		})

		self._mapView.watch("extent", function(e)
		{
			if (!self.isDrawing)
			{
				return;
			}

			// OrientationChange: do not transform point; need to update selectedGraphic
			if (self.isOrientationChange && self.isDrawing)
			{
				self.selectedGraphic = null;
				self.rawScreenPoints = [];
				self.isOrientationChange = false;
				return;
			}

			self.updateSelectedGraphic();

			// transform the screen point to map point
			if (self.selectedGraphic && self.map && self.map.mapView.extent)
			{
				self.layer.graphics.remove(self.selectedGraphic);
				if (self.tmpGraphic)
				{
					self.layer.graphics.remove(self.tmpGraphic);
					self.tmpGraphic = null;
				}
				self.tmpGraphic = self.selectedGraphic.clone();
				if (self.currentLocationMaker === "Pin")
				{
					self.translatePin(self.rawScreenPoints, self._mapView.center, self.tmpGraphic.geometry);
				} else
				{
					self.translatePolygon(self.rawScreenPoints, self._mapView.center, self.tmpGraphic.geometry);
				}
				self.layer.graphics.add(self.tmpGraphic);
			}
		});


		$(window).off("orientationchange.mapIsMobileDevice")
			.on("orientationchange.mapIsMobileDevice", () =>
			{
				//self.endingDrawMarker(); // todo: this is simple way to end the editing status	
				self.isOrientationChange = true;
			});
	}

	LocationMarkerTool.prototype.updateSelectedGraphic = function(forceUpdated)
	{
		let self = this;
		if (!self.selectedGraphic || forceUpdated)
		{
			// get the initial graphics
			self.selectedGraphic = self.layer.graphics._items[0];
			if (!self.selectedGraphic)
			{
				return;
			}
			if (self.selectedGraphic && self.selectedGraphic.geometry.spatialReference.isWGS84)
			{
				self.selectedGraphic.geometry = webMercatorUtils.geographicToWebMercator(self.selectedGraphic.geometry);
			}

			// get raw screen point 
			self.rawScreenPoints = [];
			let mapPoint = null;
			if (self.currentLocationMaker === "Pin")
			{
				mapPoint = {
					x: self.selectedGraphic.geometry.x,
					y: self.selectedGraphic.geometry.y,
					spatialReference: self.selectedGraphic.geometry.spatialReference
				};
				self.rawScreenPoints.push(self._mapView.toScreen(mapPoint));
			} else
			{
				if (self.selectedGraphic && self.selectedGraphic.geometry)
				{
					self.selectedGraphic.geometry.rings.forEach(ring =>
					{
						if (Array.isArray(ring[0]))
						{
							ring.forEach(coord =>
							{
								mapPoint = {
									x: coord[0],
									y: coord[1],
									spatialReference: self.selectedGraphic.geometry.spatialReference
								};
								self.rawScreenPoints.push(self._mapView.toScreen(mapPoint));
							});
						} else
						{
							mapPoint = {
								x: ring[0],
								y: ring[1],
								spatialReference: self.selectedGraphic.geometry.spatialReference
							};
							self.rawScreenPoints.push(self._mapView.toScreen(mapPoint));
						}
					});
				}
			}

		}
	}

	LocationMarkerTool.prototype.translatePin = function(rawScreenPoints, currPoint, polygon)
	{
		let self = this;
		let mapPoint = self._mapView.toMap({ x: rawScreenPoints[0].x, y: rawScreenPoints[0].y });
		polygon.x = mapPoint.x;
		polygon.y = mapPoint.y;
	}

	LocationMarkerTool.prototype.translatePolygon = function(rawScreenPoints, currPoint, polygon)
	{
		let self = this;
		let mapPoint = null;
		polygon.rings.forEach(ring =>
		{
			if (Array.isArray(ring[0]))
			{
				let index = 0;
				ring.forEach(coord =>
				{
					mapPoint = self._mapView.toMap({ x: rawScreenPoints[index].x, y: rawScreenPoints[index].y });
					coord[0] = mapPoint.x;
					coord[1] = mapPoint.y;
					index++;
				});
			} else
			{
				mapPoint = self._mapView.toMap({ x: rawScreenPoints[index].x, y: rawScreenPoints[index].y });
				ring[0] = mapPoint.x;
				ring[1] = mapPoint.y;
			}
		});
	}

	LocationMarkerTool.prototype.drawMarker = function(locationMarker)
	{
		let self = this;
		// add save button for mobile 
		if (TF.isMobileDevice)
		{
			let mapContainer = self.routingMapTool.$container;
			self.selectedGraphic = null;
			self.tmpGraphic = null;
			self.isDrawing = true;
			self.currentLocationMaker = locationMarker;
			if (self.sketchVM)
			{
				self.sketchVM.updateOnGraphicClick = true;
				self.sketchVM.defaultUpdateOptions.toggleToolOnClick = true;
			}

			let saveBtn = $("<div class='confirm-location-mark exit'>Exit</div>");
			mapContainer.append(saveBtn);
			saveBtn.hide();
			saveBtn.on("click", function(e)
			{
				// todo check layer has graphic or not
				self.routingMapTool.$container.find(".expand-button").click();
				if (self.sketchVM)
				{
					self.sketchVM.updateOnGraphicClick = false;
					self.sketchVM.defaultUpdateOptions.toggleToolOnClick = false;
				}
				self.isDrawing = false;
				self.currentLocationMaker = null;
				saveBtn.remove();
			})
		}
		switch (locationMarker)
		{
			case "Pin":
				if (this.sketchVM)
				{
					this.sketchVM.cancel();
				}
				if (!this.pinActive)
				{
					this.pinActive = true;
					this.cursorToPin();
					this.bindPinClickEvent();
					this.bindPinEscEvent();
				}
				break;
			case "Circle":
			case "Rectangle":
			case "Polygon":
			case "Draw":
				this.drawShape(locationMarker);
				break;
		}
	}

	LocationMarkerTool.prototype.endingDrawMarker = function()
	{
		let self = this;
		let saveBtn = self.routingMapTool.$container.find(".confirm-location-mark");
		self.selectedGraphic = null;
		self.tmpGraphic = null;
		self.rawScreenPoints = null;
		self.isDrawing = false;
		self.currentLocationMaker = null;
		if (self.sketchVM)
		{
			self.sketchVM.updateOnGraphicClick = false;
			self.sketchVM.defaultUpdateOptions.toggleToolOnClick = false;
			self.sketchVM.cancel();
		}
		if (saveBtn.length > 0)
		{
			saveBtn.remove();
		}
	}

	LocationMarkerTool.prototype.cursorToPin = function()
	{
		TF.Helper.MapHelper.setMapCursor(this.map, "pin");
		this.map.mapView.pining = true;
	};

	LocationMarkerTool.prototype.bindPinClickEvent = function()
	{
		var self = this;
		self.mapClickEvent && self.mapClickEvent.remove();
		self.mapClickEvent = self.map.mapView.on("click", (event) =>
		{
			//Clears all the graphics on \s since it may impact other graphic(pin/rectangle/polygon/circle) 
			self.layer.removeAll();
			let pinIconOption = self.routingMapTool.routingMapDocumentViewModel.pinIconOption;
			let borderColor = null, borderSize = null;
			if (pinIconOption.isWithBorder) {
				borderColor = pinIconOption.borderColor || "#000000";
				borderSize = pinIconOption.borderSize || "1";
			}
			let pinOption = {
				Symbol: pinIconOption.symbolNumber,
				Color: pinIconOption.symbolColor,
				Size: pinIconOption.symbolSize || 32,
				BorderColor: borderColor,
				BorderWidth: borderSize,
				IsWithBorder: pinIconOption.isWithBorder
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

	LocationMarkerTool.prototype.bindPinEscEvent = function()
	{
		var self = this;
		tf.documentEvent.bind("keydown.pin", self.routeState, function(e)
		{
			if (e.key == "Escape")
			{
				self.stopPin();
			}
		});
	};

	LocationMarkerTool.prototype.cursorToDefault = function()
	{
		TF.Helper.MapHelper.setMapCursor(this.map, "default");
		this.map.mapView.pining = false;
	};

	LocationMarkerTool.prototype.stopPin = function()
	{
		this.cursorToDefault();
		tf.documentEvent.unbind("keydown.pin", this.routeState);
		this.mapClickEvent && this.mapClickEvent.remove();
		this.mapClickEvent = null;
		this.pinActive = false;
		this.isDrawing = false;
	};

	LocationMarkerTool.prototype.drawShape = function(type)
	{
		let self = this;
		//Clears all the graphics on layers since it may impact other graphic(pin/rectangle/polygon/circle) 
		self.layer.removeAll();
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

	LocationMarkerTool.prototype.getSVGMarkSymbol = function (setting) {
		var self = this, symbolNumber = setting.Symbol ? setting.Symbol : setting.symbol, pathString = self.getOriginSVGSymbolString(symbolNumber);
		if (symbolNumber === "-1") {
			return self.symbolHelper.pathSymbol(pathString, "transparent", "0", false);
		}
		else {
			return self.symbolHelper.pathSymbol(pathString, setting.Color ? setting.Color : setting.color, setting.Size ? setting.Size : setting.size,
				setting.IsWithBorder ? setting.IsWithBorder : setting.borderishow, setting.BorderColor ? setting.BorderColor : setting.bordercolor, setting.BorderWidth ? setting.BorderWidth : setting.bordersize);
		}
	};

	LocationMarkerTool.prototype.getOriginSVGSymbolString = function (symbolnumber) {
		var self = this, pathString = "", i = thematicSymbolPath.length - 1;
		if (symbolnumber === "-1") {
			pathString = thematicSymbolPath[0].pathString;
		}
		else {
			for (; i >= 0; i--) {
				if (thematicSymbolPath[i].id === Number(symbolnumber)) {
					pathString = thematicSymbolPath[i].pathString;
				}
			}

		}
		return pathString;
	};

	LocationMarkerTool.prototype.enableTrashBtn = function()
	{
		var self = this;
		if (self.routingMapTool.$mapToolBar)
		{
			self.routingMapTool.$mapToolBar.find('.trash').removeClass('disable');
		}
	}

	function intializeShapeDraw()
	{
		let self = this;
		self.sketchVM = new tf.map.ArcGIS.SketchViewModel({
			view: self.map.mapView,
			layer: self.layer,
			updateOnGraphicClick: TF.isMobileDevice && self.isDrawing,
			//updateOnGraphicClick: false,
			defaultUpdateOptions: { // set the default options for the update operations
				toggleToolOnClick: TF.isMobileDevice && self.isDrawing // only reshape operation will be enabled
				//toggleToolOnClick:false,
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

		// for updating the screen point
		self.sketchVM.on("update", function()
		{
			self.checkGraphicUpdate();
		});

		self.onCreateHandler = self.sketchVM.on("create", function(e)
		{
			if (e.state == "complete")
			{
				self.routingMapTool.routingMapDocumentViewModel.shapeDrawn && self.routingMapTool.routingMapDocumentViewModel.shapeDrawn();
				//pouplate shape geometry as map question answer 
				self.enableTrashBtn();
				self.isDrawing = false;
			}
			else if (e.state == "cancel")
			{
				/*prevent cancel from SketchTool if required */
			}
		});
	}

	LocationMarkerTool.prototype.checkGraphicUpdate = function()
	{
		let self = this;
		self.updateSelectedGraphic(true);
	}

	LocationMarkerTool.prototype.dispose = function()
	{
		this.stopPin();
		this.routingMapTool = null;
		this.map = null;
		this.layer = null;
		$(window).off("orientationchange.mapIsMobileDevice");
	};
}()


/* Trush: delete shape*/
!function()
{
	createNamespace("TF.Form.Map").DeleteShapeTool = DeleteShapeTool;
	function DeleteShapeTool(routingMapTool)
	{
		var self = this;
		self.routingMapTool = routingMapTool;
		self.map = self.routingMapTool.routingMapDocumentViewModel._map;
		self.layer = self.map.findLayerById("locationMarker");

		DeleteShapeTool.prototype.removeShape = function()
		{
			this.layer.removeAll();
			self.routingMapTool.routingMapDocumentViewModel.shapeDrawn && self.routingMapTool.routingMapDocumentViewModel.shapeDrawn();
			if (TF.isMobileDevice && self.routingMapTool && self.routingMapTool.locationMarkerTool)
			{
				self.routingMapTool.locationMarkerTool.endingDrawMarker();
			}

			if (self.routingMapTool.$mapToolBar)
			{
				self.routingMapTool.$mapToolBar.find('.trash').addClass('disable');
			}
		}
	}
}()

/* My location:  draw icon on map to show current location*/
!function()
{
	createNamespace("TF.Form.Map").MyLocationTool = MyLocationTool;
	function MyLocationTool(routingMapTool)
	{
		const self = this;
		self.routingMapTool = routingMapTool;
		self.map = self.routingMapTool.routingMapDocumentViewModel._map;
	}

	MyLocationTool.prototype.drawMyLocation = function()
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