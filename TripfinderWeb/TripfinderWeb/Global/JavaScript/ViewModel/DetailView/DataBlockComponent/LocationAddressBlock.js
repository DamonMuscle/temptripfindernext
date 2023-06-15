(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").LocationAddressBlock = LocationAddressBlock;

	var ROW_COUNT = 2;

	function LocationAddressBlock(options, dataBlockStyles, currentWidth, detailView)
	{
		var self = this;

		options.rowCount = ROW_COUNT;
		options.minWidth = currentWidth > 1 ? 2 : 1;

		TF.DetailView.DataBlockComponent.EditableFieldGroupBlock.call(self, options, dataBlockStyles, currentWidth, detailView);

		self.init(options);
	}

	LocationAddressBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.EditableFieldGroupBlock.prototype);

	/**
	 * Customization on element.
	 *
	 * @param {JQuery} $element
	 */
	LocationAddressBlock.prototype.customizeBlockElement = function($element)
	{
		var self = this,
			entity = self.entity,
			geoData = self.prepareData(entity),
			$stack = $element.find(".grid-stack-item-content"),
			$item = $stack.find(".item-content"),
			$copyAddressBtn = $("<div/>", { class: "copy-address-btn", text: "Copy From Mailing" });

		$stack.addClass("address-stack-item");
		$item.addClass("address-content");

		$element.find("div.item-title").append($copyAddressBtn);

		if (self.isReadOnly())
		{
			$copyAddressBtn.addClass("disabled");
		}

		var rowElements = $item.find(".editable-field-group-row");

		self.innerFields.forEach(item =>
		{
			let fieldValue = geoData[item.field];
			if (item.format)
			{
				fieldValue = tf.helpers.detailViewHelper.formatNumberContent(fieldValue, item.format);
			}
			const $field = self.createTextFieldElement(item, fieldValue);

			$(rowElements[item.row - 1]).append($field);
		});
	};

	/**
	 * Prepare required geo data.
	 *
	 * @param {Object} entity
	 * @returns
	 */
	LocationAddressBlock.prototype.prepareData = function(entity)
	{
		var self = this;
		let geoStreet = "None",
			geoZip = "None",
			geoCity = "None",
			geocodeScore = "None";

		if (self.isReadMode())
		{
			if (!self.isCreateGridNewRecord && entity)
			{
				if (entity.GeoStreet)
				{
					geoStreet = entity.GeoStreet;
				}

				if (entity.GeoZip)
				{
					geoZip = entity.GeoZip;
				}

				if (entity.GeoCity)
				{
					geoCity = entity.GeoCity;
				}

				if (entity.GeocodeScore || entity.GeocodeScore === 0)
				{
					geocodeScore = entity.GeocodeScore;
				}
			}
		}
		else
		{
			geoStreet = self.defaultData.GeoStreet;
			geoZip = self.defaultData.GeoZip;
			geoCity = self.defaultData.GeoCity;
			geocodeScore = self.defaultData.GeocodeScore;
		}

		return {
			GeoStreet: geoStreet,
			GeoZip: geoZip,
			GeoCity: geoCity,
			GeocodeScore: geocodeScore
		};
	};

	LocationAddressBlock.prototype.initEvents = function()
	{
		var self = this;
		if (self.isReadMode() && !self.isReadOnly())
		{
			self.$el.on('click', '.copy-address-btn', self.onCopyBtnClick.bind(self));
		}
	};

	LocationAddressBlock.prototype.onCopyBtnClick = function(e)
	{
		const self = this, helper = self.fieldEditorHelper;;

		if (self.isCreateGridNewRecord)
		{
			return;
		}

		e.stopPropagation();

		const updateGeoAddressFields = function(sourceValue, sourceContent, targetFieldName, title)
		{
			var $relatedFieldContents = self.$el.find(`.editable-field-container[data-block-field-name='${targetFieldName}'] .editable-field-value`);

			if (sourceContent !== $relatedFieldContents.text())
			{
				helper.editFieldList[targetFieldName] = {
					value: sourceValue,
					blockName: targetFieldName,
					title: title
				};
				helper._updateGeneralFieldsContent(targetFieldName, sourceContent, { updateAll: true });
				$relatedFieldContents.text(sourceContent);

				self.obEditing(true);
			}
		}

		const copyGeoAddressFields = function(sourceFieldName, targetFieldName, title)
		{
			var sourceValue;
			if (helper.editFieldList[sourceFieldName])
			{
				sourceValue = helper.editFieldList[sourceFieldName].value;
			} else
			{
				sourceValue = self.entity[sourceFieldName];
			}
			updateGeoAddressFields(sourceValue, sourceValue || "None", targetFieldName, title);
		};

		copyGeoAddressFields("Street", "GeoStreet", "GeoCode Address Street");
		copyGeoAddressFields("City", "GeoCity", "GeoCode Address City/Town");
		copyGeoAddressFields("Zip", "GeoZip", "GeoCode Address Postal Code");
	};

	LocationAddressBlock.prototype.dispose = function()
	{
		this.$el.off('click');
	};
})();