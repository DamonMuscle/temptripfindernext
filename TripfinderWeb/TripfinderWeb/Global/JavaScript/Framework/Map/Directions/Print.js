(function()
{
	// Default options.
	var defaultOptions = {
		showBaseMap: false,// Include base map.
		showStopMap: false,// Include small map, and gets map html of stop direction.
		showTurnByTurnMap: false,// Include small map, and gets map html of turn-by-turn direction.
		arcgis: null,// Arcgis.
		map: null,// map
		baseMapWidth: 800,// The width of base map.
		baseMapHeight: 500,// The height of base map.  
		MapDefaultBasemap: "streets-vector",
		graphicLayers: [],// Graphic layers.
		PrintDivId: "direction-print",
		ProgressDivId: "direction-progress",
		LoadingSrc: "../../Global/img/Spinner-White.gif",// Loading image src.
		StopPoints: []// Stop point array.
	};

	// Loading page.
	var progress = {
		_text: "Loading Maps ...",
		_index: 0,
        /**
         * Show loading page.
         */
		show: function(options, text, count)
		{
			this._index = 0;
			var wordHtml = (text ? text : this._text) + (count ? " <span class='count'>" + this._index + "</span> / " + count : "");
			// Update loading message.
			if ($("#" + options.ProgressDivId + "").length > 0)
			{
				$("#" + options.ProgressDivId + "").find(".progress-text").html(wordHtml);
			}
			else
			{// Create loading message.
				var outerHtml = "<div id='" + options.ProgressDivId + "' class='direction-progress'>" +
					"<div class='overlay'>" +
					"<div class='progressbar'>" + "<img class='spinner' src='" + options.LoadingSrc + "'><span class='progress-text'>" + wordHtml + "</span></div>";
				"</div>" +
					"</div>";
				$("body").append(outerHtml);
			}
		},

        /**
         * Hide loading page.
         */
		hide: function(options)
		{
			this._index = 0;
			$("#" + options.ProgressDivId + "").remove();
		},

        /**
         * Update loading message.
         */
		update: function(options)
		{
			this._index += 1;
			var $count = $("#" + options.ProgressDivId + "").find(".progressbar .count");
			if ($count.length > 0)
				$count.text(this._index);
		}
	};

	// Global object.
	var map,
		pagedMedia = null,
		Sequence = null,
		throughSequence = null;

    /**
     * Before Print.
     * @param {object} direction info.
     * @param {object} print options.
     * @returns {promise} append the print html finish.
     */
	function BeforePrint(directionInfo, options)
	{
		UpdatePagedMedia();

		var directions = directionInfo.directions,
			$html = $("<div id='" + options.PrintDivId + "' class='direction-print'></div>");

		if (!directionInfo || !directionInfo.directions)
			return Promise.resolve();

		// The head of print html.
		var headHtml = "<div class='direction-head-print'>" +
			"<div class='direction-head-left-print'>Route: " + directions[0].Instruction + " - " + directions[directions.length - 1].Instruction + "</div>" +
			"<div class='direction-head-right-print'>" +
			(directionInfo.totalDistance ? "<div class='direction-total-distance-print'>" + directionInfo.totalDistance + "</div>" : "") +
			(directionInfo.totalTime ? "<div class='direction-total-time-print'>" + directionInfo.totalTime + "</div>" : "") +
			"</div>" + "</div>";
		$html.append(headHtml);

		// Append base map html.
		return GetBaseMapHtml(directionInfo, options).then(function(baseMapHtml)
		{
			$html.append(baseMapHtml);
			// Append direction info html.
			return GetDirectionsHtml(directions, options).then(function(directionsHtml)
			{
				$html.append("<div class='directions-info directions-info-print'>" + directionsHtml + "</div>");
				//remove original map, fix shows two maps bug. 
				$(map.mapView.container).remove();
				$("body").append($html[0].outerHTML);
				progress.hide(options);
			});
		});
	}

    /**
     * Print finish.
     * @param {object} print options.
     */
	function AfterPrint(options)
	{
		$("#" + options.PrintDivId + "").remove();
		RestorePageMedia();
		// Destroy base map.
		if (map)
		{
			map.removeAll();
			$(map.mapView.container).remove();
			map.mapView = null;
			map = null;
		}
	}

    /**
     * Remove the page media.
     */
	function UpdatePagedMedia()
	{
		var page = document.getElementById("default-print");
		if (page)
		{
			pagedMedia = page;
			page.remove();
		}
	}

    /**
     * Restore the page media, the page media is used for print setting style.
     */
	function RestorePageMedia()
	{
		if (pagedMedia)
		{
			document.head.appendChild(pagedMedia);
			pagedMedia = null;
		}
	}

    /**
     * Gets the html of base map, then base map zoom to the extent and record it into a dom element, the extent of base map need to includes all layers. 
     * @returns {Promise} html of base map.
     */
	function GetBaseMapHtml(directionInfo, options)
	{
		if (!options.showBaseMap)
		{
			return Promise.resolve("");
		}
		// Gets all graphics from graphic layers
		return getMapImage(directionInfo.directions.map(function(c) { return c.Geometry; }), map, "base-map-print").then(function(baseMapHtml)
		{
			return baseMapHtml;
		});
	}

    /**
     * Gets the html of all directions.
     * @param {array} all directions.
     * @param {object} print options.
     * @returns {Promise} html of all directions.
     */
	function GetDirectionsHtml(directions, options)
	{
		var $directionsHtml = $("<div class='directions-details directions-details-print'></div>"),
			$elementListHtml = $("<div class='directions-elementList'></div>");
		return new Promise(function(resolve)
		{
			// Include small map
			if (options.arcgis && (options.showStopMap || options.showTurnByTurnMap))
			{
				RecursionDirections(directions, options, $elementListHtml).then(function()
				{
					ClearThroughSequence();// Clear record of sequence and through sequence.
					$directionsHtml.append($elementListHtml[0]);
					resolve($directionsHtml[0].outerHTML);
				});
			}
			else
			{
				$elementListHtml.append(ForeachDirections(directions));
				$directionsHtml.append($elementListHtml[0]);
				resolve($directionsHtml[0].outerHTML);
			}
		});
	}

    /**
     * Gets the html of all directions which do not include small map.
     * @param {array} all directions.
     * @returns {string} html of all directions.
     */
	function ForeachDirections(directions)
	{

		var $itemHtml = $("<div></div>"), index = 0, length = directions.length;

		directions.map(function(item)
		{
			// Append direction info html.
			$itemHtml.append(GetDetailHtml(item, index === length - 1));
			index += 1;
		});

		return $itemHtml[0].innerHTML;
	}

    /**
     * Gets the html of all directions include small map, the small map zoom to the direction extent and record it into a dom element.
     * @param {array} all directions.
     * @param {object} print options.
     * @param {int} the index of directions.
     * @returns {promise} html of all directions.
     */
	function RecursionDirections(directions, options, elementListHtml)
	{
		return TF.seriesRun(directions, 1, function(direction, index)
		{
			var item = direction[0],
				$itemHtml = $("<div class='direction-detail-group-print'></div>"),
				info = {
					item: item,
					isLast: index === directions.length - 1,
					isFirst: index === 0,
					index: index
				};
			// Append direction info html.
			$itemHtml.append(GetDetailHtml(item, info.isLast));

			var mapDeferred = Promise.resolve("");
			if (options.showStopMap && !options.showTurnByTurnMap)
			{
				mapDeferred = GetStopMapHtml(info, options);
			}
			else if (!options.showStopMap && options.showTurnByTurnMap)
			{
				mapDeferred = GetTurnByTurnMapHtml(info, options);
			}
			else if (options.showStopMap && options.showTurnByTurnMap)
			{
				mapDeferred = GetStopMapHtml(info, options).then(function(mapHtml)
				{
					if (mapHtml !== "")
						return mapHtml;
					else
						return GetTurnByTurnMapHtml(info, options);
				});
			}
			return mapDeferred.then(function(mapHtml)
			{
				if (mapHtml !== "")
				{
					progress.update(options);// Update loading message
					$itemHtml.append(mapHtml);
				}
				elementListHtml.append($itemHtml);
			});
		}, true);
	}

	/**
	 * Gets the html of direction info.
	 * @param {object} single direction info. 
	 * @param {boolean} check direction is the lasted direction.
	 * @returns {string} html of direction info.
	 */
	function GetDetailHtml(item, isLast)
	{
		var css = "directions-element";
		if (item.Type == 'esriDMTDepart' || item.Type == 'esriDMTStop')
		{
			css += " directions-element-stop";
		}

		var html = '<div class="' + css + '">';
		html += "<canvas class='symbol " + item.Type + "' height='24' width='24'></canvas>";
		html += '<div class="symbol ' + item.Type + (isLast ? " last-child" : "") + '">' + (item.Sequence ? item.Sequence : "") + '</div>';
		html += '<div class="text">';
		html += '<div class="instruction">' + item.Instruction + '</div>';
		html += '<div class="distance">' + item.Distance + '</div>';
		html += '<div class="time">' + item.Time + '</div>';
		html += '</div>';
		html += '<div class="vertical-line' + (isLast ? " last-child" : "") + '"></div>';
		html += '</div>';
		return html;
	}

	/**
	 * Gets the html of small map, the small map used by stop direction.
	 * @param {object} single direction info. 
	 * @param {object} print options.
	 * @returns {promise} gets the html small map.
	 */
	function GetStopMapHtml(info, options)
	{
		var promise = Promise.resolve("");
		if (options.showStopMap && options.arcgis)
		{
			// Only the first stop direction, the arrive stop direction and the through stop direction have small map.
			if (info.isFirst || info.item.Type === "esriDMTStop" || info.item.Type === "throughPoint")
			{
				promise = GetSmallMapHtml(info, options);
			}
		}
		return promise;
	}

	/**
	 * Gets the html of small map, the small map used by turn-by-turn direction.
	 * @param {object} single direction info. 
	 * @param {object} print options.
	 * @returns {promise} gets the html small map.
	 */
	function GetTurnByTurnMapHtml(info, options)
	{
		var promise = Promise.resolve("");
		if (options.showTurnByTurnMap && options.arcgis)
		{
			// The middle stops have two directions, the depart direction has not small map.
			if (info.item.Type !== "esriDMTDepart")
			{
				promise = GetSmallMapHtml(info, options);
			}
		}
		return promise;
	}

	/**
	 * Gets the html of small map, record a state of the small map into a dom element.
	 * @param {object} single direction info. 
	 * @param {object} print options.
	 * @returns {promise} set extent finish.
	 */
	function GetSmallMapHtml(info, options)
	{
		var graphics = [new options.arcgis.Graphic(info.item.Geometry)];// The graphics for set extent in small map.

		// If the direction is a stop direction, push the stop point into graphics.
		if (info.item.Sequence && info.item.Sequence <= options.StopPoints.length)
		{
			graphics.push(new options.arcgis.Graphic(options.StopPoints[info.item.Sequence - 1].Geometry));
			Sequence = info.item.Sequence;// Record the number of stop point sequence.
			throughSequence = 0;// Reset the number of through sequence.
		}
		else if (info.item.Type === "throughPoint")
		{ // If the direction is a through direction, push the through point into graphics.
			var graphic = CreateThroughGraphic(options);
			if (graphic)
			{
				graphics.push(graphic);
			}
		}

		return getMapImage(graphics.map(function(g) { return g.geometry; }), map, "").then(function(smallMapHtml)
		{
			return smallMapHtml + (!info.isLast ? "<div class='vertical-line'></div>" : "");
		});
	}

	function getMapImage(geometries, map, cssClass)
	{
		return goTo(geometries, map).then(function()
		{
			var param = {
				'format': 'png'
			};
			return map.mapView.takeScreenshot(param).then(function(screenshot)
			{
				var src = screenshot.dataUrl,
					data = screenshot.data,
					width = data.width,
					height = data.height;

				return String.format("<img class='direction-map-print {3}' width='{0}' height='{1}' src='{2}'>", width, height, src, cssClass);
			});
		});
	}

	function goTo(geometries, map)
	{
		var extent = TF.RoutingMap.EsriTool.getMaxExtent(geometries, map).expand(2), updatingEvent = null;
		return map.mapView.goTo(extent, { duration: 0 }).then(function()
		{
			return new Promise(function(resolve)
			{
				var finished = false;
				var timeout = setTimeout(function()
				{
					if (!finished)
					{
						resolve();
					}
				}, 1300);
				updatingEvent = map.mapView.watch('updating', function(response)
				{
					if (!response)
					{
						clearTimeout(timeout);
						updatingEvent.remove();
						setTimeout(function()
						{
							finished = true;
							resolve();
						}, 500);
					}
				});

			});
		});
	}

	/**
	 * Gets count of small map image need to be created.
	 * @param {object} all directions. 
	 * @param {object} print options.
	 * @returns {int} count.
	 */
	function GetSmallMapCount(directions, options)
	{
		var count = 0;
		if (options.showStopMap && options.showTurnByTurnMap)
		{
			// The count of stop directions and turn-by-turn directions.
			count = directions.filter(function(o) { return o.Type !== "esriDMTDepart"; }).length + 1;
		}
		else if (options.showStopMap)
		{
			// The count of stop directions.
			count = directions.filter(function(o) { return o.Type === "esriDMTStop" || o.Type === "throughPoint"; }).length + 1;
		}
		else if (options.showTurnByTurnMap)
		{
			// The count of turn-by-turn directions.
			count = directions.filter(function(o) { return o.Type !== "esriDMTDepart"; }).length;
		}
		return count;
	}

	/**
	 * Create a new graphic of through point.    
	 * @param {object} print options.
	 */
	function CreateThroughGraphic(options)
	{
		// Gets through point info from stop point array.
		var throughPoints = options.StopPoints[Sequence - 1]["ThroughPoints"], graphic;
		if (throughPoints && throughPoints.length > 0)
		{
			graphic = new options.arcgis.Graphic(throughPoints[throughSequence].Geometry);
		}
		// Through sequence number plus. 
		throughSequence += 1;
		return graphic;
	}

	/**
	 * Clear sequence number and through sequence number.
	 */
	function ClearThroughSequence()
	{
		Sequence = null;
		throughSequence = null;
	}

	/**
	   * Add graphics layers into map.
	   * @param {object} print options.
	   * @param {object} the map which add layers into it.
	   */
	function CreateGraphicLayers(options, map)
	{
		var newLayer, newGraphic, newLayers = [];

		// All layers which will added into map.
		// Because the layers added into two or more map, the layers behavior will be break.
		// So must be create new layer and new graphic into every map.
		options.graphicLayers.map(function(layer)
		{
			// Create new graphics layer.
			newLayer = new options.arcgis.GraphicsLayer({ 'id': 'print' + layer.id });

			layer.graphics.map(function(graphic)
			{
				// Create new graphic.
				newGraphic = new options.arcgis.Graphic(graphic.geometry, graphic.symbol, graphic.attributes);
				newLayer.add(newGraphic);
			});
			newLayers.push(newLayer);
		});

		map.addMany(newLayers);
	}

	/**
	 * Create and load map, if need be.
	 * @param {object} direction info.
	 * @param {object} print options.
	 * @returns {promise} base map and small map loaded finish.
	 */
	function LoadMap(directions, options)
	{
		// Show loading page.
		progress.show(options, "Loading maps ...", GetSmallMapCount(directions, options));

		var id = "direction-basemap-print";
		var mapContainer = $('<div id="' + id + '" ></div>');
		mapContainer.css({
			position: "absolute",
			right: 0,
			top: 0,
			width: options.baseMapWidth,
			height: options.baseMapHeight
		});

		// Create a dom which is used for map.
		$("body").append(mapContainer);

		// Create a new arcgis map.
		map = new options.arcgis.Map({
			basemap: ["white-canvas"].indexOf(options.MapDefaultBasemap.id) >= 0 ? defaultOptions.MapDefaultBasemap : options.MapDefaultBasemap // white canvas can not print, so exclude it
		});
		var mapView = new options.arcgis.MapView({
			container: id,
			extent: options.map.mapView.extent,
			map: map
		});
		map.mapView = mapView;
		mapView.ui.components = [];

		// Add the layers into base map.
		if (options.graphicLayers.length > 0)
		{
			CreateGraphicLayers(options, map);
		}

		return new Promise(function(resolve)
		{
			// make sure graphics is loaded
			options.arcgis.watchUtils.whenFalseOnce(mapView, 'updating', function()
			{
				var layer = map.layers.items[0];
				mapView.whenLayerView(layer).then(function(layerView)
				{
					options.arcgis.watchUtils.whenFalseOnce(layerView, 'updating', function()
					{
						layerView.queryGraphics().then(function()
						{
							// make sure base map is loaded
							setTimeout(function()
							{
								resolve();
							}, 2000);
						});
					});
				});
			});
		});
	}

	// The object for print direction info.
	var DirectionPrint = {
		/**
		 * Print event.
		 * @param {object} direction info, object construction { directions {object}, totalTime {string?}, totalDistance {string?} }.
		 * @param {object} print options, construction is same to defaultOptions.
		 */
		print: function(directionInfo, options)
		{
			// Extend options
			options = $.extend({}, defaultOptions, options);

			LoadMap(directionInfo.directions, options).then(function()
			{
				// Create html code into a new div dom, this dom is used for window print.
				BeforePrint(directionInfo, options).then(function()
				{
					// Use window print.
					window.print();
					// Destroy the map(s) which is(are) used for print, remove the dom which is used for print.
					AfterPrint(options);
				});
			});
		}
	};

	createNamespace("TF.Map.Directions").Print = DirectionPrint;
})();