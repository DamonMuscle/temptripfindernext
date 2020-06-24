(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").GeoDistanceBlock = GeoDistanceBlock;

	function GeoDistanceBlock(options, dataBlockStyles, lightDetailView)
	{
		var self = this;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, lightDetailView);

		var detailViewHelper = tf.helpers.detailViewHelper,
			title = (options.customizedTitle || options.title),
			entity = lightDetailView.recordEntity;

		self.isCreateGridNewRecord = lightDetailView.isCreateGridNewRecord;
		self.fieldContentChangedEvent = lightDetailView.fieldContentChangedEvent;
		self.gridType = lightDetailView.gridType;
		self.recordEntity = lightDetailView.recordEntity;
		self.options = options;
		self.uniqueClassName = options.uniqueClassName || detailViewHelper.generateUniqueClassName();

		var $itemContent = detailViewHelper.getItemContent("None", dataBlockStyles),
			$gridStackItem = $(String.format("\
					<div class='grid-stack-item-content general-stack-item geodistance' \
							style='background:{0};border-color:{1}' data-block-field-name='{2}'>\
						<input class='item-title' type='text' style='color:{3}' value='{4}' />\
						<div class='item-title' style='color:{5}'>{4}</div>\
					</div>",
				dataBlockStyles.backgroundColor,
				dataBlockStyles.borderColor,
				options.field,
				dataBlockStyles.titleColor,
				title,
				dataBlockStyles.titleColor)),
			$itemDom = $("<div></div>").addClass(self.uniqueClassName);

		$gridStackItem.append($itemContent);
		$itemDom.append($gridStackItem);
		self.$el = $itemDom;

		if (!self.isReadMode())
		{
			$itemContent.text(options.defaultValue);
		}
		else
		{
			var distance = entity[options.field];
			if (typeof distance === "number")
			{
				distance = distance.toFixed(2);
			}
			else
			{
				distance = "None";
			}
			$itemContent.text(distance);
		}

		self.detectFieldChangeForGeodistance = self.detectFieldChangeForGeodistance.bind(self);
	}

	GeoDistanceBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	GeoDistanceBlock.prototype.initEvents = function()
	{
		var self = this;
		self.fieldContentChangedEvent.subscribe(self.detectFieldChangeForGeodistance);
	};

	GeoDistanceBlock.prototype.refresh = function()
	{
		var self = this,
			$gridStackItem = self.$el.find(".grid-stack-item-content"),
			$newGridStackItem = $(String.format("\
					<div class='grid-stack-item-content general-stack-item geodistance' \
							style='background:{0};border-color:{1}' data-block-field-name='{2}'>\
						<input class='item-title' type='text' style='color:{3}' value='{4}' />\
						<div class='item-title' style='color:{5}'>{4}</div>\
					</div>",
				self.dataBlockStyles.backgroundColor,
				self.dataBlockStyles.borderColor,
				self.options.field,
				self.dataBlockStyles.titleColor,
				(self.options.customizedTitle || self.options.title),
				self.dataBlockStyles.titleColor));

		$newGridStackItem.append(tf.helpers.detailViewHelper.getItemContent(self.content, self.dataBlockStyles));
		$gridStackItem.parent().append($newGridStackItem);
		$gridStackItem.remove();
	};

	GeoDistanceBlock.prototype.detectFieldChangeForGeodistance = function(evt, data)
	{
		var self = this,
			gridType = self.gridType,
			entity = self.recordEntity,
			fieldsMap = {
				"AttendanceSchoolName": "Mifromschl",
				"ResidenceSchoolName": "MifromResidSch"
			};

		if (self.isCreateGridNewRecord || !entity)
		{
			return;
		}

		if (gridType !== "student" || entity.Geocoded === undefined || !entity.Geocoded || !(data.fieldName in fieldsMap))
		{
			return;
		}

		var distanceFieldName = fieldsMap[data.fieldName],
			$gridStackItem = self.$el.find("div.grid-stack-item-content[data-block-field-name='" + distanceFieldName + "']");

		if ($gridStackItem.length < 1)
		{
			return;
		}

		var $itemContent = $gridStackItem.find(".item-content");
		self.refresh($itemContent, entity, data.value);
	};

	GeoDistanceBlock.prototype.dispose = function()
	{
		this.fieldContentChangedEvent.unsubscribe(this.detectFieldChangeForGeodistance);
	};

})();