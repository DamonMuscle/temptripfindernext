/**
* Map symbol for ArcGIS API for Javascript 4.X
*/

(function()
{
	createNamespace("TF.Map").Symbol = MapSymbol;

	function MapSymbol()
	{
		this.ArcGIS = tf.map.ArcGIS;

		this.Str_SimpleMarker = 'simple-marker';
		this.Str_DataImageSvg = 'data:image/svg+xml;charset=UTF-8;base64,';
		this.Str_SimpleFill = 'simple-fill';
		this.Str_SimpleLine = 'simple-line';
		this.default = {
			color: "#FF5500",
			alpha: 0.75
		};
		this.selectionColor = "#B0FFFF";

		this._colorList = ["#FF0800", "#8800FF", "#3333FF", "#FF6700", "#FF00FF", "#00FFFF", "#73D952", "#FFFF00",
			"#AA0000", "#0000A2", "#CC5200", "#E10087", "#00CCCC", "#006600", "#FFCC00", "#D47F7F", "#7F7FD0", "#E5A87F", "#F07FC3", "#7FE5E5", "#7FB27F", "#FFE57F"];

		this.symbolColors = {
			blueForSelect: [39, 147, 226],
			orangeForCreate: [255, 168, 80],
			yellowForHighlight: [255, 255, 0],
			grayForEditing: [90, 90, 90],
			bluePoint: [0, 51, 204],
			greenPoly: [0, 136, 0]
		};

		this.offSetX = 16;
		this.offSetY = 8;
	}

	MapSymbol.prototype.school = function(hexColor, alpha, size)
	{
		var symbol, rgb;
		hexColor = hexColor ? hexColor : "#E000E0";
		alpha = alpha ? alpha : this.default.alpha;
		rgb = this.ArcGIS.Color.fromHex(hexColor);
		rgb.a = alpha;
		size = size ? size : 16;
		var pathString = 'M9.000,5.000 L9.000,10.000 L-0.000,10.000 L-0.000,5.000 L4.000,5.000 L4.000,3.000 L4.000,2.000 L4.000,-0.000 L5.000,-0.000 L6.000,-0.000 L6.000,'
			+ '1.000 L5.000,1.000 L5.000,2.000 L6.000,2.000 L6.000,3.000 L5.000,3.000 L5.000,5.000 L9.000,5.000 ZM8.000,1.000 L8.000,2.000 L6.000,2.000 L6.000,1.000 L8.000,1.000 Z';
		symbol = new this.ArcGIS.SimpleMarkerSymbol();
		symbol.size = size;
		symbol.color = rgb;
		symbol.path = pathString;
		symbol.outline = new this.ArcGIS.SimpleLineSymbol({ style: "none" });

		return symbol;
	};

	MapSymbol.prototype.student = function(hexColor, alpha, size)
	{
		const self = this;
		var symbol, rgb;
		hexColor = hexColor ? hexColor : '#6B7CFC';
		alpha = alpha ? alpha : 1;
		size = size ? size : 16;
		rgb = this.ArcGIS.Color.fromHex(hexColor);
		rgb.a = alpha;
		symbol = {
			type: self.Str_SimpleMarker,
			color: rgb,
			size: size
		};
		if (size < 2)
		{
			symbol.outline = null;
		}
		else
		{
			symbol.outline = new tf.map.ArcGIS.SimpleLineSymbol({ width: 1.333 });
		}
		return symbol;
	};

	MapSymbol.prototype.assignedStudent = function(hexColor)
	{
		const self = this;
		var rgb;
		hexColor = hexColor ? hexColor : this.default.color;
		rgb = this.ArcGIS.Color.fromHex(hexColor);
		var pathString = "M101.141 14.0454C116.141 29.0454 116.141 75.0454 101.141 90.0454C93.1407 98.0454 93.1407 102.045 100.141 102.045C116.141 102.045 152.141 163.045 146."
			+ "141 179.045C143.141 186.045 135.141 192.045 127.141 192.045C118.141 192.045 113.141 210.045 111.141 249.045C108.141 306.045 108.141 307.045 78.1407 307.045C49."
			+ "1407 306.045 48.1407 305.045 45.1407 249.045C42.1407 200.045 39.1407 192.045 23.1407 192.045C-4.8593 192.045 -2.8593 160.045 27.1407 125.045C45.1407 103.045 49."
			+ "1407 92.0454 41.1407 73.0454C35.1407 56.0455 37.1407 42.0455 48.1407 26.0454C65.1407 0.0454478 83.1407 -3.95455 101.141 14.0454Z";

		return {
			type: self.Str_SimpleMarker,
			path: pathString,
			color: rgb,
			size: 20
		};
	};

	MapSymbol.prototype.unassignedStudent = function()
	{
		return this.student("#005CE6", 0.75);
	};

	MapSymbol.unassignedStudentColor = "#1940aa";
	MapSymbol.unassignedStudentHighlightColor = "#ffff00";

	MapSymbol.prototype.getUnassignedStudentSymbol = function()
	{
		return this.student(TF.Map.MapSymbol.unassignedStudentColor, 1, 10);
	};

	MapSymbol.prototype.getPartMatchStudentSymbol = function()
	{
		var symbol = this.student("#60b5ff", 1, 10);
		symbol.outline = new tf.map.ArcGIS.SimpleLineSymbol({ width: 2, color: "#005CE6" });
		return symbol;
	};

	MapSymbol.prototype.getUnassignedStudentHighlightSymbol = function()
	{
		return this.student(TF.Map.MapSymbol.unassignedStudentHighlightColor, 1, 10);
	};

	MapSymbol.prototype.getAssignedStudentSymbol = function(color)
	{
		return this.student(color, 1, 10);
	};

	MapSymbol.prototype.stop = function(hexColor, width, alpha)
	{
		const self = this;
		var rgb;
		hexColor = hexColor ? hexColor : this.default.color;
		alpha = alpha ? alpha : 1;

		rgb = this.ArcGIS.Color.fromHex(hexColor);
		rgb.a = alpha;

		return {
			type: self.Str_SimpleMarker,
			path: "M30 12 L20 12 L20 2 L12 2 L12 12 L2 12 L2 20 L12 20 L12 30 L20 30 L20 20 L30 20 Z",
			color: rgb,
			size: 14,
			outline: null
		};
	};

	MapSymbol.prototype.tripStop = function(sequence, color)
	{
		const self = this;
		var labelColor = TF.isLightness(color) ? "#000000" : "#ffffff"
		var svgString = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" width="28" height="28">' +
			'<g>' +
			'<circle r="12" cy="14" cx="14" stroke-linecap="butt" stroke="#000000" stroke-width="2" fill="{2}" />' +
			'<text text-anchor="middle" font-size="12" x="50%" y="50%" dy=".3em" stroke-width="0" fill="{1}" >{0}</text>' +
			'</g>' +
			'</svg >';
		var svg = self.Str_DataImageSvg + btoa(String.format(svgString, sequence, labelColor, color || 'gray'));
		return new tf.map.ArcGIS.PictureMarkerSymbol({ url: svg, height: 28, width: 28 });
	};

	MapSymbol.prototype.tripBoundaryPolygon = function(color)
	{
		const self = this;
		return {
			type: self.Str_SimpleFill,
			style: "solid",
			color: this.setHexColorOpacity(color, 0.2),
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: color,
				width: 2
			}
		};
	};

	MapSymbol.prototype.tripPath = function(color)
	{
		const self = this;
		return {
			type: self.Str_SimpleLine,
			style: "solid",
			color: color,
			width: TF.RoutingMap.BaseMapDataModel.getSettingByKey("pathThicknessRouting", 5)
		};
	};

	MapSymbol.prototype.createStudentLabelSymbol = function(data, autoOffset)
	{
		var self = this;
		var width = 60, height = 18;
		var svgString = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:svg='http://www.w3.org/2000/svg' width='{0}' height='{1}'>" +
			"<g>" +
			"<rect x='0' y='0' rx='3px' ry='3px' stroke-width='2px' stroke='black' width='{0}' height='{1}' fill='white'/>" +
			"<text x='5' y='{3}' color='black' font-size='12'>{2}</text>" +
			"</g>" +
			"</svg>";
		var svg = self.Str_DataImageSvg + btoa(String.format(svgString, width, height, data.studentCount + " Students", height / 2 + 4));
		return new tf.map.ArcGIS.PictureMarkerSymbol(
			{
				url: svg, height: height, width: width, xoffset: (autoOffset !== false ? (-self.offSetX - width / 2) : 0), yoffset: (autoOffset !== false ? (-self.offSetY - height / 2) : 0)
			});
	};

	MapSymbol.prototype.trialStopSymbol = function(color)
	{
		var self = this;
		var svgString = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:svg='http://www.w3.org/2000/svg' width='28' height='28'>" +
			"<g>" +
			"<circle r='12' cy='14' cx='14' stroke-linecap='butt' fill='{0}' />" +
			"<rect x='8' y='8' height='12' width='12' fill='white'/>" +
			"</g>" +
			"</svg >";
		var svg = self.Str_DataImageSvg + btoa(String.format(svgString, color || "black"));
		return new tf.map.ArcGIS.PictureMarkerSymbol({ url: svg, height: 32, width: 32 });
	};

	MapSymbol.prototype.labelSymbol = function(text, width, height, backgroundColor, borderColor, xoffset, yoffset)
	{
		var self = this;
		var svg = self.Str_DataImageSvg + btoa(
			`<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 {width} {height}" enable-background="new 0 0 {width} {height}" xml:space="preserve" >
			<rect x="0" y="0" rx="3px" ry="3px" stroke-width="2px" stroke="{borderColor}" width="{width}" height="{height}" fill="{background}"/>
			<text x="3" y="14"  font-family="Verdana" font-size="12">{content}</text></svg>`
				.replace(/{content}/g, text)
				.replace(/{borderColor}/g, borderColor)
				.replace(/{background}/g, backgroundColor)
				.replace(/{width}/g, width)
				.replace(/{height}/g, height));
		return new tf.map.ArcGIS.PictureMarkerSymbol({ url: svg, height: height + "px", width: width + "px", xoffset: xoffset + "px", yoffset: yoffset + "px" });
	};

	MapSymbol.prototype.createStopPoolSymbol = function(color)
	{
		var self = this;
		color = color ? color : self.symbolColors.bluePoint;
		return {
			type: self.Str_SimpleMarker,
			style: "circle",
			color: color,
			size: 14,
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: [0, 0, 0],
				width: 2
			}
		};
	};
	MapSymbol.prototype.highlightStopPoolSymbol = function(color)
	{
		var self = this;
		color = color ? color : self.symbolColors.bluePoint;
		return {
			type: self.Str_SimpleMarker,
			style: "circle",
			color: color,
			size: 14,
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: self.symbolColors.yellowForHighlight,
				width: 2
			}
		};
	};

	MapSymbol.prototype.PolygonReDrawSymbol = function()
	{
		var self = this;
		return {
			type: self.Str_SimpleFill,
			style: "solid",
			color: self._setOpacity(self.symbolColors.grayForEditing, 80),
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: self.symbolColors.grayForEditing,
				width: 2
			}
		};
	};

	MapSymbol.prototype.PolygonCreateSymbol = function()
	{
		var self = this;
		return {
			type: self.Str_SimpleFill,
			style: "solid",
			color: self._setOpacity(self.symbolColors.orangeForCreate, 80),
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: self.symbolColors.orangeForCreate,
				width: 2
			}
		};
	};
	MapSymbol.prototype.highlightPolygonSymbol = function()
	{
		var self = this;
		return {
			type: self.Str_SimpleFill,
			style: "solid",
			color: self._setOpacity(self.symbolColors.orangeForCreate, 80),
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: self.symbolColors.yellowForHighlight,
				width: 2
			}
		};
	};

	MapSymbol.prototype.getHighlightLineSymbol = function()
	{
		const self = this;
		return {
			type: self.Str_SimpleLine,
			color: [255, 255, 0],
			width: 5,
		};
	};

	MapSymbol.prototype.tripStopSimpleMarker = function(color, size)
	{
		const self = this;
		return {
			type: self.Str_SimpleMarker,
			style: "circle",
			color: color,
			size: size || 16,
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: "black",
				width: 2
			}
		};
	};

	MapSymbol.prototype.tripStopLabel = function(color)
	{
		var labelColor = TF.isLightness(color) ? "#000000" : "#ffffff"
		return {
			type: "text",
			text: "Stop",
			yoffset: -3,
			color: labelColor,
			font: {
				size: 12
			}
		};
	};

	MapSymbol.prototype.studentCount = function(sequence, color)
	{
		var self = this;
		var labelColor = TF.isLightness(color) ? "#000000" : "#ffffff"
		var svgString = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" width="28" height="28">' +
			'<g>' +
			'<circle r="12" cy="14" cx="14" stroke-linecap="butt" fill="{2}" />' +
			'<text text-anchor="middle" font-size="12" x="50%" y="50%" dy=".3em" stroke-width="0" fill="{1}" >{0}</text>' +
			'</g>' +
			'</svg >';
		var svg = self.Str_DataImageSvg + btoa(String.format(svgString, sequence, labelColor, color));
		return new tf.map.ArcGIS.PictureMarkerSymbol({ url: svg, height: 24, width: 24 });
	};

	MapSymbol.prototype.schoolLocation = function(color, outlineColor)
	{
		color = color || [112, 123, 249];
		outlineColor = outlineColor || [215, 236, 254];
		var symbol = new tf.map.ArcGIS.SimpleMarkerSymbol(),
			pathString = "M7,8.5 L7,29 L8,29 L8,14 L23,14 L23,3 L7,3 L7,8.5 L7,8.5 Z";
		symbol.size = 20;
		symbol.xoffset = 7;
		symbol.yoffset = 9;
		symbol.color = color;
		symbol.path = pathString;
		symbol.outline = new tf.map.ArcGIS.SimpleLineSymbol({
			color: outlineColor,
			width: 2
		});
		return symbol;
	};

	MapSymbol.prototype.getVehicleSymbol = function(heading)
	{
		var url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAUgQAAFIEBla/'
			+ 'LogAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAPlSURBVEiJnZXPSyRHFMe/VV09PXOYQBbZ0ZVRL7ogITE6Bxf0IrL+2MFA2KMKC4InPe'
			+ '+e9Jbsn6AxIYi3eIk/unvUm5LdwxgkOBvQU2ZWtwc1l1no+VFVLwedQd0Zd8wXGpr3Xr0P79WrKoY69fvW1qOAUs1E9CUR/StN8/S7p09P61nL7nJubGx8xTifY'
			+ 'ow9J6Lm237O2HtFtCo4XxoeHk7dC5JIJB5KrV+DaNKyLNXU2Gg2NDQgFArBNE2USiX4vo+z83N4nlcqFAoGA34F8HJ0dPTss5B11/3GINoUQkQed3SIaDQKxmoX'
			+ 'TERIp9M4Oj6WUkqPAc9GRkb+qgm5AvwRDocDsVhMBC2rZvLbyufzSO7vy1wuV2TAk+ugCiSRSDxUWv8ZDocjT3p7hWEYdQPKUkrhzdu3MpfLZUH0bbl1vBwgtX4t'
			+ 'hIjEYjFhGAaI6N4QwzAQ6+kRQogIMfZD2c6ByykC0eTjjo5KixhjmJmZweLiIvL5fN2gYDCIjvZ2AaIXtm13ViCM8ynLslQ0Gr2xIB6PY3p6Gm1tbZifn8fFxUVd'
			+ 'oJaWFliWpYhoqmJ0HCeTeveOqqmvr48AEACyLIsmJiYolUpVjb2uw1SKbMd5D+DyJG/aNmWz2arBrutWIOWPc06Dg4O0trZGWuuq67xsljZtm1zXbeIBpZoBIBQKV'
			+ 'S19aGgIfX19N2xaa+zs7GBsbAzd3d1V9y0UDAIApJSPuAIeAIBpmjV7PD4+XtN3cHCA6elp9Pf3I5vNVuyBQODyxzAaONP6AgCKpVLNRCsrKzV9XV1dWFhYwO7uLi'
			+ 'KRSMVeLBYBAMTYmZCmeSqkRN738UU4/EmSRCKBvb29GzbOOQYGBjA7O4t4PF712vF9/zJWqcub2nGcTK2J+d/TdXhItuv+A1ydE0W0+sHzSnTrlJeriEQimJubw8n'
			+ 'JCZaXl9HZ2VmzfcDlYHieJ4loFQAEAAjOlwqFwmw6nUZra2sleGNjAwsLC5icnETwalrqUTqTQaFYZKT10g2Hbds/b21vl3zfJyKqOf+fk+/7tLW9Xdp0nJ/Kufk1'
			+ 'zksppZfc35dKqTvfkFpSSiGZTEolpVcwzZdl+41MjuN8TcCbcDgciPX0iPu0KJ/PI5lMytzHjwWtVG88Hj+sCrkG2hRCNHa0t4uWlpY7q9JaI53J4PjoSEqtT7WUz'
			+ '64DqkIAYH19vYEL8SOIXliWpRqvvfEB00Tx6o0/PzuDl82WCoUCZ8Av+UDg1feDg59c1Xc23rbtTiKa4obxXGsdve3nnGc00W+k1FI8Hv+7Vp66d9d13SalVDNj7I'
			+ 'HW+kIIcTo8PPyhnrX/ASZevYMuAxBOAAAAAElFTkSuQmCC';
		var symbol = new tf.map.ArcGIS.PictureMarkerSymbol({ url: url, height: 25, width: 25 });
		if (heading)
		{
			symbol.angle = heading - 90;
		}
		else
		{
			symbol.angle = -90;
		}
		return symbol;
	};

	MapSymbol.prototype.getEventSymbol = function(isStopEvent, color)
	{
		var symbol;
		if (isStopEvent)
		{
			symbol = this.crossInCircle(color, 18, 0);
		} else
		{
			symbol = new tf.map.ArcGIS.SimpleMarkerSymbol();
			symbol.color = new tf.map.ArcGIS.Color(color);
			symbol.size = 5;
		}
		return symbol;
	};

	MapSymbol.crossInCircleTemplate =
		'<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24" x="0px" xml:space="preserve" y="0px">'
		+ '<g>'
		+ '<circle cx="12" cy="12" fill="none" r="11" stroke="black" stroke-miterlimit="10" stroke-width="1"/>'
		+ '<circle cx="12" cy="12" fill="white" r="10"/>'
		+ '<circle cx="12" cy="12" fill="none" r="10" stroke="{color}" stroke-miterlimit="10" stroke-width="1"/>'
		+ '<rect x="9" y="5" height="14" width="6" fill="black"/>'
		+ '<rect x="5" y="9" height="6" width="14" fill="black"/>'
		+ '<rect x="10" y="6" height="12" width="4" fill="{color}"/>'
		+ '<rect x="6" y="10" height="4" width="12" fill="{color}"/>'
		+ '</g>'
		+ '</svg>';
	MapSymbol.circleTemplate = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 6 6" viewBox="0 0 6 6" x="0px" xml:space="preserve" y="0px">'
		+ '<circle cx="3" cy="3" r="3" fill="black"/>'
		+ '<circle cx="3" cy="3" r="2" fill="{color}"/>'
		+ '</svg>';
	MapSymbol.prototype.crossInCircle = function(color, size, offset)
	{
		var self = this;
		var svg = self.Str_DataImageSvg + btoa(Symbol.crossInCircleTemplate.split("{color}").join(color));
		return this.svgSymbol(svg, size, offset);
	};

	MapSymbol.prototype.circle = function(color)
	{
		var self = this;
		var size = [6, 6];
		var svg = self.Str_DataImageSvg + btoa(Symbol.circleTemplate.split("{color}").join(color));
		return this.svgSymbol(svg, size);
	};

	MapSymbol.prototype.editVertex = function()
	{
		var symbol = new this.ArcGIS.SimpleMarkerSymbol();
		symbol.setSize(10);
		symbol.setOutline(new this.ArcGIS.SimpleLineSymbol().setColor(new this.ArcGIS.Color([255, 128, 0, 0.6])).setWidth(2));
		symbol.setColor(new this.ArcGIS.Color([255, 128, 0, 0.5]));

		return symbol;
	};

	MapSymbol.prototype.editGhostVertex = function()
	{
		var symbol = new this.ArcGIS.SimpleMarkerSymbol();
		symbol.setSize(10);
		symbol.setOutline(new this.ArcGIS.SimpleLineSymbol().setColor(new this.ArcGIS.Color([255, 128, 0, 0.3])).setWidth(2));
		symbol.setColor(new this.ArcGIS.Color([255, 128, 0, 0.2]));

		return symbol;
	};

	MapSymbol.prototype.editGhostLine = function(hexColor)
	{
		hexColor = hexColor ? hexColor : "#89C8C7";
		var rgb = this.ArcGIS.Color.fromHex(hexColor);
		rgb.a = 0.4;

		var symbol = new this.ArcGIS.SimpleLineSymbol();
		symbol.style = this.ArcGIS.SimpleLineSymbol.STYLE_LONGDASH;
		symbol.color = rgb;
		symbol.width = 2;

		return symbol;
	};

	MapSymbol.prototype.georegionPoint = function()
	{
		const self = this;
		return {
			type: self.Str_SimpleMarker,
			color: [18, 89, 208, 1],
			size: 6
		};
	};

	MapSymbol.prototype.georegionPolygon = function(geoRegionType)
	{
		const self = this;
		var opacity = 0,
			borderWidth = geoRegionType ? geoRegionType.BoundaryThickness : 1,
			currentColor = geoRegionType && geoRegionType.BoundaryColor ? this.ArcGIS.Color.fromHex("#" + geoRegionType.BoundaryColor) : this.ArcGIS.Color.fromHex('#FF0000');
		if (geoRegionType)
		{
			if (geoRegionType.BoundaryFill === 'Semi')
			{
				opacity = 0.4;
			}
			else if (geoRegionType.BoundaryFill === 'Solid')
			{
				opacity = 1;
			}
		}

		var outLineColor = currentColor.clone(),
			fillColor = currentColor.clone();
		fillColor.a = opacity;
		return {
			type: self.Str_SimpleFill,
			style: "solid",
			color: fillColor,
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: outLineColor,
				width: borderWidth
			}
		};
	};

	MapSymbol.prototype.geosearchPolygon = function()
	{
		var symbol = null;
		symbol = new this.ArcGIS.SimpleFillSymbol();
		symbol.setColor(new this.ArcGIS.Color([18, 89, 208, 0.3]));
		symbol.setOutline(new this.ArcGIS.SimpleLineSymbol().setWidth(1).setColor([18, 89, 208, 0.6]));
		return symbol;
	};

	MapSymbol.prototype.geosearchLine = function()
	{
		var symbol = null;
		symbol = new this.ArcGIS.ColorSimpleLineSymbol().setWidth(1).setColor([18, 89, 208, 0.6]);
		return symbol;
	};

	MapSymbol.prototype.trip = function(hexColor, width, alpha, style)
	{
		var symbol, rgb;
		hexColor = hexColor ? hexColor : this.default.color;
		width = width ? width : 2;
		alpha = alpha ? alpha : 0.4;
		rgb = this.ArcGIS.Color.fromHex(hexColor);
		rgb.a = alpha;

		style = style ? style : this.ArcGIS.SimpleLineSymbol.STYLE_SOLID;

		symbol = new this.ArcGIS.SimpleLineSymbol().setWidth(width).setColor(new this.ArcGIS.Color(rgb)).setStyle(style);
		return symbol;
	};

	MapSymbol.prototype.svgSymbol = function(svg, size, offset)
	{
		return new tf.map.ArcGIS.PictureMarkerSymbol({
			url: svg,
			height: $.isArray(size) ? size[0] : size,
			width: $.isArray(size) ? size[1] : size,
			xoffset: offset ? offset.x : 0,
			yoffset: offset ? offset.y : 0
		});
	};

	MapSymbol.prototype.pathSymbol = function(pathString, color, size, isOutline, outlineColor, outlineWidth)
	{
		const self = this;
		var symbol, dString;
		dString = $(pathString).attr("d");
		symbol = {
			type: self.Str_SimpleMarker,
			style: "path",
			path: dString,
			color: color,
			size: Number(size),
			outline: {
				style: "none",
				width: 0
			}
		}
		if (isOutline)
		{
			symbol.outline = {
				style: "solid",
				color: outlineColor,
				width: Number(outlineWidth)
			}
			symbol.size = Number(size) + Number(outlineWidth)
		}
		return symbol;
	};

	MapSymbol.prototype.clusterPoint = function(size)
	{
		var symbol;
		size = size ? size : 16;
		symbol = new this.ArcGIS.SimpleMarkerSymbol().setSize(size).setColor(new this.ArcGIS.Color.fromHex('#000000'))
			.setOutline(new this.ArcGIS.SimpleLineSymbol().setColor(new this.ArcGIS.Color.fromHex('#FFFFFF')).setWidth(2));
		return symbol;
	};

	MapSymbol.prototype.label = function(text, xoffset, yoffset)
	{
		return {
			type: "text",
			text: text ? text : "add text here.",
			color: "green",
			font: {
				family: "Calibri Light",
				size: 12
			},
			xoffset: xoffset ? xoffset : -60,
			yoffset: yoffset ? yoffset : 10,
		};
	};

	MapSymbol.prototype.snapPoint = function()
	{
		var symbol = new this.ArcGIS.SimpleMarkerSymbol();
		symbol.setStyle(this.ArcGIS.SimpleMarkerSymbol.STYLE_SQUARE);
		symbol.setOutline(new this.ArcGIS.SimpleLineSymbol().setColor(new this.ArcGIS.Color([137, 200, 199])));
		symbol.setColor(new this.ArcGIS.Color([137, 200, 199, 0.4]));
		symbol.setSize(10);

		return symbol;
	};

	MapSymbol.prototype.stopBuffer = function(hexColor)
	{
		var symbol, rgb;
		hexColor = hexColor ? hexColor : this.default.color;
		rgb = this.ArcGIS.Color.fromHex(hexColor);

		symbol = new this.ArcGIS.SimpleFillSymbol();
		rgb.a = 0.5;
		symbol.setOutline(new this.ArcGIS.SimpleLineSymbol().setColor(new this.ArcGIS.Color(rgb)));

		rgb.a = 0.2;
		symbol.setColor(new this.ArcGIS.Color(rgb));

		return symbol;
	};

	MapSymbol.prototype.transparentStop = function()
	{
		return this.stop("#000000", null, 0);
	};

	MapSymbol.prototype.highlightStop = function()
	{
		return this.stop(this.selectionColor);
	};

	MapSymbol.prototype.drawingCursor = function()
	{
		var symbol = new this.ArcGIS.SimpleMarkerSymbol();
		symbol.setOutline(new this.ArcGIS.SimpleLineSymbol().setColor(new this.ArcGIS.Color([137, 200, 199])));
		symbol.setColor(new this.ArcGIS.Color([137, 200, 199, 0.5]));
		symbol.setSize(10);
		return symbol;
	};

	MapSymbol.prototype.editGhostStop = function()
	{
		var symbol = this.highlightStop();
		symbol.setOutline(new this.ArcGIS.SimpleLineSymbol().setStyle(this.ArcGIS.SimpleLineSymbol.STYLE_DASH));
		symbol.setColor(new this.ArcGIS.Color([0, 0, 0, 0]));
		return symbol;
	};

	MapSymbol.prototype.measurementLocation = function()
	{
		var self = this;
		return new self.ArcGIS.SimpleMarkerSymbol()
			.setColor([255, 255, 255, 1])
			.setOutline(new self.ArcGIS.SimpleLineSymbol().setWidth(1))
			.setSize(8);
	};

	MapSymbol.prototype.measurementLine = function()
	{
		return new this.ArcGIS.SimpleLineSymbol().setWidth(1).setColor([40, 128, 252, 1]);
	};

	MapSymbol.prototype.measurementLineVertex = function()
	{
		// This is intentional
	};

	MapSymbol.prototype.measurementPolygon = function()
	{
		// This is intentional
	};

	MapSymbol.prototype.drawPointSymbol = function()
	{
		var self = this;
		return {
			type: self.Str_SimpleMarker,
			color: self.symbolColors.bluePoint,
			size: 6,
			xoffset: 0,
			yoffset: 0,
			style: "circle",
		};
	};

	MapSymbol.prototype.editPointSymbol = function()
	{
		var self = this;
		return {
			type: self.Str_SimpleMarker,
			color: self.symbolColors.grayForEditing,
			size: 8,
			xoffset: 0,
			yoffset: 0,
			style: "circle",
		};
	};

	MapSymbol.prototype.highlightPointSymbol = function(size)
	{
		const self = this;
		return {
			type: self.Str_SimpleMarker,
			color: this.symbolColors.bluePoint,
			size: size ? size : 8,
			xoffset: 0,
			yoffset: 0,
			style: "circle",
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: this.symbolColors.yellowForHighlight,
				width: 2
			}
		};
	};

	MapSymbol.prototype.drawPolylineSymbol = function()
	{
		var self = this;
		return {
			type: self.Str_SimpleLine,
			style: "solid",
			color: self.symbolColors.orangeForCreate,
			width: 2
		};
	};

	MapSymbol.prototype.editPolylineSymbol = function()
	{
		const self = this;
		return {
			type: self.Str_SimpleLine,
			style: "solid",
			color: this.symbolColors.grayForEditing,
			width: 2
		};
	};

	MapSymbol.prototype.drawPolygonSymbol = function()
	{
		var self = this;
		return new tf.map.ArcGIS.SimpleFillSymbol({
			style: "solid",
			color: self.symbolColors.orangeForCreate.concat(0.5),
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: self.symbolColors.orangeForCreate,
				width: 2
			}
		});
	};

	MapSymbol.prototype.editPolygonSymbol = function()
	{
		const self = this;
		return new tf.map.ArcGIS.SimpleFillSymbol({
			style: "solid",
			color: this.symbolColors.grayForEditing.concat(0.5),
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: this.symbolColors.grayForEditing,
				width: 2
			}
		});
	};

	MapSymbol.prototype.postalCodePolygonSymbol = function()
	{
		const self = this;
		return new tf.map.ArcGIS.SimpleFillSymbol({
			style: "solid",
			color: [0, 0, 0, 0],
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: [0, 0, 0, 1],
				width: 2
			}
		});
	};

	MapSymbol.prototype.waterPolygonSymbol = function()
	{
		const self = this;
		return new tf.map.ArcGIS.SimpleFillSymbol({
			style: "solid",
			color: this.symbolColors.blueForSelect.concat(0.5),
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: this.symbolColors.blueForSelect,
				width: 2
			}
		});
	};

	MapSymbol.prototype.waterPolylineSymbol = function()
	{
		const self = this;
		return {
			type: self.Str_SimpleLine,
			style: "solid",
			color: this.symbolColors.blueForSelect,
			width: 2
		};
	};

	MapSymbol.prototype.landmarkPolygonSymbol = function()
	{
		const self = this;
		return new tf.map.ArcGIS.SimpleFillSymbol({
			style: "solid",
			color: this.symbolColors.orangeForCreate.concat(0.5),
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: this.symbolColors.orangeForCreate,
				width: 2
			}
		});
	};

	MapSymbol.prototype.landmarkPolylineSymbol = function()
	{
		const self = this;
		return {
			type: self.Str_SimpleLine,
			style: "solid",
			color: this.symbolColors.orangeForCreate,
			width: 2
		};
	};

	MapSymbol.prototype.landmarkPointSymbol = function()
	{
		const self = this;
		return {
			type: self.Str_SimpleMarker,
			color: this.symbolColors.orangeForCreate,
			size: 8,
			xoffset: 0,
			yoffset: 0,
			style: "circle",
			// outline: {
			// 	type: self.Str_SimpleLine,
			// 	style: "solid",
			// 	color: this.symbolColors.orangeForCreate,
			// 	width: 2
			// }
		};
	};

	MapSymbol.prototype.railroadPolylineSymbol = function()
	{
		const self = this;
		return {
			type: self.Str_SimpleLine,
			style: "solid",
			color: this.symbolColors.grayForEditing.concat(0.5),
			width: 2
		};
	};

	MapSymbol.prototype.polygonSymbol = function(color, outlineColor)
	{
		const self = this;
		color = TF.Helper.MapHelper.getColorArray(color);
		return new tf.map.ArcGIS.SimpleFillSymbol({
			style: "solid",
			color: color.concat(0.5),
			outline: {
				type: self.Str_SimpleLine,
				style: "solid",
				color: outlineColor || color,
				width: 2
			}
		});
	};

	MapSymbol.prototype._setOpacity = function(color, opacity)
	{
		return color.concat([opacity / 255]);
	};

	MapSymbol.prototype.setHexColorOpacity = function(hexColor, opacity)
	{
		var currentColor = hexColor ? tf.map.ArcGIS.Color.fromHex(hexColor) : tf.map.ArcGIS.Color.fromHex('#FF0000'),
			currentOpacity = opacity ? opacity : 0;
		currentColor.a = currentOpacity;
		return currentColor;
	};

	MapSymbol.prototype.arrow = function(color)
	{
		const self = this;
		color = color || "#000000";
		return {
			type: self.Str_SimpleMarker,
			size: 17,
			path: "M0 0 L14 12 L0 24 L0 22 L 12 12 L 0 2 Z",
			angle: 0,
			color: color,
			outline: {
				width: 1,
				color: color,
			}
		};
	};

	MapSymbol.prototype.arrowToPoint = function(color)
	{
		const self = this;
		color = color || "#000000";
		return {
			type: self.Str_SimpleMarker,
			size: 24,
			color: color,
			outline: {
				color: [255, 255, 255],
				width: 2
			},
			angle: -45,
			yoffset: -15,
			xoffset: -15,
			path: "M16 2 L16 10 L2 10 L2 22 L16 22 L16 30 L30 16 Z"
		};
	};

	MapSymbol.prototype.arrowOnSide = function(color)
	{
		const self = this;
		return {
			type: self.Str_SimpleMarker,
			size: 20,
			path: "M45 2 L45 13 L2 13 L2 19 L45 19 L45 30 L75 16 Z",
			color: color || "#000000",
			angle: 0,
			outline: null
		};
	};

	MapSymbol.prototype.fieldTripLocation = function()
	{
		return {
			type: "picture-marker",
			url: "./global/img/map/map-pin.png",
			width: "32px",
			height: "32px",
		};
	}

	MapSymbol.prototype.dispose = function()
	{
		tfdispose(this);
	};
})();
